const tabButtons = document.querySelectorAll(".tab");
const panels = {
  general: document.getElementById("panel-general"),
  children: document.getElementById("panel-children")
};

const generalSize = document.getElementById("general-size");
const generalKind = document.getElementById("general-kind");
const generalDifficulty = document.getElementById("general-difficulty");

const childrenSize = document.getElementById("children-size");
const childrenKind = document.getElementById("children-kind");
const childrenDifficulty = document.getElementById("children-difficulty");
const childrenInput = document.getElementById("children-symbols");
const childrenInputWrap = document.getElementById("children-input-wrap");
const childrenHint = document.getElementById("children-hint");
const childrenChipsWrap = document.getElementById("children-chips-wrap");
const childrenChips = document.getElementById("children-chips");
const childrenCounter = document.getElementById("children-counter");
const childrenError = document.getElementById("children-error");

const countInput = document.getElementById("count");
const buildButton = document.getElementById("build");
const statusEl = document.getElementById("status");
const preview = document.getElementById("preview");
const settingsPanel = document.getElementById("settings");

const paperSelect = document.getElementById("paper-size");
const layoutSelect = document.getElementById("layout");
const marginTop = document.getElementById("margin-top");
const marginRight = document.getElementById("margin-right");
const marginBottom = document.getElementById("margin-bottom");
const marginLeft = document.getElementById("margin-left");
const placementSelect = document.getElementById("solutions-place");
const coverInput = document.getElementById("show-cover");
const titleInput = document.getElementById("doc-title");
const titleSizeInput = document.getElementById("title-size");
const titleSizeValue = document.getElementById("title-size-value");
const puzzlePrefixInput = document.getElementById("puzzle-prefix");
const solutionPrefixInput = document.getElementById("solution-prefix");
const colorNumbers = document.getElementById("color-numbers");
const colorLines = document.getElementById("color-lines");
const colorCells = document.getElementById("color-cells");
const colorTitle = document.getElementById("color-title");
const fontSelect = document.getElementById("font-family");

const DIFFICULTY_NAMES = { easy: "سهل", medium: "متوسط", hard: "صعب" };
const CHIP_KINDS = ["colors", "shapes"];
const PAGE_NAMES = { cover: "صفحة العنوان", puzzles: "الألغاز", solutions: "الحلول" };
const MAX_PUZZLES = 40;
const MM_TO_PX = 96 / 25.4;

let activeTab = "general";
let selectedChips = new Set();
let doc = null;

function toAr(value) {
  return SymbolSets.toArabicNumerals(value);
}

function clampInt(value, min, max, fallback) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function pause() {
  return new Promise((resolve) => setTimeout(resolve, 20));
}

function readSettings() {
  const [cols, rows] = layoutSelect.value.split("x").map(Number);
  return {
    paper: paperSelect.value,
    cols,
    rows,
    margins: {
      top: clampInt(marginTop.value, 0, 60, 0),
      right: clampInt(marginRight.value, 0, 60, 0),
      bottom: clampInt(marginBottom.value, 0, 60, 0),
      left: clampInt(marginLeft.value, 0, 60, 0)
    },
    solutionsPlacement: placementSelect.value,
    showCover: coverInput.checked,
    title: titleInput.value.trim(),
    titleSize: Number(titleSizeInput.value),
    puzzlePrefix: puzzlePrefixInput.value.trim(),
    solutionPrefix: solutionPrefixInput.value.trim(),
    colors: {
      numbers: colorNumbers.value,
      lines: colorLines.value,
      cells: colorCells.value,
      title: colorTitle.value
    },
    font: fontSelect.value
  };
}

function showChildrenError(message) {
  childrenError.textContent = message;
}

function readContent() {
  if (activeTab === "general") {
    const size = Number(generalSize.value);
    return {
      size,
      difficulty: generalDifficulty.value,
      symbols: SymbolSets.buildGeneralSymbols(generalKind.value, size)
    };
  }

  const size = Number(childrenSize.value);
  const kind = childrenKind.value;
  const difficulty = childrenDifficulty.value;

  if (CHIP_KINDS.includes(kind)) {
    if (selectedChips.size !== size) {
      showChildrenError(
        `اخترتِ ${toAr(selectedChips.size)} من ${toAr(size)}، والمطلوب ${toAr(size)} بالضبط.`
      );
      return null;
    }
    const items = SymbolSets.getChipItems(kind);
    const symbols = [...selectedChips]
      .sort((a, b) => a - b)
      .map((index) => SymbolSets.makeSymbol(kind, items[index]));
    showChildrenError("");
    return { size, difficulty, symbols };
  }

  const parsed = SymbolSets.parseTypedSymbols(childrenInput.value, kind, size);
  if (parsed.error) {
    showChildrenError(parsed.error);
    return null;
  }
  showChildrenError("");
  return { size, difficulty, symbols: parsed.symbols };
}

function updateChildrenCounter() {
  const size = Number(childrenSize.value);
  childrenCounter.textContent = `اخترتِ ${toAr(selectedChips.size)} من ${toAr(size)}`;
}

function toggleChip(index, chip) {
  const size = Number(childrenSize.value);

  if (selectedChips.has(index)) {
    selectedChips.delete(index);
  } else if (selectedChips.size < size) {
    selectedChips.add(index);
  } else {
    showChildrenError(`يمكن اختيار ${toAr(size)} رموز فقط، ألغي اختيار رمز أولاً.`);
    return;
  }

  showChildrenError("");
  chip.classList.toggle("selected", selectedChips.has(index));
  chip.setAttribute("aria-pressed", String(selectedChips.has(index)));
  updateChildrenCounter();
}

function renderChips() {
  const kind = childrenKind.value;
  childrenChips.innerHTML = "";

  SymbolSets.getChipItems(kind).forEach((item, index) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "chip";
    chip.setAttribute("aria-pressed", "false");
    chip.appendChild(PageRenderer.createSymbolNode(SymbolSets.makeSymbol(kind, item)));

    const name = document.createElement("span");
    name.textContent = item.name;
    chip.appendChild(name);

    chip.addEventListener("click", () => toggleChip(index, chip));
    childrenChips.appendChild(chip);
  });
}

function updateChildrenMode() {
  const size = Number(childrenSize.value);
  const kind = childrenKind.value;
  const usesChips = CHIP_KINDS.includes(kind);

  childrenInputWrap.hidden = usesChips;
  childrenChipsWrap.hidden = !usesChips;

  if (usesChips) {
    childrenHint.textContent =
      kind === "colors"
        ? `اختاري ${toAr(size)} ألوان مختلفة من القائمة.`
        : `اختاري ${toAr(size)} أشكال مختلفة من القائمة.`;
    renderChips();
    updateChildrenCounter();
  } else {
    childrenHint.textContent = `أدخلي ${toAr(size)} رموز مختلفة، مفصولة بمسافة.`;
  }

  showChildrenError("");
}

function onChildrenChange() {
  selectedChips.clear();
  updateChildrenMode();
}

function layoutPreview() {
  const available = preview.clientWidth || 600;

  preview.querySelectorAll(".page-frame").forEach((frame) => {
    const page = frame.firstElementChild;
    const widthMm = Number(page.dataset.widthMm);
    const heightMm = Number(page.dataset.heightMm);
    const scale = Math.min(1, available / (widthMm * MM_TO_PX));

    page.style.transform = `scale(${scale})`;
    frame.style.width = `${widthMm * MM_TO_PX * scale}px`;
    frame.style.height = `${heightMm * MM_TO_PX * scale}px`;
  });
}

function renderPreview() {
  preview.innerHTML = "";
  if (!doc) return;

  const settings = readSettings();
  const pages = PageRenderer.buildPages(doc, settings);

  pages.forEach((page, index) => {
    const item = document.createElement("div");
    item.className = "preview-item";

    const frame = document.createElement("div");
    frame.className = "page-frame";
    frame.appendChild(PageRenderer.renderPage(page, doc, settings));

    const caption = document.createElement("div");
    caption.className = "preview-caption";
    caption.textContent = `الصفحة ${toAr(index + 1)} - ${PAGE_NAMES[page.type]}`;

    item.append(frame, caption);
    preview.appendChild(item);
  });

  layoutPreview();
  statusEl.textContent =
    `عدد الصفحات: ${toAr(pages.length)} - عدد الألغاز: ${toAr(doc.puzzles.length)}`;
}

async function handleBuild() {
  const content = readContent();
  if (!content) {
    statusEl.textContent = "";
    return;
  }

  const count = clampInt(countInput.value, 1, MAX_PUZZLES, 4);
  countInput.value = count;

  const { size, difficulty, symbols } = content;
  const puzzles = [];
  let last = null;

  buildButton.disabled = true;
  try {
    for (let i = 0; i < count; i++) {
      statusEl.textContent = `جارٍ توليد اللغز ${toAr(i + 1)} من ${toAr(count)}...`;
      await pause();
      last = SudokuEngine.generate(size, difficulty);
      puzzles.push({ puzzle: last.puzzle, solution: last.solution, clues: last.clues });
    }

    doc = {
      size,
      rows: last.rows,
      cols: last.cols,
      symbols,
      puzzles,
      difficultyLabel: DIFFICULTY_NAMES[difficulty]
    };
    renderPreview();
  } finally {
    buildButton.disabled = false;
  }
}

function onSettingsChange() {
  titleSizeValue.textContent = `${toAr(titleSizeInput.value)} pt`;
  renderPreview();
}

function switchTab(name) {
  activeTab = name;
  tabButtons.forEach((button) => {
    const active = button.dataset.tab === name;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });
  panels.general.hidden = name !== "general";
  panels.children.hidden = name !== "children";
}

PageRenderer.FONTS.forEach((font) => {
  fontSelect.appendChild(new Option(font.label, font.key));
});

tabButtons.forEach((button) => {
  button.addEventListener("click", () => switchTab(button.dataset.tab));
});
buildButton.addEventListener("click", handleBuild);
childrenSize.addEventListener("change", onChildrenChange);
childrenKind.addEventListener("change", onChildrenChange);
settingsPanel.addEventListener("input", onSettingsChange);
settingsPanel.addEventListener("change", onSettingsChange);
window.addEventListener("resize", layoutPreview);

titleSizeValue.textContent = `${toAr(titleSizeInput.value)} pt`;
updateChildrenMode();
handleBuild();
