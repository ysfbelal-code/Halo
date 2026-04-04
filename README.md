# 🧠 Brainrot Blocker

A cross-device parental MDM system that intercepts and removes brainrot content from social media feeds before children ever see it.

---

## How It Works

```
Child's iPad (Safari)
       │
       ▼
MDM Profile (installed via .mobileconfig)
  ├─ Routes all browser traffic through your proxy
  ├─ Blocks TikTok/Instagram native apps
  └─ Installs your CA certificate (trusts your proxy)
       │
       ▼
mitmproxy (your server)
  ├─ Intercepts YouTube/TikTok/Instagram API responses
  ├─ Scans video titles/captions for brainrot keywords
  └─ Deletes matching items before they reach the device
       │
       ▼
FastAPI Backend
  ├─ Auth (email + password per family)
  ├─ Blocklist management (parent adds/removes words)
  ├─ Device management
  ├─ Schedule management
  └─ Interception logs
       │
       ▼
Streamlit Dashboard
  └─ Parent controls everything from a web UI
```

---

## Project Structure

```
brainrot-blocker/
├── backend/
│   ├── main.py           # FastAPI server
│   ├── blocker.py        # mitmproxy addon (the interceptor)
│   ├── mdm_manager.py    # .mobileconfig generator
│   ├── models.py         # SQLAlchemy models
│   ├── database.py       # SQLite setup
│   ├── wordlist.py       # Default brainrot words
│   ├── Dockerfile
│   └── Dockerfile.proxy
├── dashboard/
│   ├── app.py            # Streamlit parent dashboard
│   └── Dockerfile
├── scripts/
│   └── setup.sh          # One-command VPS setup
├── data/                 # SQLite database (auto-created)
├── certs/                # CA certificate (auto-generated)
└── docker-compose.yml
```

---

## Setup

### Option A — One-command VPS (Recommended)

Get a cheap VPS ($4–6/month): DigitalOcean, Hetzner, or Vultr with Ubuntu 22.04.

```bash
# Upload project to server, then:
bash scripts/setup.sh
```

### Option B — Local Development

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

# Proxy (separate terminal)
FAMILY_ID=your-family-id FAMILY_TOKEN=your-jwt mitmdump -s blocker.py --listen-port 8080

# Dashboard (separate terminal)
cd dashboard
pip install -r requirements.txt
streamlit run app.py
```

---

## Device Enrollment (Child's iPad)

1. Open the **dashboard** → Devices → Add Device
2. Click **Download Profile** for the device
3. Send the `.mobileconfig` file to the iPad via **AirDrop or email**
4. On the iPad: Settings → General → VPN & Device Management → Install Profile
5. The profile installs:
   - Your CA certificate (so the proxy can read HTTPS)
   - HTTP proxy config (routes Safari through your server)
   - App restrictions (blocks TikTok, Instagram, Snapchat native apps)

> **Important:** After installing, go to Settings → General → About → Certificate Trust Settings → Enable full trust for your CA.

---

## What Gets Blocked

### Native apps (blocked entirely via MDM)
- TikTok
- Instagram
- Snapchat
- Reddit
- Twitter/X
- Discord

### Browser versions (content filtered)
- YouTube Shorts — titles scanned, brainrot videos removed from feed
- TikTok Web — video descriptions scanned, items deleted from API response
- Instagram Web — captions scanned, reels removed

---

## Parent Dashboard Features

| Page | What you can do |
|------|----------------|
| Overview | See total blocked videos, enrolled devices, recent activity |
| Devices | Add devices, download MDM profiles, see enrollment status |
| Blocklist | Add/remove keywords, manage default brainrot word list |
| Schedules | Block platforms entirely during school hours / bedtime |
| Logs | See every intercepted video, which word triggered it, which device |

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /auth/register | Create family account |
| POST | /auth/login | Login |
| GET | /blocklist | Get active blocklist |
| POST | /blocklist/add | Add word |
| DELETE | /blocklist/{id} | Remove word |
| GET | /devices | List devices |
| POST | /devices/add | Register device |
| GET | /devices/{id}/enroll | Download MDM profile |
| GET | /schedules | List schedules |
| POST | /schedules/add | Add schedule |
| GET | /logs | Get interception logs |
| GET | /stats | Dashboard stats |

---

## Limitations

| Scenario | Works? | Why |
|----------|--------|-----|
| Safari (YouTube, TikTok web) | ✅ | Proxy intercepts HTTPS via CA cert |
| YouTube native app | ⚠️ | Can enforce Restricted Mode, no feed inspection |
| TikTok native app | ❌ blocked | Binary cert pinning — app is blocked instead |
| Instagram native app | ❌ blocked | Binary cert pinning — app is blocked instead |
| Android | ⚠️ Partial | Profile install works differently, no supervised mode |
| Non-supervised iPad | ⚠️ | Child can delete profile (use supervised mode for full lock) |

### For full lock-down (school iPads)
Use **Apple Configurator 2** to put the iPad in **Supervised Mode** before installing the profile. This makes the profile undeletable.

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| SECRET_KEY | (required) | JWT signing key |
| SERVER_HOST | localhost | Your server's public IP/domain |
| DB_PATH | ../data/brainrot.db | SQLite path |
| FAMILY_ID | (required for proxy) | Family ID from DB |
| FAMILY_TOKEN | (required for proxy) | JWT for log reporting |
| RELOAD_EVERY | 60 | Seconds between blocklist reloads |
