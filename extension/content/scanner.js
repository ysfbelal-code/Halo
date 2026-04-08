(function () {
  "use strict";

  var SCAN_INTERVAL = 800;
  var processedVideos = new Set();
  var blockedCount = 0;

  function shouldBlock(pattern, protectionLevel) {
    var level = INTERCEPTOR_CONFIG.PROTECTION_LEVELS[protectionLevel];
    if (!level || level.categories.length === 0) return false;
    var categoryAllowed = level.categories.indexOf(pattern.category) !== -1;
    var severityAllowed =
      INTERCEPTOR_CONFIG.SEVERITY_ORDER[pattern.severity] >=
      INTERCEPTOR_CONFIG.SEVERITY_ORDER[level.severityThreshold];
    return categoryAllowed && severityAllowed;
  }

  function scanText(text, protectionLevel) {
    if (!text || protectionLevel === "none") return null;
    for (var i = 0; i < INTERCEPTOR_CONFIG.ALL_PATTERNS.length; i++) {
      var pattern = INTERCEPTOR_CONFIG.ALL_PATTERNS[i];
      if (shouldBlock(pattern, protectionLevel) && pattern.regex.test(text)) {
        return {
          matched: true,
          category: pattern.category,
          severity: pattern.severity,
          label: INTERCEPTOR_CONFIG.CATEGORY_LABELS[pattern.category] || "Blocked",
        };
      }
    }
    return null;
  }

  function createBlockedOverlay(videoEl, result) {
    var existing = videoEl.querySelector(".guardian-blocked-overlay");
    if (existing) return;

    var overlay = document.createElement("div");
    overlay.className = "guardian-blocked-overlay";
    overlay.style.cssText =
      "position:relative;display:flex;align-items:center;justify-content:center;";

    var card = document.createElement("div");
    card.style.cssText =
      "background:#1a1a2e;color:#e0e0e0;border:2px solid #e94560;border-radius:12px;padding:16px 20px;text-align:center;font-family:system-ui,sans-serif;max-width:220px;box-shadow:0 4px 20px rgba(0,0,0,0.5);";

    var shield = document.createElement("div");
    shield.style.cssText = "font-size:28px;margin-bottom:8px;";
    shield.textContent = "\uD83D\uDEE1\uFE0F";
    card.appendChild(shield);

    var title = document.createElement("div");
    title.style.cssText = "font-weight:700;font-size:14px;margin-bottom:4px;color:#e94560;";
    title.textContent = "Content Blocked";
    card.appendChild(title);

    var reason = document.createElement("div");
    reason.style.cssText = "font-size:12px;color:#a0a0b8;";
    reason.textContent = "Blocked by Guardian \u2014 " + result.label;
    card.appendChild(reason);

    overlay.appendChild(card);

    var thumb = videoEl.querySelector("img, yt-image, tp-yt-iron-image");
    if (thumb) {
      thumb.style.opacity = "0.15";
      thumb.style.filter = "blur(4px)";
    }

    videoEl.appendChild(overlay);
  }

  function hideVideo(videoEl) {
    videoEl.style.display = "none";
  }

  function scanVideoElement(videoEl, protectionLevel) {
    if (processedVideos.has(videoEl)) return;

    var titleEl = videoEl.querySelector("#video-title, a#video-title, yt-formatted-string#video-title");
    var metaEl = videoEl.querySelector("#metadata, #metadata-line, yt-formatted-string");

    var textToScan = "";
    if (titleEl) textToScan += " " + titleEl.textContent;
    if (metaEl) textToScan += " " + metaEl.textContent;

    textToScan = textToScan.trim();
    if (!textToScan) return;

    var result = scanText(textToScan, protectionLevel);
    if (result) {
      createBlockedOverlay(videoEl, result);
      hideVideo(videoEl);
      blockedCount++;
      console.log("[Guardian] Blocked:", textToScan.substring(0, 60), "| Category:", result.category);
    }

    processedVideos.add(videoEl);
  }

  function scanPage(protectionLevel) {
    var videoElements = document.querySelectorAll(
      "ytd-video-renderer, ytd-compact-video-renderer, ytd-rich-item-renderer, ytd-reel-item-renderer"
    );

    videoElements.forEach(function (el) {
      scanVideoElement(el, protectionLevel);
    });
  }

  function loadSettings(callback) {
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.get(["filterLevel", "customKeywords"], function (data) {
        callback(data.filterLevel || "basic", data.customKeywords || []);
      });
    } else {
      callback("basic", []);
    }
  }

  function init() {
    loadSettings(function (level, customKeywords) {
      scanPage(level);

      setInterval(function () {
        scanPage(level);
      }, SCAN_INTERVAL);

      var observer = new MutationObserver(function () {
        scanPage(level);
      });

      observer.observe(document.body, { childList: true, subtree: true });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
