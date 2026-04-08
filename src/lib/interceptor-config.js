const BRAINROT_PATTERNS = [
  { regex: /skibidi/i, category: "brainrot", severity: "high" },
  { regex: /fanum\s*tax/i, category: "brainrot", severity: "high" },
  { regex: /\brizz\b/i, category: "brainrot", severity: "high" },
  { regex: /gyatt/i, category: "brainrot", severity: "high" },
  { regex: /\bohio\b/i, category: "brainrot", severity: "medium" },
  { regex: /sigma\s*(grindset|male|edit)?/i, category: "brainrot", severity: "high" },
  { regex: /\bnpc\b/i, category: "brainrot", severity: "medium" },
  { regex: /mewing/i, category: "brainrot", severity: "medium" },
  { regex: /looksmaxx/i, category: "brainrot", severity: "medium" },
  { regex: /beta\s*bust/i, category: "brainrot", severity: "medium" },
  { regex: /alpha\s*male/i, category: "brainrot", severity: "medium" },
  { regex: /edel/i, category: "brainrot", severity: "low" },
  { regex: /jellybean/i, category: "brainrot", severity: "low" },
  { regex: /grimace\s*shake/i, category: "brainrot", severity: "medium" },
  { regex: /baby\s*gronk/i, category: "brainrot", severity: "medium" },
  { regex: /livvy\s*dunne/i, category: "brainrot", severity: "medium" },
  { regex: /sussy\s*baka/i, category: "brainrot", severity: "low" },
  { regex: /bombardilo/i, category: "brainrot", severity: "low" },
  { regex: /tralalero\s*tralala/i, category: "brainrot", severity: "low" },
  { regex: /brrr\s*brrr\s*patapim/i, category: "brainrot", severity: "low" },
  { regex: /bombombini\s*gusini/i, category: "brainrot", severity: "low" },
  { regex: /lirili\s*larila/i, category: "brainrot", severity: "low" },
  { regex: /tung\s*tung\s*tung\s*sahur/i, category: "brainrot", severity: "low" },
  { regex: /chimpanzini\s*bananini/i, category: "brainrot", severity: "low" },
  { regex: /boneca\s*ambalabu/i, category: "brainrot", severity: "low" },
  { regex: /david\s*baszucki/i, category: "brainrot", severity: "low" },
  { regex: /among\s*us/i, category: "brainrot", severity: "low" },
];

const SOCIAL_ENGINEERING_PATTERNS = [
  { regex: /blind\s*date/i, category: "social_engineering", severity: "high" },
  { regex: /dating\s*challenge/i, category: "social_engineering", severity: "high" },
  { regex: /find\s*(me|my)\s*(a|an)\s*(girlfriend|boyfriend|partner)/i, category: "social_engineering", severity: "high" },
  { regex: /speed\s*dating/i, category: "social_engineering", severity: "high" },
  { regex: /pick\s*up\s*(line|artist|game)/i, category: "social_engineering", severity: "high" },
  { regex: /relationship\s*advice/i, category: "social_engineering", severity: "medium" },
  { regex: /how\s*to\s*(get|find)\s*(a|my)\s*(girlfriend|boyfriend|crush)/i, category: "social_engineering", severity: "high" },
  { regex: /crush\s*confess/i, category: "social_engineering", severity: "high" },
  { regex: /would\s*you\s*rather\s*(date|kiss)/i, category: "social_engineering", severity: "high" },
  { regex: /rating\s*(girls|boys|people|kids)/i, category: "social_engineering", severity: "high" },
  { regex: /hotness\s*check/i, category: "social_engineering", severity: "high" },
  { regex: /sliding\s*into\s*dm/i, category: "social_engineering", severity: "medium" },
  { regex: /roast\s*my\s*(crush|dating|profile)/i, category: "social_engineering", severity: "medium" },
];

const RISKY_STUNT_PATTERNS = [
  { regex: /dare\s*challenge/i, category: "risky_stunts", severity: "high" },
  { regex: /extreme\s*challenge/i, category: "risky_stunts", severity: "high" },
  { regex: /parkour\s*fail/i, category: "risky_stunts", severity: "high" },
  { regex: /rooftop\s*(run|jump|climb)/i, category: "risky_stunts", severity: "high" },
  { regex: /fire\s*challenge/i, category: "risky_stunts", severity: "high" },
  { regex: /knife\s*challenge/i, category: "risky_stunts", severity: "high" },
  { regex: /electric\s*shock/i, category: "risky_stunts", severity: "high" },
  { regex: /hold\s*my\s*beer/i, category: "risky_stunts", severity: "medium" },
  { regex: /watch\s*this/i, category: "risky_stunts", severity: "low" },
  { regex: /don'?t\s*try\s*this/i, category: "risky_stunts", severity: "high" },
  { regex: /almost\s*died/i, category: "risky_stunts", severity: "high" },
  { regex: /nearly\s*killed/i, category: "risky_stunts", severity: "high" },
  { regex: /almost\s*dead/i, category: "risky_stunts", severity: "high" },
  { regex: /choking\s*challenge/i, category: "risky_stunts", severity: "high" },
  { regex: /blackout\s*challenge/i, category: "risky_stunts", severity: "high" },
  { regex: /tide\s*pod/i, category: "risky_stunts", severity: "high" },
  { regex: /milk\s*crate/i, category: "risky_stunts", severity: "medium" },
  { regex: /out\s*of\s*pocket/i, category: "risky_stunts", severity: "medium" },
];

const MATURE_REALITY_PATTERNS = [
  { regex: /true\s*crime/i, category: "mature_reality", severity: "high" },
  { regex: /murder\s*(mystery|story|case|documentary)/i, category: "mature_reality", severity: "high" },
  { regex: /serial\s*killer/i, category: "mature_reality", severity: "high" },
  { regex: /horror\s*story/i, category: "mature_reality", severity: "medium" },
  { regex: /scary\s*(story|experience|encounter)/i, category: "mature_reality", severity: "medium" },
  { regex: /paranormal/i, category: "mature_reality", severity: "low" },
  { regex: /creepy\s*pasta/i, category: "mature_reality", severity: "medium" },
  { regex: /disturbing\s*(facts|truth|reality)/i, category: "mature_reality", severity: "high" },
  { regex: /dark\s*web/i, category: "mature_reality", severity: "high" },
  { regex: /gore/i, category: "mature_reality", severity: "high" },
  { regex: /nsfw/i, category: "mature_reality", severity: "high" },
  { regex: /18\+/i, category: "mature_reality", severity: "high" },
  { regex: /mature\s*(audience|content|themes)/i, category: "mature_reality", severity: "high" },
  { regex: /reality\s*(tv|show|drama)/i, category: "mature_reality", severity: "medium" },
  { regex: /exposed\s*(drama|fight|cheating)/i, category: "mature_reality", severity: "high" },
  { regex: /drama\s*alert/i, category: "mature_reality", severity: "medium" },
  { regex: /tea\s*(channel|spilled|time)/i, category: "mature_reality", severity: "medium" },
  { regex: /callout\s*(post|video)/i, category: "mature_reality", severity: "medium" },
];

const ALL_PATTERNS = [
  ...BRAINROT_PATTERNS,
  ...SOCIAL_ENGINEERING_PATTERNS,
  ...RISKY_STUNT_PATTERNS,
  ...MATURE_REALITY_PATTERNS,
];

const CATEGORY_CONFIG = {
  brainrot: {
    label: "Brainrot",
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/20",
  },
  social_engineering: {
    label: "Social Engineering",
    color: "text-orange-500",
    bg: "bg-orange-100",
    border: "border-orange-200",
  },
  risky_stunts: {
    label: "Risky Stunts",
    color: "text-red-500",
    bg: "bg-red-100",
    border: "border-red-200",
  },
  mature_reality: {
    label: "Mature Content",
    color: "text-purple-500",
    bg: "bg-purple-100",
    border: "border-purple-200",
  },
  custom: {
    label: "Custom Filter",
    color: "text-slate-500",
    bg: "bg-slate-100",
    border: "border-slate-200",
  },
};

const PROTECTION_LEVELS = {
  none: {
    label: "No Protection",
    subtitle: "Guardian is off",
    description: "All content passes through. No filtering applied.",
    categories: [],
    severityThreshold: null,
  },
  basic: {
    label: "Basic Protection",
    subtitle: "Blocks top threats",
    description: "Filters the worst brainrot terms, high-severity social engineering, and dangerous stunt content.",
    categories: ["brainrot", "social_engineering", "risky_stunts"],
    severityThreshold: "high",
  },
  moderate: {
    label: "Moderate Protection",
    subtitle: "Expanded coverage",
    description: "Adds medium-severity brainrot, mature reality content, and expanded social engineering detection.",
    categories: ["brainrot", "social_engineering", "risky_stunts", "mature_reality"],
    severityThreshold: "medium",
  },
  maximum: {
    label: "Maximum Protection",
    subtitle: "Nuclear content elimination",
    description: "Blocks all known brainrot terms, social engineering patterns, risky stunts, mature content, and every adjacent category at all severity levels.",
    categories: ["brainrot", "social_engineering", "risky_stunts", "mature_reality"],
    severityThreshold: "low",
  },
};

const SEVERITY_ORDER = { high: 3, medium: 2, low: 1 };

function shouldBlock(pattern, protectionLevel) {
  const level = PROTECTION_LEVELS[protectionLevel];
  if (!level || level.categories.length === 0) return false;

  const categoryAllowed = level.categories.includes(pattern.category);
  const severityAllowed = SEVERITY_ORDER[pattern.severity] >= SEVERITY_ORDER[level.severityThreshold];

  return categoryAllowed && severityAllowed;
}

function scanContent(text, protectionLevel) {
  if (!text || !protectionLevel || protectionLevel === "none") return null;

  for (const pattern of ALL_PATTERNS) {
    if (shouldBlock(pattern, protectionLevel) && pattern.regex.test(text)) {
      return {
        matched: true,
        pattern: pattern.regex.source,
        category: pattern.category,
        severity: pattern.severity,
        categoryConfig: CATEGORY_CONFIG[pattern.category],
      };
    }
  }

  return null;
}

function scanMultipleFields(fields, protectionLevel) {
  if (!fields || protectionLevel === "none") return null;

  for (const [fieldName, value] of Object.entries(fields)) {
    if (typeof value === "string" && value.trim()) {
      const result = scanContent(value, protectionLevel);
      if (result) {
        return { ...result, field: fieldName };
      }
    }
  }

  return null;
}

export {
  ALL_PATTERNS,
  CATEGORY_CONFIG,
  PROTECTION_LEVELS,
  SEVERITY_ORDER,
  shouldBlock,
  scanContent,
  scanMultipleFields,
};
