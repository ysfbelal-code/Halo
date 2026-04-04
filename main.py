"""
Brainrot Blocker — FastAPI Backend
Handles: auth, blocklist management, MDM enrollment, device management, logs
"""

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
import bcrypt
import jwt
import os

from database import get_db, init_db
from models import Family, Device, BlocklistEntry, Schedule, InterceptionLog
from wordlist import DEFAULT_BRAINROT_WORDS
from mdm_manager import generate_enrollment_profile, generate_ca_cert

# ── Config ────────────────────────────────────────────────────────────────────
SECRET_KEY = os.getenv("SECRET_KEY", "change-this-in-production-please")
ALGORITHM  = "HS256"
TOKEN_EXPIRE_HOURS = 72
SERVER_HOST = os.getenv("SERVER_HOST", "localhost")

app = FastAPI(title="Brainrot Blocker API", version="1.0.0")
security = HTTPBearer()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    init_db()
    generate_ca_cert()  # generate CA cert once if it doesn't exist


# ── Auth helpers ───────────────────────────────────────────────────────────────
def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def verify_password(pw: str, hashed: str) -> bool:
    return bcrypt.checkpw(pw.encode(), hashed.encode())


def create_token(email: str) -> str:
    exp = datetime.utcnow() + timedelta(hours=TOKEN_EXPIRE_HOURS)
    return jwt.encode({"sub": email, "exp": exp}, SECRET_KEY, algorithm=ALGORITHM)


def get_current_family(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> Family:
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    family = db.query(Family).filter(Family.email == email).first()
    if not family:
        raise HTTPException(status_code=401, detail="Family not found")
    return family


# ── Pydantic schemas ───────────────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    parent_name: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AddDeviceRequest(BaseModel):
    device_name: str
    child_name: str
    platform: str = "ios"


class AddWordRequest(BaseModel):
    word: str
    category: str = "custom"


class AddScheduleRequest(BaseModel):
    label: str
    days: list[str]
    block_from: str
    block_until: str
    block_all: bool = False


class LogRequest(BaseModel):
    family_token: str
    device_name: str
    platform: str
    matched_word: str
    video_title: Optional[str] = ""


# ── Auth routes ────────────────────────────────────────────────────────────────
@app.post("/auth/register")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(Family).filter(Family.email == req.email).first():
        raise HTTPException(400, "Email already registered")

    family = Family(
        email=req.email,
        password_hash=hash_password(req.password),
        parent_name=req.parent_name,
    )
    db.add(family)
    db.flush()

    # Seed default brainrot words
    for word in DEFAULT_BRAINROT_WORDS:
        db.add(BlocklistEntry(family_id=family.id, word=word, category="brainrot"))

    db.commit()
    return {"token": create_token(req.email), "parent_name": req.parent_name}


@app.post("/auth/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    family = db.query(Family).filter(Family.email == req.email).first()
    if not family or not verify_password(req.password, family.password_hash):
        raise HTTPException(401, "Invalid credentials")
    return {"token": create_token(req.email), "parent_name": family.parent_name}


# ── Blocklist routes ───────────────────────────────────────────────────────────
@app.get("/blocklist")
def get_blocklist(family: Family = Depends(get_current_family), db: Session = Depends(get_db)):
    entries = db.query(BlocklistEntry).filter(
        BlocklistEntry.family_id == family.id,
        BlocklistEntry.active == True,
    ).all()
    return {
        "words": [e.word for e in entries],
        "entries": [{"id": e.id, "word": e.word, "category": e.category, "active": e.active} for e in entries],
    }


@app.get("/blocklist/raw/{family_id}")
def get_blocklist_raw(family_id: str, db: Session = Depends(get_db)):
    """Called by mitmproxy — no auth, internal only (firewall this endpoint in prod)"""
    entries = db.query(BlocklistEntry).filter(
        BlocklistEntry.family_id == family_id,
        BlocklistEntry.active == True,
    ).all()
    return {"words": [e.word for e in entries]}


@app.post("/blocklist/add")
def add_word(req: AddWordRequest, family: Family = Depends(get_current_family), db: Session = Depends(get_db)):
    existing = db.query(BlocklistEntry).filter(
        BlocklistEntry.family_id == family.id,
        BlocklistEntry.word == req.word.lower().strip(),
    ).first()
    if existing:
        existing.active = True
        db.commit()
        return {"status": "reactivated", "word": req.word}

    entry = BlocklistEntry(family_id=family.id, word=req.word.lower().strip(), category=req.category)
    db.add(entry)
    db.commit()
    return {"status": "added", "word": req.word}


@app.delete("/blocklist/{entry_id}")
def remove_word(entry_id: str, family: Family = Depends(get_current_family), db: Session = Depends(get_db)):
    entry = db.query(BlocklistEntry).filter(
        BlocklistEntry.id == entry_id,
        BlocklistEntry.family_id == family.id,
    ).first()
    if not entry:
        raise HTTPException(404, "Entry not found")
    entry.active = False
    db.commit()
    return {"status": "removed"}


# ── Device routes ──────────────────────────────────────────────────────────────
@app.get("/devices")
def list_devices(family: Family = Depends(get_current_family), db: Session = Depends(get_db)):
    devices = db.query(Device).filter(Device.family_id == family.id).all()
    return [
        {
            "id": d.id,
            "device_name": d.device_name,
            "child_name": d.child_name,
            "platform": d.platform,
            "enrolled": d.enrolled,
            "last_seen": d.last_seen,
        }
        for d in devices
    ]


@app.post("/devices/add")
def add_device(req: AddDeviceRequest, family: Family = Depends(get_current_family), db: Session = Depends(get_db)):
    device = Device(
        family_id=family.id,
        device_name=req.device_name,
        child_name=req.child_name,
        platform=req.platform,
    )
    db.add(device)
    db.commit()
    db.refresh(device)
    return {"device_id": device.id, "status": "added"}


@app.get("/devices/{device_id}/enroll")
def enroll_device(device_id: str, family: Family = Depends(get_current_family), db: Session = Depends(get_db)):
    """Returns a .mobileconfig MDM enrollment profile for the device"""
    device = db.query(Device).filter(
        Device.id == device_id,
        Device.family_id == family.id,
    ).first()
    if not device:
        raise HTTPException(404, "Device not found")

    profile_bytes = generate_enrollment_profile(
        family_id=family.id,
        family_email=family.email,
        device_id=device_id,
        child_name=device.child_name,
        server_host=SERVER_HOST,
    )

    from fastapi.responses import Response
    return Response(
        content=profile_bytes,
        media_type="application/x-apple-aspen-config",
        headers={"Content-Disposition": f'attachment; filename="{device.child_name}_blocker.mobileconfig"'},
    )


@app.post("/devices/{device_id}/checkin")
def device_checkin(device_id: str, db: Session = Depends(get_db)):
    """MDM check-in — device phones home to confirm enrollment"""
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(404, "Device not found")
    device.enrolled = True
    device.last_seen = datetime.utcnow()
    db.commit()
    return {"status": "ok"}


@app.delete("/devices/{device_id}")
def remove_device(device_id: str, family: Family = Depends(get_current_family), db: Session = Depends(get_db)):
    device = db.query(Device).filter(
        Device.id == device_id,
        Device.family_id == family.id,
    ).first()
    if not device:
        raise HTTPException(404, "Device not found")
    db.delete(device)
    db.commit()
    return {"status": "removed"}


# ── Schedule routes ────────────────────────────────────────────────────────────
@app.get("/schedules")
def list_schedules(family: Family = Depends(get_current_family), db: Session = Depends(get_db)):
    schedules = db.query(Schedule).filter(Schedule.family_id == family.id).all()
    return [
        {
            "id": s.id,
            "label": s.label,
            "days": s.days,
            "block_from": s.block_from,
            "block_until": s.block_until,
            "block_all": s.block_all,
            "active": s.active,
        }
        for s in schedules
    ]


@app.post("/schedules/add")
def add_schedule(req: AddScheduleRequest, family: Family = Depends(get_current_family), db: Session = Depends(get_db)):
    schedule = Schedule(
        family_id=family.id,
        label=req.label,
        days=req.days,
        block_from=req.block_from,
        block_until=req.block_until,
        block_all=req.block_all,
    )
    db.add(schedule)
    db.commit()
    return {"status": "added"}


@app.delete("/schedules/{schedule_id}")
def remove_schedule(schedule_id: str, family: Family = Depends(get_current_family), db: Session = Depends(get_db)):
    schedule = db.query(Schedule).filter(
        Schedule.id == schedule_id,
        Schedule.family_id == family.id,
    ).first()
    if not schedule:
        raise HTTPException(404, "Schedule not found")
    db.delete(schedule)
    db.commit()
    return {"status": "removed"}


# ── Logs routes ────────────────────────────────────────────────────────────────
@app.post("/logs/report")
def report_interception(req: LogRequest, db: Session = Depends(get_db)):
    """Called by mitmproxy when it blocks a video"""
    try:
        payload = jwt.decode(req.family_token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
    except jwt.PyJWTError:
        raise HTTPException(401, "Invalid token")

    family = db.query(Family).filter(Family.email == email).first()
    if not family:
        raise HTTPException(404, "Family not found")

    log = InterceptionLog(
        family_id=family.id,
        device_name=req.device_name,
        platform=req.platform,
        matched_word=req.matched_word,
        video_title=req.video_title,
    )
    db.add(log)
    db.commit()
    return {"status": "logged"}


@app.get("/logs")
def get_logs(
    limit: int = 100,
    family: Family = Depends(get_current_family),
    db: Session = Depends(get_db),
):
    logs = (
        db.query(InterceptionLog)
        .filter(InterceptionLog.family_id == family.id)
        .order_by(InterceptionLog.intercepted_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "device_name": l.device_name,
            "platform": l.platform,
            "matched_word": l.matched_word,
            "video_title": l.video_title,
            "intercepted_at": l.intercepted_at,
        }
        for l in logs
    ]


@app.get("/stats")
def get_stats(family: Family = Depends(get_current_family), db: Session = Depends(get_db)):
    total_blocked = db.query(InterceptionLog).filter(InterceptionLog.family_id == family.id).count()
    devices = db.query(Device).filter(Device.family_id == family.id).count()
    enrolled = db.query(Device).filter(Device.family_id == family.id, Device.enrolled == True).count()
    words = db.query(BlocklistEntry).filter(BlocklistEntry.family_id == family.id, BlocklistEntry.active == True).count()
    return {
        "total_blocked": total_blocked,
        "total_devices": devices,
        "enrolled_devices": enrolled,
        "active_words": words,
    }
