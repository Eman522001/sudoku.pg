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

const exportScope = document.getElementById("export-scope");
const exportPuzzleWrap = document.getElementById("export-puzzle-wrap");
const exportPuzzleInput = document.getElementById("export-puzzle");
const exportSolutionWrap = document.getElementById("export-solution-wrap");
const exportSolution = document.getElementById("export-solution");
const exportFormat = document.getElementById("export-format");
const exportButton = document.getElementById("export");

const fontFileInput = document.getElementById("font-file");
const fontUploadStatus = document.getElementById("font-upload-status");

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
  exportPuzzleInput.max = doc.puzzles.length;

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

  preview.querySelectorAll(".puzzle-block").forEach((block) => {
    block.draggable = true;
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

function updateExportMode() {
  const single = exportScope.value === "single";
  exportPuzzleWrap.hidden = !single;
  exportSolutionWrap.hidden = !single;
}

const PAGE_FILE_NAMES = { cover: "cover", puzzles: "puzzles", solutions: "solutions" };

function pageFileName(page) {
  if (page.type === "cover") return "sudoku-cover.png";
  const first = String(page.items[0].index + 1).padStart(2, "0");
  return `sudoku-${PAGE_FILE_NAMES[page.type]}-${first}.png`;
}

async function exportPngFiles(pages, settings) {
  exportButton.disabled = true;
  try {
    statusEl.textContent = "جارٍ تجهيز الخطوط والأشكال...";
    await pause();
    const assets = await Exporter.prepare(doc, settings);

    const files = [];
    for (let i = 0; i < pages.length; i++) {
      statusEl.textContent = `جارٍ رسم الصفحة ${toAr(i + 1)} من ${toAr(pages.length)}...`;
      await pause();
      const canvas = await Exporter.renderPageToCanvas(pages[i], doc, settings, assets.images);
      const blob = await Exporter.canvasToBlob(canvas);
      const name = pageFileName(pages[i]);
      files.push({ name, blob });
    }

    await Exporter.saveFiles(files, "sudoku-pages.zip");
    statusEl.textContent = `تم تصدير ${toAr(files.length)} ملف PNG بدقة 300 DPI.`;
  } catch (error) {
    statusEl.textContent = error.message || "حدث خطأ أثناء التصدير.";
  } finally {
    exportButton.disabled = false;
  }
}

async function handleExport() {
  if (!doc) {
    statusEl.textContent = "أنشئي الصفحات أولاً قبل التصدير.";
    return;
  }

  const settings = readSettings();
  let pages;
  let exportSettings = settings;

  if (exportScope.value === "single") {
    const index = clampInt(exportPuzzleInput.value, 1, doc.puzzles.length, 1) - 1;
    exportPuzzleInput.value = index + 1;
    exportSettings = { ...settings, cols: 1, rows: 1, showCover: false };
    pages = PageRenderer.buildSinglePages(doc, index, exportSolution.checked);
  } else {
    pages = PageRenderer.buildPages(doc, settings);
  }

  if (exportFormat.value === "pdf") {
    statusEl.textContent = "افتحي نافذة الطباعة واختاري «حفظ كـ PDF».";
    Exporter.printPages(pages, doc, exportSettings);
    return;
  }

  await exportPngFiles(pages, exportSettings);
}

let dragIndex = null;

function puzzleBlockFromEvent(event) {
  const target = event.target;
  return target instanceof Element ? target.closest(".puzzle-block") : null;
}

function moveDocPuzzle(from, to) {
  if (from === to) return;
  const [item] = doc.puzzles.splice(from, 1);
  doc.puzzles.splice(to, 0, item);
}

function onDragStart(event) {
  const block = puzzleBlockFromEvent(event);
  if (!block) return;
  dragIndex = Number(block.dataset.index);
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", String(dragIndex));
  block.classList.add("dragging");
}

function onDragOver(event) {
  const block = puzzleBlockFromEvent(event);
  if (!block || dragIndex === null) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
  preview.querySelectorAll(".drop-target").forEach((el) => {
    if (el !== block) el.classList.remove("drop-target");
  });
  block.classList.add("drop-target");
}

function onDrop(event) {
  const block = puzzleBlockFromEvent(event);
  if (!block || dragIndex === null) return;
  event.preventDefault();
  const targetIndex = Number(block.dataset.index);
  moveDocPuzzle(dragIndex, targetIndex);
  dragIndex = null;
  renderPreview();
}

function onDragEnd() {
  dragIndex = null;
  preview.querySelectorAll(".dragging, .drop-target").forEach((el) => {
    el.classList.remove("dragging", "drop-target");
  });
}

function uniqueFontFamily(base) {
  const cleaned = base.replace(/["\\]/g, "").trim() || "خط مرفوع";
  const taken = new Set(PageRenderer.FONTS.map((font) => font.key));
  let name = cleaned;
  let counter = 2;
  while (taken.has(name)) {
    name = `${cleaned} ${toAr(counter)}`;
    counter++;
  }
  return name;
}

async function handleFontUpload() {
  const file = fontFileInput.files[0];
  if (!file) return;

  if (!/\.(ttf|otf|woff2?)$/i.test(file.name)) {
    fontUploadStatus.textContent = "الصيغ المدعومة: TTF وOTF وWOFF وWOFF2.";
    fontFileInput.value = "";
    return;
  }
  if (file.size > 8 * 1024 * 1024) {
    fontUploadStatus.textContent = "حجم الملف أكبر من ٨ ميجابايت.";
    fontFileInput.value = "";
    return;
  }

  try {
    fontUploadStatus.textContent = "جارٍ تحميل الخط...";
    const family = uniqueFontFamily(file.name.replace(/\.[^.]+$/, ""));
    const face = new FontFace(family, await file.arrayBuffer());
    await face.load();
    document.fonts.add(face);

    const label = `${family} (مرفوع)`;
    PageRenderer.FONTS.push({ key: family, label });
    fontSelect.appendChild(new Option(label, family));
    fontSelect.value = family;

    fontUploadStatus.textContent = `تم رفع الخط "${family}" وتطبيقه على الصفحات.`;
    renderPreview();
  } catch (error) {
    fontUploadStatus.textContent = "تعذر قراءة هذا الملف كخط. جربي ملف TTF أو OTF آخر.";
  } finally {
    fontFileInput.value = "";
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
exportScope.addEventListener("change", updateExportMode);
exportButton.addEventListener("click", handleExport);
preview.addEventListener("dragstart", onDragStart);
preview.addEventListener("dragover", onDragOver);
preview.addEventListener("drop", onDrop);
preview.addEventListener("dragend", onDragEnd);
fontFileInput.addEventListener("change", handleFontUpload);

titleSizeValue.textContent = `${toAr(titleSizeInput.value)} pt`;
updateChildrenMode();
updateExportMode();
handleBuild();
