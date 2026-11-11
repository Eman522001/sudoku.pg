const sizeSelect = document.getElementById("size");
const difficultySelect = document.getElementById("difficulty");
const generateButton = document.getElementById("generate");
const toggleButton = document.getElementById("toggle-solution");
const board = document.getElementById("board");
const statusEl = document.getElementById("status");

const DIFFICULTY_NAMES = { easy: "سهل", medium: "متوسط", hard: "صعب" };

let current = null;
let showingSolution = false;

function toArabicNumerals(value) {
  return String(value).replace(/[0-9]/g, (digit) => "٠١٢٣٤٥٦٧٨٩"[digit]);
}

function renderBoard() {
  const { size, rows, cols, puzzle, solution } = current;
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
      cell.textContent = value ? toArabicNumerals(value) : "";
      board.appendChild(cell);
    }
  }
}

function handleGenerate() {
  const size = Number(sizeSelect.value);
  const difficulty = difficultySelect.value;

  generateButton.disabled = true;
  statusEl.textContent = "جارٍ التوليد...";

  setTimeout(() => {
    current = SudokuEngine.generate(size, difficulty);
    showingSolution = false;
    renderBoard();

    toggleButton.disabled = false;
    toggleButton.textContent = "إظهار الحل";
    generateButton.disabled = false;

    statusEl.textContent =
      `لغز ${toArabicNumerals(size)} × ${toArabicNumerals(size)} - ` +
      `${DIFFICULTY_NAMES[difficulty]} - ` +
      `عدد الأرقام الظاهرة: ${toArabicNumerals(current.clues)}`;
  }, 30);
}

function handleToggle() {
  if (!current) return;
  showingSolution = !showingSolution;
  toggleButton.textContent = showingSolution ? "إخفاء الحل" : "إظهار الحل";
  renderBoard();
}

generateButton.addEventListener("click", handleGenerate);
toggleButton.addEventListener("click", handleToggle);

handleGenerate();
