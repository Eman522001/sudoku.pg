const SudokuEngine = (function () {
  const SIZES = {
    4: { rows: 2, cols: 2 },
    6: { rows: 2, cols: 3 },
    9: { rows: 3, cols: 3 },
    16: { rows: 4, cols: 4 }
  };

  const CLUE_RANGES = {
    4: { easy: [9, 10], medium: [7, 8], hard: [5, 6] },
    6: { easy: [22, 24], medium: [17, 19], hard: [12, 14] },
    9: { easy: [36, 40], medium: [30, 34], hard: [24, 28] },
    16: { easy: [150, 170], medium: [120, 145], hard: [90, 115] }
  };

  const MAX_ATTEMPTS = 30;
  const NODE_BUDGET = 50000;

  function randomBetween(min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
  }

  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  function range(n) {
    return Array.from({ length: n }, (_, i) => i);
  }

  function popCount(x) {
    let count = 0;
    while (x) {
      x &= x - 1;
      count++;
    }
    return count;
  }

  function baseGrid(geo) {
    const { size, rows, cols } = geo;
    const grid = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        grid.push(((cols * (r % rows) + Math.floor(r / rows) + c) % size) + 1);
      }
    }
    return grid;
  }

  function shuffledOrder(size, blockSize) {
    const order = [];
    for (const block of shuffle(range(size / blockSize))) {
      for (const offset of shuffle(range(blockSize))) {
        order.push(block * blockSize + offset);
      }
    }
    return order;
  }

  function generateSolution(geo) {
    const { size } = geo;
    const base = baseGrid(geo);
    const valueMap = shuffle(range(size));
    const rowOrder = shuffledOrder(size, geo.rows);
    const colOrder = shuffledOrder(size, geo.cols);
    const solution = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const baseValue = base[rowOrder[r] * size + colOrder[c]];
        solution.push(valueMap[baseValue - 1] + 1);
      }
    }
    return solution;
  }

  function countSolutions(puzzle, geo, limit, nodeBudget) {
    const { size, rows, cols } = geo;
    const full = (1 << (size + 1)) - 2;
    const boxesPerRow = size / cols;
    const boxOf = (r, c) => Math.floor(r / rows) * boxesPerRow + Math.floor(c / cols);
    const cells = puzzle.slice();
    const rowUsed = new Array(size).fill(0);
    const colUsed = new Array(size).fill(0);
    const boxUsed = new Array(size).fill(0);

    for (let i = 0; i < cells.length; i++) {
      if (cells[i]) {
        const r = Math.floor(i / size);
        const c = i % size;
        const bit = 1 << cells[i];
        rowUsed[r] |= bit;
        colUsed[c] |= bit;
        boxUsed[boxOf(r, c)] |= bit;
      }
    }

    let count = 0;
    let nodes = 0;

    function search() {
      if (count >= limit) return;
      nodes++;
      if (nodes > nodeBudget) {
        count = limit;
        return;
      }

      let bestIndex = -1;
      let bestOptions = 0;
      let bestSize = size + 1;

      for (let i = 0; i < cells.length; i++) {
        if (cells[i]) continue;
        const r = Math.floor(i / size);
        const c = i % size;
        const options = full & ~(rowUsed[r] | colUsed[c] | boxUsed[boxOf(r, c)]);
        const n = popCount(options);
        if (n < bestSize) {
          bestSize = n;
          bestIndex = i;
          bestOptions = options;
          if (n <= 1) break;
        }
      }

      if (bestIndex === -1) {
        count++;
        return;
      }
      if (bestSize === 0) return;

      const r = Math.floor(bestIndex / size);
      const c = bestIndex % size;
      const b = boxOf(r, c);

      for (let v = 1; v <= size; v++) {
        const bit = 1 << v;
        if (!(bestOptions & bit)) continue;
        cells[bestIndex] = v;
        rowUsed[r] |= bit;
        colUsed[c] |= bit;
        boxUsed[b] |= bit;
        search();
        cells[bestIndex] = 0;
        rowUsed[r] &= ~bit;
        colUsed[c] &= ~bit;
        boxUsed[b] &= ~bit;
        if (count >= limit) return;
      }
    }

    search();
    return count;
  }

  function removeCells(solution, geo, target) {
    const puzzle = solution.slice();
    let clues = puzzle.length;
    for (const index of shuffle(range(puzzle.length))) {
      if (clues <= target) break;
      const value = puzzle[index];
      puzzle[index] = 0;
      if (countSolutions(puzzle, geo, 2, NODE_BUDGET) === 1) {
        clues--;
      } else {
        puzzle[index] = value;
      }
    }
    return { puzzle, clues };
  }

  function generate(size, difficulty) {
    const config = SIZES[size];
    const geo = { size, rows: config.rows, cols: config.cols };
    const [minClues, maxClues] = CLUE_RANGES[size][difficulty];
    let best = null;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const solution = generateSolution(geo);
      const target = randomBetween(minClues, maxClues);
      const { puzzle, clues } = removeCells(solution, geo, target);
      const candidate = { size, rows: geo.rows, cols: geo.cols, puzzle, solution, clues };
      if (clues <= maxClues) return candidate;
      if (!best || clues < best.clues) best = candidate;
    }

    return best;
  }

  return { SIZES, CLUE_RANGES, generate, countSolutions };
})();
