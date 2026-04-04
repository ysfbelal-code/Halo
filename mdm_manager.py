"""
MDM Profile Generator
Generates Apple .mobileconfig profiles for device enrollment.
Handles CA certificate generation and VPN/proxy configuration.
"""

import os
import uuid
import plistlib
from datetime import datetime, timedelta
from pathlib import Path

CERT_DIR = Path("../certs")
CA_CERT_PATH = CERT_DIR / "ca.crt"
CA_KEY_PATH  = CERT_DIR / "ca.key"


def generate_ca_cert():
    """Generate a self-signed CA certificate for mitmproxy (run once on startup)."""
    CERT_DIR.mkdir(parents=True, exist_ok=True)

    if CA_CERT_PATH.exists() and CA_KEY_PATH.exists():
        return  # already generated

    try:
        from cryptography import x509
        from cryptography.x509.oid import NameOID
        from cryptography.hazmat.primitives import hashes, serialization
        from cryptography.hazmat.primitives.asymmetric import rsa

        key = rsa.generate_private_key(public_exponent=65537, key_size=2048)

        subject = issuer = x509.Name([
            x509.NameAttribute(NameOID.COUNTRY_NAME, "US"),
            x509.NameAttribute(NameOID.ORGANIZATION_NAME, "Brainrot Blocker"),
            x509.NameAttribute(NameOID.COMMON_NAME, "Brainrot Blocker CA"),
        ])

        cert = (
            x509.CertificateBuilder()
            .subject_name(subject)
            .issuer_name(issuer)
            .public_key(key.public_key())
            .serial_number(x509.random_serial_number())
            .not_valid_before(datetime.utcnow())
            .not_valid_after(datetime.utcnow() + timedelta(days=3650))
            .add_extension(x509.BasicConstraints(ca=True, path_length=None), critical=True)
            .sign(key, hashes.SHA256())
        )

        CA_KEY_PATH.write_bytes(
            key.private_bytes(
                serialization.Encoding.PEM,
                serialization.PrivateFormat.TraditionalOpenSSL,
                serialization.NoEncryption(),
            )
        )
        CA_CERT_PATH.write_bytes(cert.public_bytes(serialization.Encoding.PEM))
        print("[MDM] CA certificate generated.")

    except ImportError:
        print("[MDM] WARNING: cryptography package not installed. CA cert not generated.")


def generate_enrollment_profile(
    family_id: str,
    family_email: str,
    device_id: str,
    child_name: str,
    server_host: str,
) -> bytes:
    """
    Generate an Apple .mobileconfig MDM enrollment profile.
    This file is downloaded and installed on the child's device.
    """
    ca_cert_data = b""
    if CA_CERT_PATH.exists():
        # Strip PEM headers to get raw DER bytes for plist
        pem = CA_CERT_PATH.read_text()
        import base64
        body = "".join(pem.strip().splitlines()[1:-1])
        ca_cert_data = base64.b64decode(body)

    proxy_host = server_host
    proxy_port = 8080

    profile = {
        "PayloadDisplayName": f"Brainrot Blocker — {child_name}",
        "PayloadDescription": "Protects this device from brainrot content.",
        "PayloadIdentifier": f"com.brainrotblocker.{device_id}",
        "PayloadOrganization": "Brainrot Blocker",
        "PayloadRemovalDisallowed": True,   # child cannot delete this profile
        "PayloadType": "Configuration",
        "PayloadUUID": str(uuid.uuid4()),
        "PayloadVersion": 1,
        "PayloadContent": [],
    }

    # ── 1. CA Certificate payload ─────────────────────────────────────────────
    if ca_cert_data:
        profile["PayloadContent"].append({
            "PayloadType": "com.apple.security.root",
            "PayloadDisplayName": "Brainrot Blocker CA",
            "PayloadDescription": "Required for content filtering.",
            "PayloadIdentifier": f"com.brainrotblocker.ca.{device_id}",
            "PayloadUUID": str(uuid.uuid4()),
            "PayloadVersion": 1,
            "PayloadContent": ca_cert_data,
        })

    # ── 2. Global HTTP proxy (routes Safari through mitmproxy) ────────────────
    profile["PayloadContent"].append({
        "PayloadType": "com.apple.proxy.http.global",
        "PayloadDisplayName": "Content Filter Proxy",
        "PayloadDescription": "Routes web traffic through Brainrot Blocker.",
        "PayloadIdentifier": f"com.brainrotblocker.proxy.{device_id}",
        "PayloadUUID": str(uuid.uuid4()),
        "PayloadVersion": 1,
        "ProxyType": "Manual",
        "ProxyServer": proxy_host,
        "ProxyServerPort": proxy_port,
    })

    # ── 3. App restrictions (block native apps) ───────────────────────────────
    profile["PayloadContent"].append({
        "PayloadType": "com.apple.applicationaccess",
        "PayloadDisplayName": "App Restrictions",
        "PayloadDescription": "Blocks social media native apps.",
        "PayloadIdentifier": f"com.brainrotblocker.restrictions.{device_id}",
        "PayloadUUID": str(uuid.uuid4()),
        "PayloadVersion": 1,
        "allowListedAppBundleIDs": [
            "com.apple.mobilesafari",
            "com.apple.mobilemail",
            "com.apple.MobileSMS",
            # Add more allowed apps as needed
        ],
        # Blacklist known social media native apps
        "blacklistedAppBundleIDs": [
            "com.zhiliaoapp.musically",     # TikTok
            "com.instagram.Instagram",
            "com.burbn.instagram",
            "com.snapchat.picaboo",
            "com.reddit.Reddit",
            "com.atebits.Tweetie2",         # Twitter/X
            "com.hammerandchisel.discord",
        ],
    })

    # ── 4. MDM Check-in payload ───────────────────────────────────────────────
    profile["PayloadContent"].append({
        "PayloadType": "com.apple.mdm",
        "PayloadDisplayName": "MDM Configuration",
        "PayloadIdentifier": f"com.brainrotblocker.mdm.{device_id}",
        "PayloadUUID": str(uuid.uuid4()),
        "PayloadVersion": 1,
        "ServerURL": f"https://{server_host}/mdm/checkin",
        "CheckInURL": f"https://{server_host}/devices/{device_id}/checkin",
        "CheckOutWhenRemoved": True,
        "AccessRights": 2,  # inspect device info
        "IdentityCertificateUUID": str(uuid.uuid4()),
        "Topic": f"com.brainrotblocker.{device_id}",
    })

    return plistlib.dumps(profile)
