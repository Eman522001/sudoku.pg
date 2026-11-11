const SymbolSets = (function () {
  const ARABIC_LETTERS = [
    "أ", "ب", "ت", "ث", "ج", "ح", "خ", "د", "ذ", "ر", "ز", "س", "ش", "ص",
    "ض", "ط", "ظ", "ع", "غ", "ف", "ق", "ك", "ل", "م", "ن", "ه", "و", "ي"
  ];

  const ENGLISH_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  const COLORS = [
    { name: "أحمر", value: "#e53935" },
    { name: "برتقالي", value: "#fb8c00" },
    { name: "أصفر", value: "#fdd835" },
    { name: "أخضر فاتح", value: "#9ccc65" },
    { name: "أخضر", value: "#2e7d32" },
    { name: "تركوازي", value: "#00897b" },
    { name: "سماوي", value: "#29b6f6" },
    { name: "أزرق", value: "#1e88e5" },
    { name: "كحلي", value: "#283593" },
    { name: "بنفسجي", value: "#8e24aa" },
    { name: "وردي", value: "#f06292" },
    { name: "بني", value: "#6d4c41" },
    { name: "أسود", value: "#212121" },
    { name: "رمادي", value: "#9e9e9e" },
    { name: "عنابي", value: "#7b1f2a" },
    { name: "بيج", value: "#d7b98e" }
  ];

  const SHAPES = [
    { name: "دائرة", svg: '<circle cx="20" cy="20" r="14"/>' },
    { name: "مربع", svg: '<rect x="6" y="6" width="28" height="28"/>' },
    { name: "مثلث", svg: '<polygon points="20,5 36,34 4,34"/>' },
    { name: "نجمة", svg: '<polygon points="20,5 24.1,15.3 35.2,16.1 26.7,23.2 29.4,33.9 20,28 10.6,33.9 13.3,23.2 4.8,16.1 15.9,15.3"/>' },
    { name: "قلب", svg: '<path d="M20 34 C6 24 4 18 4 13 C4 8 8 5 12 5 C16 5 19 8 20 11 C21 8 24 5 28 5 C32 5 36 8 36 13 C36 18 34 24 20 34 Z"/>' },
    { name: "مستطيل", svg: '<rect x="3" y="11" width="34" height="18"/>' },
    { name: "معين", svg: '<polygon points="20,4 36,20 20,36 4,20"/>' },
    { name: "خماسي", svg: '<polygon points="20,5 35.2,16.1 29.4,33.9 10.6,33.9 4.8,16.1"/>' },
    { name: "سداسي", svg: '<polygon points="35,20 27.5,33 12.5,33 5,20 12.5,7 27.5,7"/>' },
    { name: "نصف دائرة", svg: '<path d="M4 28 A16 16 0 0 1 36 28 Z"/>' },
    { name: "علامة زائد", svg: '<polygon points="15,4 25,4 25,15 36,15 36,25 25,25 25,36 15,36 15,25 4,25 4,15 15,15"/>' },
    { name: "بيضاوي", svg: '<ellipse cx="20" cy="20" rx="16" ry="10"/>' },
    { name: "شبه منحرف", svg: '<polygon points="12,8 28,8 36,32 4,32"/>' },
    { name: "متوازي أضلاع", svg: '<polygon points="12,8 36,8 28,32 4,32"/>' },
    { name: "سهم", svg: '<polygon points="4,15 22,15 22,6 36,20 22,34 22,25 4,25"/>' },
    { name: "حلقة", svg: '<circle cx="20" cy="20" r="15"/><circle cx="20" cy="20" r="8"/>' }
  ];

  const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

  const PATTERNS = {
    "arabic-letters": /^[\u0621-\u064A]$/,
    "english-letters": /^[A-Za-z]$/,
    "arabic-numbers": /^[0-9\u0660-\u0669]$/,
    "english-numbers": /^[0-9\u0660-\u0669]$/
  };

  const CHIP_ITEMS = { colors: COLORS, shapes: SHAPES };

  function toArabicNumerals(value) {
    return String(value).replace(/[0-9]/g, (digit) => ARABIC_DIGITS[digit]);
  }

  function toWesternDigits(text) {
    return text.replace(/[\u0660-\u0669]/g, (digit) => String(ARABIC_DIGITS.indexOf(digit)));
  }

  function shuffled(array) {
    const copy = array.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function textSymbol(label) {
    return { kind: "text", label };
  }

  function makeSymbol(kind, item) {
    if (kind === "colors") {
      return { kind: "color", label: item.name, value: item.value };
    }
    if (kind === "shapes") {
      return { kind: "shape", label: item.name, svg: item.svg };
    }
    throw new Error("نوع رموز غير معروف");
  }

  function getChipItems(kind) {
    return CHIP_ITEMS[kind];
  }

  function buildGeneralSymbols(kind, count) {
    const numbers = Array.from({ length: count }, (_, i) => i + 1);

    if (kind === "arabic-numbers") {
      return numbers.map((n) => textSymbol(toArabicNumerals(n)));
    }
    if (kind === "english-numbers") {
      return numbers.map((n) => textSymbol(String(n)));
    }
    if (kind === "arabic-letters") {
      return shuffled(ARABIC_LETTERS).slice(0, count).map((letter) => textSymbol(letter));
    }
    if (kind === "english-letters") {
      return shuffled(ENGLISH_LETTERS).slice(0, count).map((letter) => textSymbol(letter));
    }
    if (kind === "colors") {
      return shuffled(COLORS).slice(0, count).map((item) => makeSymbol("colors", item));
    }
    if (kind === "shapes") {
      return shuffled(SHAPES).slice(0, count).map((item) => makeSymbol("shapes", item));
    }
    throw new Error("نوع رموز غير معروف");
  }

  function normalizeToken(token, kind) {
    if (kind === "english-letters") return token.toUpperCase();
    if (kind === "arabic-numbers") return toArabicNumerals(toWesternDigits(token));
    if (kind === "english-numbers") return toWesternDigits(token);
    return token;
  }

  function parseTypedSymbols(text, kind, count) {
    const tokens = text.split(/[\s,،]+/).filter(Boolean);

    if (tokens.length !== count) {
      return {
        error: `أدخلي ${toArabicNumerals(count)} رموزًا بالضبط، وعددها الآن ${toArabicNumerals(tokens.length)}.`
      };
    }

    const pattern = PATTERNS[kind];
    if (!pattern) {
      return { error: "نوع الرموز غير معروف." };
    }

    const seen = new Set();
    const symbols = [];

    for (const token of tokens) {
      if (!pattern.test(token)) {
        return { error: `الرمز "${token}" لا يناسب نوع الرموز المختار.` };
      }
      const label = normalizeToken(token, kind);
      if (seen.has(label)) {
        return { error: `الرمز "${label}" مكرر، والرموز يجب أن تكون مختلفة.` };
      }
      seen.add(label);
      symbols.push(textSymbol(label));
    }

    return { symbols };
  }

  return {
    toArabicNumerals,
    buildGeneralSymbols,
    parseTypedSymbols,
    getChipItems,
    makeSymbol
  };
})();
