"""
Brainrot Blocker — Parent Dashboard (Streamlit)
Run: streamlit run app.py
"""

import streamlit as st
import requests
import pandas as pd
from datetime import datetime

API = "http://localhost:8000"

st.set_page_config(
    page_title="Brainrot Blocker",
    page_icon="🧠",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ── Styling ───────────────────────────────────────────────────────────────────
st.markdown("""
<style>
    [data-testid="stSidebar"] { background: #0f1117; }
    .metric-card {
        background: #1e2130;
        border: 1px solid #2d3250;
        border-radius: 12px;
        padding: 20px;
        text-align: center;
    }
    .metric-value { font-size: 2.5rem; font-weight: 700; color: #00d4aa; }
    .metric-label { font-size: 0.85rem; color: #888; margin-top: 4px; }
    .status-enrolled { color: #00d4aa; font-weight: 600; }
    .status-pending  { color: #f5a623; font-weight: 600; }
    .badge {
        display: inline-block;
        background: #1e2130;
        border: 1px solid #2d3250;
        border-radius: 20px;
        padding: 4px 12px;
        font-size: 0.8rem;
        margin: 3px;
        color: #ccc;
    }
</style>
""", unsafe_allow_html=True)


# ── Session state ─────────────────────────────────────────────────────────────
if "token" not in st.session_state:
    st.session_state.token = None
if "parent_name" not in st.session_state:
    st.session_state.parent_name = ""


def api(method: str, path: str, **kwargs):
    headers = {}
    if st.session_state.token:
        headers["Authorization"] = f"Bearer {st.session_state.token}"
    try:
        resp = getattr(requests, method)(f"{API}{path}", headers=headers, **kwargs)
        return resp
    except requests.exceptions.ConnectionError:
        st.error("Cannot connect to backend. Is the server running?")
        return None


# ── Auth pages ────────────────────────────────────────────────────────────────
def login_page():
    st.title("🧠 Brainrot Blocker")
    st.markdown("##### Protect your child's screen time from harmful content.")
    st.markdown("---")

    tab_login, tab_register = st.tabs(["Sign In", "Create Account"])

    with tab_login:
        email = st.text_input("Email", key="login_email")
        password = st.text_input("Password", type="password", key="login_pw")
        if st.button("Sign In", use_container_width=True, type="primary"):
            resp = api("post", "/auth/login", json={"email": email, "password": password})
            if resp and resp.ok:
                data = resp.json()
                st.session_state.token = data["token"]
                st.session_state.parent_name = data["parent_name"]
                st.rerun()
            elif resp:
                st.error("Invalid email or password.")

    with tab_register:
        name  = st.text_input("Your name", key="reg_name")
        email = st.text_input("Email", key="reg_email")
        pw    = st.text_input("Password", type="password", key="reg_pw")
        if st.button("Create Account", use_container_width=True, type="primary"):
            resp = api("post", "/auth/register", json={
                "email": email, "password": pw, "parent_name": name
            })
            if resp and resp.ok:
                data = resp.json()
                st.session_state.token = data["token"]
                st.session_state.parent_name = data["parent_name"]
                st.success("Account created!")
                st.rerun()
            elif resp:
                st.error(resp.json().get("detail", "Registration failed."))


# ── Dashboard pages ───────────────────────────────────────────────────────────
def page_overview():
    st.title(f"👋 Welcome, {st.session_state.parent_name}")

    resp = api("get", "/stats")
    if resp and resp.ok:
        stats = resp.json()
        c1, c2, c3, c4 = st.columns(4)
        metrics = [
            (c1, stats["total_blocked"], "Videos Blocked"),
            (c2, stats["active_words"],  "Blocked Words"),
            (c3, stats["enrolled_devices"], "Active Devices"),
            (c4, stats["total_devices"],    "Registered Devices"),
        ]
        for col, val, label in metrics:
            with col:
                st.markdown(f"""
                <div class="metric-card">
                    <div class="metric-value">{val}</div>
                    <div class="metric-label">{label}</div>
                </div>
                """, unsafe_allow_html=True)

    st.markdown("---")
    st.subheader("📋 Recent Interceptions")

    resp = api("get", "/logs?limit=20")
    if resp and resp.ok:
        logs = resp.json()
        if logs:
            df = pd.DataFrame(logs)
            df["intercepted_at"] = pd.to_datetime(df["intercepted_at"]).dt.strftime("%b %d %H:%M")
            df.columns = ["Device", "Platform", "Matched Word", "Video Title", "Time"]
            st.dataframe(df, use_container_width=True, hide_index=True)
        else:
            st.info("No interceptions logged yet. Blocklist is active and watching.")


def page_devices():
    st.title("📱 Devices")
    st.markdown("Add your child's device, then download and install the MDM profile on their iPad or iPhone.")

    # Add device
    with st.expander("➕ Register a new device", expanded=False):
        c1, c2, c3 = st.columns(3)
        child_name  = c1.text_input("Child's name")
        device_name = c2.text_input("Device name (e.g. Sarah's iPad)")
        platform    = c3.selectbox("Platform", ["ios", "android"])
        if st.button("Add Device", type="primary"):
            resp = api("post", "/devices/add", json={
                "child_name": child_name,
                "device_name": device_name,
                "platform": platform,
            })
            if resp and resp.ok:
                st.success(f"Device '{device_name}' added!")
                st.rerun()

    # Device list
    resp = api("get", "/devices")
    if not resp or not resp.ok:
        return

    devices = resp.json()
    if not devices:
        st.info("No devices registered yet.")
        return

    for d in devices:
        enrolled = d["enrolled"]
        status   = "🟢 Enrolled" if enrolled else "🟡 Pending"
        last     = d.get("last_seen") or "Never"
        if isinstance(last, str) and "T" in last:
            last = datetime.fromisoformat(last).strftime("%b %d %H:%M")

        with st.container():
            c1, c2, c3, c4, c5 = st.columns([2, 2, 1.5, 1.5, 1])
            c1.markdown(f"**{d['device_name']}**")
            c2.markdown(f"👤 {d['child_name']}")
            c3.markdown(status)
            c4.markdown(f"Last seen: {last}")

            if c5.button("📥 Profile", key=f"dl_{d['id']}"):
                resp2 = api("get", f"/devices/{d['id']}/enroll")
                if resp2 and resp2.ok:
                    st.download_button(
                        label="⬇️ Download .mobileconfig",
                        data=resp2.content,
                        file_name=f"{d['child_name']}_blocker.mobileconfig",
                        mime="application/x-apple-aspen-config",
                        key=f"download_{d['id']}",
                    )

            if st.button("🗑️ Remove", key=f"rm_{d['id']}"):
                api("delete", f"/devices/{d['id']}")
                st.rerun()

            st.markdown("---")


def page_blocklist():
    st.title("🚫 Blocked Words")
    st.markdown("Words found in video titles, captions, or descriptions will cause the video to be intercepted and removed.")

    # Add custom word
    c1, c2 = st.columns([3, 1])
    new_word = c1.text_input("Add a custom word or phrase", placeholder="e.g. skibidi toilet")
    if c2.button("Add Word", type="primary", use_container_width=True):
        if new_word.strip():
            resp = api("post", "/blocklist/add", json={"word": new_word.strip(), "category": "custom"})
            if resp and resp.ok:
                st.success(f"'{new_word}' added to blocklist.")
                st.rerun()

    st.markdown("---")

    resp = api("get", "/blocklist")
    if not resp or not resp.ok:
        return

    data = resp.json()
    entries = data.get("entries", [])

    brainrot = [e for e in entries if e["category"] == "brainrot"]
    custom   = [e for e in entries if e["category"] == "custom"]

    st.subheader(f"🧠 Default Brainrot Words ({len(brainrot)})")
    st.markdown("These are pre-loaded common brainrot terms. Click any to disable.")

    cols = st.columns(6)
    for i, e in enumerate(brainrot):
        with cols[i % 6]:
            if st.button(f"× {e['word']}", key=f"rm_bw_{e['id']}", help="Click to disable"):
                api("delete", f"/blocklist/{e['id']}")
                st.rerun()

    st.markdown("---")
    st.subheader(f"✏️ Custom Words ({len(custom)})")

    if not custom:
        st.info("No custom words added yet.")
    else:
        for e in custom:
            c1, c2 = st.columns([4, 1])
            c1.markdown(f"**{e['word']}**")
            if c2.button("Remove", key=f"rm_cw_{e['id']}"):
                api("delete", f"/blocklist/{e['id']}")
                st.rerun()


def page_schedules():
    st.title("🕐 Block Schedules")
    st.markdown("Automatically block social media access during school hours or bedtime.")

    DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
    DAY_LABELS = {"mon": "Monday", "tue": "Tuesday", "wed": "Wednesday",
                  "thu": "Thursday", "fri": "Friday", "sat": "Saturday", "sun": "Sunday"}

    with st.expander("➕ Add a schedule", expanded=True):
        label     = st.text_input("Schedule name", placeholder="e.g. School Hours")
        days_sel  = st.multiselect("Days", options=DAYS, format_func=lambda d: DAY_LABELS[d],
                                   default=["mon", "tue", "wed", "thu", "fri"])
        c1, c2, c3 = st.columns(3)
        block_from  = c1.time_input("Block from", value=datetime.strptime("08:00", "%H:%M").time())
        block_until = c2.time_input("Block until", value=datetime.strptime("15:00", "%H:%M").time())
        block_all   = c3.checkbox("Block entire platform (not just brainrot)")

        if st.button("Save Schedule", type="primary"):
            resp = api("post", "/schedules/add", json={
                "label": label,
                "days": days_sel,
                "block_from": block_from.strftime("%H:%M"),
                "block_until": block_until.strftime("%H:%M"),
                "block_all": block_all,
            })
            if resp and resp.ok:
                st.success("Schedule saved!")
                st.rerun()

    st.markdown("---")

    resp = api("get", "/schedules")
    if not resp or not resp.ok:
        return

    schedules = resp.json()
    if not schedules:
        st.info("No schedules set.")
        return

    for s in schedules:
        days_str = ", ".join(DAY_LABELS.get(d, d) for d in s["days"])
        mode = "🔴 Full block" if s["block_all"] else "🟡 Brainrot filter"
        st.markdown(f"""
        **{s['label']}** — {mode}
        📅 {days_str} · ⏰ {s['block_from']} → {s['block_until']}
        """)
        if st.button("🗑️ Remove", key=f"rm_sched_{s['id']}"):
            api("delete", f"/schedules/{s['id']}")
            st.rerun()
        st.markdown("---")


def page_logs():
    st.title("📊 Activity Logs")

    resp = api("get", "/logs?limit=200")
    if not resp or not resp.ok:
        st.error("Could not fetch logs.")
        return

    logs = resp.json()
    if not logs:
        st.info("No activity logged yet.")
        return

    df = pd.DataFrame(logs)
    df["intercepted_at"] = pd.to_datetime(df["intercepted_at"])

    # Filters
    c1, c2 = st.columns(2)
    platform_filter = c1.multiselect("Platform", options=df["platform"].unique().tolist(),
                                     default=df["platform"].unique().tolist())
    device_filter   = c2.multiselect("Device", options=df["device_name"].unique().tolist(),
                                     default=df["device_name"].unique().tolist())

    filtered = df[df["platform"].isin(platform_filter) & df["device_name"].isin(device_filter)]

    st.markdown(f"**{len(filtered)} interceptions**")

    # Chart
    if len(filtered) > 1:
        by_day = filtered.copy()
        by_day["date"] = by_day["intercepted_at"].dt.date
        chart = by_day.groupby(["date", "platform"]).size().unstack(fill_value=0)
        st.bar_chart(chart)

    # Table
    display = filtered.copy()
    display["intercepted_at"] = display["intercepted_at"].dt.strftime("%b %d %H:%M")
    display.columns = ["Device", "Platform", "Matched Word", "Video Title", "Time"]
    st.dataframe(display[["Time", "Platform", "Device", "Matched Word", "Video Title"]],
                 use_container_width=True, hide_index=True)


# ── Sidebar + routing ─────────────────────────────────────────────────────────
if not st.session_state.token:
    login_page()
else:
    with st.sidebar:
        st.markdown("## 🧠 Brainrot Blocker")
        st.markdown(f"*{st.session_state.parent_name}*")
        st.markdown("---")

        page = st.radio("Navigation", [
            "📊 Overview",
            "📱 Devices",
            "🚫 Blocklist",
            "🕐 Schedules",
            "📋 Logs",
        ])

        st.markdown("---")
        if st.button("Sign Out"):
            st.session_state.token = None
            st.session_state.parent_name = ""
            st.rerun()

    if page == "📊 Overview":
        page_overview()
    elif page == "📱 Devices":
        page_devices()
    elif page == "🚫 Blocklist":
        page_blocklist()
    elif page == "🕐 Schedules":
        page_schedules()
    elif page == "📋 Logs":
        page_logs()
