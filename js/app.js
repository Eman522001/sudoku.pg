const tabButtons = document.querySelectorAll(".tab");
const panels = {
  general: document.getElementById("panel-general"),
  children: document.getElementById("panel-children")
};

const generalSize = document.getElementById("general-size");
const generalKind = document.getElementById("general-kind");
const generalDifficulty = document.getElementById("general-difficulty");
const generalGenerate = document.getElementById("general-generate");

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
const childrenGenerate = document.getElementById("children-generate");

const statusEl = document.getElementById("status");
const board = document.getElementById("board");
const legend = document.getElementById("legend");
const toggleButton = document.getElementById("toggle-solution");

const DIFFICULTY_NAMES = { easy: "سهل", medium: "متوسط", hard: "صعب" };
const CHIP_KINDS = ["colors", "shapes"];

let current = null;
let showingSolution = false;
let selectedChips = new Set();

function toAr(value) {
  return SymbolSets.toArabicNumerals(value);
}

function createSymbolNode(symbol) {
  if (symbol.kind === "color") {
    const dot = document.createElement("span");
    dot.className = "symbol-color";
    dot.style.backgroundColor = symbol.value;
    return dot;
  }

  if (symbol.kind === "shape") {
    const shape = document.createElement("span");
    shape.className = "symbol-shape";
    shape.innerHTML = `<svg viewBox="0 0 40 40" aria-hidden="true">${symbol.svg}</svg>`;
    return shape;
  }

  const text = document.createElement("span");
  text.className = "symbol-text";
  text.textContent = symbol.label;
  return text;
}

function renderBoard() {
  const { size, rows, cols, puzzle, solution, symbols } = current;
  board.style.gridTemplateColumns = `repeat(${size}, minmax(0, 1fr))`;
  board.className = `board size-${size}`;
  board.innerHTML = "";

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const index = r * size + c;
      const cell = document.createElement("div");
      cell.className = "cell";

      if (puzzle[index]) cell.classList.add("given");
      if (showingSolution && !puzzle[index]) cell.classList.add("solved");
      if ((c + 1) % cols === 0 && c < size - 1) cell.classList.add("box-right");
      if ((r + 1) % rows === 0 && r < size - 1) cell.classList.add("box-bottom");

      const value = showingSolution ? solution[index] : puzzle[index];
      if (value) cell.appendChild(createSymbolNode(symbols[value - 1]));

      board.appendChild(cell);
    }
  }
}

function renderLegend() {
  legend.innerHTML = "";

  for (const symbol of current.symbols) {
    const item = document.createElement("div");
    item.className = "legend-item";

    const icon = document.createElement("span");
    icon.className = "legend-icon";
    icon.appendChild(createSymbolNode(symbol));
    item.appendChild(icon);

    if (symbol.kind !== "text") {
      const name = document.createElement("span");
      name.textContent = symbol.label;
      item.appendChild(name);
    }

    legend.appendChild(item);
  }
}

function setGenerateDisabled(disabled) {
  generalGenerate.disabled = disabled;
  childrenGenerate.disabled = disabled;
}

function generatePuzzle(sectionName, size, difficulty, symbols) {
  setGenerateDisabled(true);
  statusEl.textContent = "جارٍ التوليد...";

  setTimeout(() => {
    try {
      const result = SudokuEngine.generate(size, difficulty);
      current = { ...result, symbols };
      showingSolution = false;
      renderBoard();
      renderLegend();

      toggleButton.disabled = false;
      toggleButton.textContent = "إظهار الحل";

      statusEl.textContent =
        `${sectionName} - ${toAr(size)} × ${toAr(size)} - ` +
        `${DIFFICULTY_NAMES[difficulty]} - ` +
        `عدد الأرقام الظاهرة: ${toAr(result.clues)}`;
    } finally {
      setGenerateDisabled(false);
    }
  }, 30);
}

function handleGeneralGenerate() {
  const size = Number(generalSize.value);
  const kind = generalKind.value;
  const difficulty = generalDifficulty.value;
  const symbols = SymbolSets.buildGeneralSymbols(kind, size);
  generatePuzzle("القسم العام", size, difficulty, symbols);
}

function showChildrenError(message) {
  childrenError.textContent = message;
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
    chip.appendChild(createSymbolNode(SymbolSets.makeSymbol(kind, item)));

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

function handleChildrenGenerate() {
  const size = Number(childrenSize.value);
  const kind = childrenKind.value;
  const difficulty = childrenDifficulty.value;
  let symbols;

  if (CHIP_KINDS.includes(kind)) {
    if (selectedChips.size !== size) {
      showChildrenError(
        `اخترتِ ${toAr(selectedChips.size)} من ${toAr(size)}، والمطلوب ${toAr(size)} بالضبط.`
      );
      return;
    }
    const items = SymbolSets.getChipItems(kind);
    symbols = [...selectedChips]
      .sort((a, b) => a - b)
      .map((index) => SymbolSets.makeSymbol(kind, items[index]));
  } else {
    const parsed = SymbolSets.parseTypedSymbols(childrenInput.value, kind, size);
    if (parsed.error) {
      showChildrenError(parsed.error);
      return;
    }
    symbols = parsed.symbols;
  }

  showChildrenError("");
  generatePuzzle("قسم الأطفال", size, difficulty, symbols);
}

function switchTab(name) {
  tabButtons.forEach((button) => {
    const active = button.dataset.tab === name;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });
  panels.general.hidden = name !== "general";
  panels.children.hidden = name !== "children";
}

function handleToggle() {
  if (!current) return;
  showingSolution = !showingSolution;
  toggleButton.textContent = showingSolution ? "إخفاء الحل" : "إظهار الحل";
  renderBoard();
}

tabButtons.forEach((button) => {
  button.addEventListener("click", () => switchTab(button.dataset.tab));
});
generalGenerate.addEventListener("click", handleGeneralGenerate);
childrenGenerate.addEventListener("click", handleChildrenGenerate);
childrenSize.addEventListener("change", onChildrenChange);
childrenKind.addEventListener("change", onChildrenChange);
toggleButton.addEventListener("click", handleToggle);

updateChildrenMode();
handleGeneralGenerate();
