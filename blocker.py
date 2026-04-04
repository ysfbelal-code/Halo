"""
Brainrot Blocker — mitmproxy Addon
Intercepts browser traffic and removes brainrot video items from feed API responses.
Run with: mitmproxy -s blocker.py --listen-port 8080 --ssl-insecure

Detection engine layers (applied in order):
  1. Unicode normalisation       — strips accents, normalises to NFC/NFKC
  2. Homoglyph substitution      — Cyrillic/Greek/mathematical lookalikes → ASCII
  3. Zero-width / invisible char  — removes ZWJ, ZWNJ, soft-hyphens, etc.
  4. Leet-speak normalisation    — 0→o, 1→i/l, 3→e, 4→a, 5→s, 7→t, @→a, $→s, !→i
  5. Repeated-character collapse — rizzzzz → rizz,  skibidiiii → skibidi
  6. Hashtag / mention stripping — #skibidi → skibidi,  @sigma → sigma
  7. Emoji removal               — strips all emoji/pictograph codepoints
  8. Separator collapse          — sk.i.b.i.d.i / sk-i-b-i-d-i → skibidi
  9. Word-boundary regex match   — compiled alternation over full blocklist
 10. Concatenation scan          — skibiditoilet, gyattrizz (no spaces between words)
 11. Phrase-level patterns       — "L + ratio", "fanum tax", "no cap fr fr"
"""

from mitmproxy import http
import json
import re
import os
import unicodedata
import threading
import time
import logging
import requests

logging.basicConfig(level=logging.INFO, format="[%(asctime)s] %(message)s")
log = logging.getLogger("BrainrotBlocker")

API_BASE      = os.getenv("API_BASE", "http://localhost:8000")
FAMILY_ID     = os.getenv("FAMILY_ID", "")
FAMILY_TOKEN  = os.getenv("FAMILY_TOKEN", "")
DEVICE_NAME   = os.getenv("DEVICE_NAME", "unknown")
RELOAD_EVERY  = int(os.getenv("RELOAD_EVERY", "60"))

# ═════════════════════════════════════════════════════════════════════════════
#  ADVANCED DETECTION ENGINE
# ═════════════════════════════════════════════════════════════════════════════

# ── Layer 2: Homoglyph map (lookalike Unicode → ASCII) ────────────────────────
# Covers Cyrillic, Greek, mathematical alphanumerics, fullwidth, superscript
_HOMOGLYPH_MAP: dict[int, str] = {
    # ── Cyrillic
    ord("а"): "a", ord("е"): "e", ord("о"): "o", ord("р"): "r",
    ord("с"): "c", ord("х"): "x", ord("у"): "y", ord("В"): "B",
    ord("Н"): "H", ord("К"): "K", ord("М"): "M", ord("Р"): "P",
    ord("С"): "C", ord("Т"): "T", ord("А"): "A", ord("Е"): "E",
    ord("О"): "O", ord("Х"): "X",
    ord("\u0455"): "s",  # ѕ Cyrillic dze
    ord("\u0456"): "i",  # і Cyrillic i
    ord("\u0458"): "j",  # ј Cyrillic je
    ord("\u0501"): "d",  # ԁ Cyrillic komi de
    ord("\u051b"): "q",  # ԛ Cyrillic qa
    ord("\u051d"): "w",  # ԝ Cyrillic we
    ord("\u04cf"): "l",  # ӏ Cyrillic palochka
    # ── Greek
    ord("α"): "a", ord("β"): "b", ord("ε"): "e", ord("ι"): "i",
    ord("ο"): "o", ord("τ"): "t", ord("υ"): "u", ord("ν"): "n",
    ord("η"): "n", ord("κ"): "k", ord("μ"): "m", ord("ρ"): "r",
    ord("σ"): "s", ord("ζ"): "z", ord("Α"): "A", ord("Β"): "B",
    ord("Ε"): "E", ord("Ι"): "I", ord("Κ"): "K", ord("Μ"): "M",
    ord("Ν"): "N", ord("Ο"): "O", ord("Ρ"): "R", ord("Τ"): "T",
    ord("Υ"): "Y", ord("Χ"): "X", ord("Ζ"): "Z",
    # ── Mathematical / stylised (𝐚𝐛𝐜, 𝘢𝘣𝘤, 𝒂𝒃𝒄, 𝕒𝕓𝕔 …)
    # Covered by unicodedata NFKC normalisation below — no need to list all
    # ── Fullwidth Latin (Ａ–Ｚ, ａ–ｚ, ０–９)
    **{0xFF01 + i: chr(0x21 + i) for i in range(94)},
    # ── Superscript digits
    ord("⁰"): "0", ord("¹"): "1", ord("²"): "2", ord("³"): "3",
    ord("⁴"): "4", ord("⁵"): "5", ord("⁶"): "6", ord("⁷"): "7",
    ord("⁸"): "8", ord("⁹"): "9",
    # ── Common symbol substitutes
    ord("@"): "a", ord("$"): "s", ord("€"): "e", ord("£"): "l",
    ord("¡"): "i", ord("!"): "i", ord("|"): "l", ord("¦"): "l",
    ord("+"): "",  ord("="): "",
}

# ── Layer 3: Zero-width / invisible codepoints ────────────────────────────────
_ZERO_WIDTH = re.compile(
    r"[\u200b\u200c\u200d\u200e\u200f"   # ZWS, ZWNJ, ZWJ, LRM, RLM
    r"\u202a-\u202e"                       # directional formatting
    r"\u2060\u2061\u2062\u2063\u2064"     # word joiner, invisible operators
    r"\u206a-\u206f"                       # deprecated format chars
    r"\ufeff"                              # BOM / ZWNBSP
    r"\u00ad"                              # soft hyphen
    r"]",
    re.UNICODE,
)

# ── Layer 4: Leet-speak normalisation table ───────────────────────────────────
# Applied character-by-character AFTER homoglyph substitution
_LEET_MAP: dict[str, str] = {
    "0": "o",  "1": "i",  "2": "z",  "3": "e",
    "4": "a",  "5": "s",  "6": "g",  "7": "t",
    "8": "b",  "9": "g",  "!": "i",  "|": "l",
}
_LEET_RE = re.compile(r"[01234567890!|]")

# ── Layer 5: Repeated-character collapse (e.g. rizzzzz → rizz) ───────────────
# Collapse runs of 3+ identical chars to 2 (preserves intentional doubles)
_REPEAT_RE = re.compile(r"(.)\1{2,}", re.UNICODE)

# ── Layer 6: Hashtag / mention strip ─────────────────────────────────────────
_TAG_RE = re.compile(r"[#@](\w+)", re.UNICODE)

# ── Layer 7: Emoji / pictograph removal ──────────────────────────────────────
_EMOJI_RE = re.compile(
    r"[\U0001F300-\U0001F9FF"    # Misc symbols, emoticons, transport, etc.
    r"\U00002600-\U000027BF"     # Dingbats, misc symbols
    r"\U0001FA00-\U0001FAFF"     # Chess, symbols extended-A
    r"\U00002702-\U000027B0"
    r"\uFE00-\uFE0F"             # Variation selectors
    r"\u2640-\u2642"
    r"\u2194-\u2199"
    r"\u2300-\u23FF"             # Misc technical
    r"\u25A0-\u25FF"             # Geometric shapes
    r"\u2B00-\u2BFF"             # Misc symbols and arrows
    r"]+",
    re.UNICODE,
)

# ── Layer 8: Separator collapse ───────────────────────────────────────────────
# e.g. "s.k.i.b.i.d.i" or "s-k-i-b-i-d-i" or "s k i b i d i"
_SEP_RE = re.compile(r"(?<=\w)[.\-_\s](?=\w)", re.UNICODE)

# ── Layer 11: Hard-coded phrase patterns (multi-word, flexible spacing) ───────
# These target common brainrot constructions that single-word matching misses.
_PHRASE_PATTERNS: list[re.Pattern] = [
    # "L + ratio", "L+ratio", "L ratio"
    re.compile(r"\bL\s*\+?\s*ratio\b",          re.IGNORECASE),
    # "no cap", "no cap fr", "no cap fr fr"
    re.compile(r"\bno\s+cap(\s+fr){0,2}\b",      re.IGNORECASE),
    # "fanum tax"
    re.compile(r"\bfanum\s+tax\b",               re.IGNORECASE),
    # "hawk tuah"
    re.compile(r"\bhawk\s+tuah\b",               re.IGNORECASE),
    # "understood the assignment"
    re.compile(r"\bunderstood\s+the\s+assignment\b", re.IGNORECASE),
    # "it's giving", "its giving"
    re.compile(r"\bits?\s+giving\b",             re.IGNORECASE),
    # "main character (energy/syndrome/era)"
    re.compile(r"\bmain\s+character(?:\s+(?:energy|syndrome|era))?\b", re.IGNORECASE),
    # "caught in 4k"
    re.compile(r"\bcaught\s+in\s+4\s*k\b",       re.IGNORECASE),
    # "touch grass"
    re.compile(r"\btouch\s+grass\b",             re.IGNORECASE),
    # "rent free" (living rent free in your head)
    re.compile(r"\brent\s+free\b",               re.IGNORECASE),
    # "hits different"
    re.compile(r"\bhits?\s+different\b",         re.IGNORECASE),
    # "W rizz", "L rizz"
    re.compile(r"\b[WL]\s+rizz\b",               re.IGNORECASE),
    # "sigma male / female / grindset"
    re.compile(r"\bsigma\s+(?:male|female|grindset|mindset|rule)\b", re.IGNORECASE),
    # "brain rot" (two words)
    re.compile(r"\bbrain\s+rot\b",               re.IGNORECASE),
    # "npc behaviour / mode / arc"
    re.compile(r"\bnpc\s+(?:mode|behaviour|behavior|arc|energy)\b", re.IGNORECASE),
    # "goon cave / session / mode"
    re.compile(r"\bgoon\s+(?:cave|session|mode|squad)\b",  re.IGNORECASE),
    # "maxx?ing" variants (looksmaxxing, grindmaxxing, etc.)
    re.compile(r"\b\w+maxx?ing\b",               re.IGNORECASE),
    # "fr fr" (2+ repeats)
    re.compile(r"\bfr(\s+fr){1,}\b",             re.IGNORECASE),
    # "on god" / "on gang"
    re.compile(r"\bon\s+(?:god|gang|my\s+mama)\b", re.IGNORECASE),
    # "say less"
    re.compile(r"\bsay\s+less\b",               re.IGNORECASE),
    # "big yikes"
    re.compile(r"\bbig\s+yikes\b",              re.IGNORECASE),
    # "ate (that)" / "ate and left no crumbs"
    re.compile(r"\bate\s+(?:that|and\s+left\s+no\s+crumbs)\b", re.IGNORECASE),
    # "chronically online"
    re.compile(r"\bchronically\s+online\b",      re.IGNORECASE),
    # "fell off" (they fell off)
    re.compile(r"\bfell\s+off\b",               re.IGNORECASE),
    # "did/didn't ask"  / "nobody asked"
    re.compile(r"\b(?:nobody|no\s+one|didn'?t)\s+ask(?:ed)?\b", re.IGNORECASE),
    # "based and redpilled"
    re.compile(r"\bbased\s+and\s+red\s*pilled\b", re.IGNORECASE),
    # "stay mad / salty"
    re.compile(r"\bstay\s+(?:mad|salty|pressed)\b", re.IGNORECASE),
    # "community note" (used ironically)
    re.compile(r"\bcommunity\s+note\b",          re.IGNORECASE),
]


def _normalise(text: str) -> str:
    """
    Run all normalisation layers and return a clean ASCII-ish string
    suitable for word-level regex matching.
    The original text is preserved for logging; only the normalised
    copy is used for detection.
    """
    # Layer 1 — Unicode NFC → NFKC decomposition (handles stylised fonts, ligatures)
    text = unicodedata.normalize("NFKC", text)

    # Layer 2 — Homoglyph substitution
    text = text.translate(_HOMOGLYPH_MAP)

    # Layer 3 — Strip zero-width / invisible characters
    text = _ZERO_WIDTH.sub("", text)

    # Layer 6 — Expand hashtags/mentions (keep the word, drop the sigil)
    text = _TAG_RE.sub(r" \1 ", text)

    # Layer 7 — Remove emoji
    text = _EMOJI_RE.sub(" ", text)

    # Layer 8 — Collapse dot/dash/underscore/space separators between letters
    text = _SEP_RE.sub("", text)

    # Layer 4 — Leet-speak substitution
    text = _LEET_RE.sub(lambda m: _LEET_MAP.get(m.group(0), m.group(0)), text)

    # Layer 5 — Collapse repeated characters (rizzzzz → rizz)
    text = _REPEAT_RE.sub(r"\1\1", text)

    return text.lower()


def _build_pattern(words: list[str]) -> re.Pattern:
    """
    Build a compiled regex from the blocklist words.

    Each word goes through _normalise() so the pattern matches the
    same normalised form we'll apply to incoming text.  Word boundaries
    use (?<![a-z0-9]) / (?![a-z0-9]) instead of \b so they work
    correctly after our normalisation step (which lowercases everything).
    """
    if not words:
        return re.compile(r"(?!)")  # never matches

    processed: list[str] = []
    for w in words:
        norm = _normalise(w)
        if not norm.strip():
            continue
        # Allow optional separators between every character so
        # "s.k.i.b.i.d.i" still matches after sep-collapse is incomplete
        spaced = r"[\s.\-_]*".join(re.escape(c) for c in norm.replace(" ", ""))
        processed.append(spaced)

    # Sort longest-first to avoid partial matches shadowing longer ones
    processed.sort(key=len, reverse=True)

    alternation = "|".join(processed)
    # Negative lookbehind/ahead for word chars — robust after normalisation
    return re.compile(
        rf"(?<![a-z0-9])({alternation})(?![a-z0-9])",
        re.IGNORECASE,
    )

# ── Feed helpers ─────────────────────────────────────────────────────────────
def _dig(d, *keys):
    """Safely traverse nested dict/list."""
    try:
        for k in keys:
            d = d[k]
        return d if isinstance(d, list) else []
    except (KeyError, IndexError, TypeError):
        return []


def _yt_text(item: dict) -> str:
    """Extract text from YouTube feed item (handles many nested shapes)."""
    parts = []
    for path in [
        ["reelItemRenderer", "headline", "runs"],
        ["reelItemRenderer", "accessibility", "accessibilityData", "label"],
        ["richItemRenderer", "content", "reelItemRenderer", "headline", "runs"],
        ["videoRenderer", "title", "runs"],
        ["compactVideoRenderer", "title", "runs"],
    ]:
        node = item
        try:
            for k in path:
                node = node[k]
            if isinstance(node, list):
                parts.append(" ".join(r.get("text", "") for r in node))
            elif isinstance(node, str):
                parts.append(node)
        except (KeyError, TypeError):
            pass
    return " ".join(parts)


# ── Feed rules: which paths to intercept per domain ──────────────────────────
FEED_RULES = {
    "youtube.com": {
        "paths": ["/youtubei/v1/next", "/youtubei/v1/reel_watch_sequence", "/youtubei/v1/browse"],
        "extractors": [
            lambda d: _dig(d, "onResponseReceivedActions", 0, "appendContinuationItemsAction", "continuationItems"),
            lambda d: _dig(d, "contents", "twoColumnBrowseResultsRenderer", "tabs"),
            lambda d: _dig(d, "reelSequence", "contents"),
            lambda d: _dig(d, "contents"),
        ],
        "text_fn": _yt_text,
        "platform": "youtube",
    },
    "tiktok.com": {
        "paths": ["/api/recommend/item_list", "/aweme/v1/feed", "/api/item/detail"],
        "extractors": [
            lambda d: d.get("itemList") or d.get("aweme_list", []),
        ],
        "text_fn": lambda item: (
            item.get("desc", "") + " " +
            " ".join(t.get("text", "") for t in item.get("textExtra", []))
        ),
        "platform": "tiktok",
    },
    "instagram.com": {
        "paths": ["/api/v1/feed/reels_tray", "/api/v1/clips/user", "/graphql/query"],
        "extractors": [
            lambda d: d.get("tray") or d.get("items", []),
        ],
        "text_fn": lambda item: (
            (item.get("caption") or {}).get("text", "") + " " +
            item.get("accessibility_caption", "")
        ),
        "platform": "instagram",
    },
}


# ── Blocklist runtime (hot-reloaded) ─────────────────────────────────────────
_blocklist_lock  = threading.Lock()
_current_pattern = re.compile(r"(?!)")   # placeholder — replaced on first reload
_raw_words:  list[str] = []              # kept for concatenation scan (Layer 10)


def _reload_blocklist():
    global _current_pattern, _raw_words
    while True:
        try:
            url  = f"{API_BASE}/blocklist/raw/{FAMILY_ID}"
            resp = requests.get(url, timeout=5)
            if resp.ok:
                words = resp.json().get("words", [])
                pat   = _build_pattern(words)
                with _blocklist_lock:
                    _current_pattern = pat
                    _raw_words = [_normalise(w) for w in words if w.strip()]
                log.info("Blocklist refreshed: %d words loaded.", len(words))
        except Exception as e:
            log.warning("Could not refresh blocklist: %s", e)
        time.sleep(RELOAD_EVERY)


def _is_brainrot(raw_text: str) -> tuple[bool, str]:
    """
    Run all detection layers against raw_text.
    Returns (flagged, reason_string).
    """
    # ── Layer 11: Phrase patterns on RAW text first (before normalisation) ────
    for pat in _PHRASE_PATTERNS:
        m = pat.search(raw_text)
        if m:
            return True, f"phrase:{m.group(0)!r}"

    # ── Normalise for remaining layers ────────────────────────────────────────
    norm = _normalise(raw_text)

    with _blocklist_lock:
        word_pat  = _current_pattern
        word_list = _raw_words

    # ── Layers 1-9: Word-boundary regex on normalised text ────────────────────
    m = word_pat.search(norm)
    if m:
        return True, m.group(0)

    # ── Layer 10: Concatenation scan ──────────────────────────────────────────
    # Splits norm into tokens and checks if any token CONTAINS a blocked word
    # without a boundary (e.g. "skibiditoilet", "gyattrizz")
    for token in re.findall(r"[a-z0-9]{6,}", norm):   # only tokens ≥6 chars
        for blocked in word_list:
            if len(blocked) >= 4 and blocked in token:
                return True, f"concat:{blocked!r} in {token!r}"

    return False, ""


def _report_interception(platform: str, matched_word: str, video_title: str):
    """Fire-and-forget log to backend."""
    if not FAMILY_TOKEN:
        return
    try:
        requests.post(
            f"{API_BASE}/logs/report",
            json={
                "family_token": FAMILY_TOKEN,
                "device_name": DEVICE_NAME,
                "platform": platform,
                "matched_word": matched_word,
                "video_title": video_title[:200],
            },
            timeout=3,
        )
    except Exception:
        pass


# ── mitmproxy addon ───────────────────────────────────────────────────────────
class BrainrotBlocker:

    def __init__(self):
        t = threading.Thread(target=_reload_blocklist, daemon=True)
        t.start()
        log.info("BrainrotBlocker started. Blocklist will reload every %ds.", RELOAD_EVERY)

    def _match_rule(self, host: str, path: str):
        for domain, rule in FEED_RULES.items():
            if domain in host:
                for p in rule["paths"]:
                    if p in path:
                        return rule
        return None

    def response(self, flow: http.HTTPFlow):
        host = flow.request.pretty_host
        path = flow.request.path

        rule = self._match_rule(host, path)
        if not rule:
            return

        # Decode (handles gzip/br/deflate)
        try:
            content = flow.response.get_text()
        except Exception:
            return

        try:
            data = json.loads(content)
        except json.JSONDecodeError:
            return

        removed = 0
        for extractor in rule["extractors"]:
            items = extractor(data)
            if not isinstance(items, list) or not items:
                continue

            clean = []
            for item in items:
                text = rule["text_fn"](item)
                flagged, word = _is_brainrot(text)
                if flagged:
                    removed += 1
                    threading.Thread(
                        target=_report_interception,
                        args=(rule["platform"], word, text[:200]),
                        daemon=True,
                    ).start()
                else:
                    clean.append(item)

            # Write clean list back into the same position in the data
            if removed > 0:
                # Try to update in-place via the extractor path
                # (simple approach: replace wherever we found the list)
                self._replace_list(data, items, clean, rule["extractors"])

        if removed > 0:
            try:
                flow.response.text = json.dumps(data)
            except Exception as e:
                log.warning(f"Could not rewrite response: {e}")
            log.info(f"[{rule['platform'].upper()}] Blocked {removed} item(s) from {host}")

    @staticmethod
    def _replace_list(data, original, clean, extractors):
        """
        Walk the data dict and replace the first occurrence of `original` with `clean`.
        Works for shallow and one-level-deep lists.
        """
        def _walk(node):
            if isinstance(node, dict):
                for k, v in node.items():
                    if v is original:
                        node[k] = clean
                        return True
                    if _walk(v):
                        return True
            elif isinstance(node, list):
                for i, v in enumerate(node):
                    if v is original:
                        node[i] = clean
                        return True
                    if _walk(v):
                        return True
            return False

        _walk(data)


addons = [BrainrotBlocker()]
