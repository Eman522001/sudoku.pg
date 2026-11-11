const PageRenderer = (function () {
  const PAPER_SIZES = {
    A4: { width: 210, height: 297 },
    A5: { width: 148, height: 210 }
  };

  const FONTS = [
    { key: "Cairo", label: "كايرو (افتراضي)" },
    { key: "Amiri", label: "أميري (نسخ كلاسيكي)" },
    { key: "Rakkas", label: "خط الفرشاة" },
    { key: "Baloo Bhaijaan 2", label: "بلابيلو" },
    { key: "Lemonada", label: "ليمونادا (طفولي)" },
    { key: "Marhey", label: "مرحي (طفولي)" },
    { key: "Cairo Play", label: "كايرو بلاي (طفولي)" },
    { key: "Reem Kufi Fun", label: "ريم كوفي فن (طفولي)" }
  ];

  const toAr = (value) => SymbolSets.toArabicNumerals(value);

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

  function buildPages(doc, settings) {
    const perPage = settings.cols * settings.rows;
    const batches = [];

    for (let start = 0; start < doc.puzzles.length; start += perPage) {
      const items = [];
      const end = Math.min(start + perPage, doc.puzzles.length);
      for (let i = start; i < end; i++) {
        items.push({ puzzle: doc.puzzles[i], index: i });
      }
      batches.push(items);
    }

    const pages = [];
    if (settings.showCover) {
      pages.push({ type: "cover" });
    }

    batches.forEach((items, batchIndex) => {
      pages.push({
        type: "puzzles",
        items,
        header: !settings.showCover && batchIndex === 0 && Boolean(settings.title)
      });
      if (settings.solutionsPlacement === "next") {
        pages.push({ type: "solutions", items });
      }
    });

    if (settings.solutionsPlacement === "end") {
      batches.forEach((items) => pages.push({ type: "solutions", items }));
    }

    return pages;
  }

  function renderBoard(doc, data, isSolution) {
    const { size, rows, cols } = doc;
    const board = document.createElement("div");
    board.className = "print-board";
    board.style.setProperty("--n", size);
    board.style.gridTemplateColumns = `repeat(${size}, minmax(0, 1fr))`;
    board.style.gridTemplateRows = `repeat(${size}, minmax(0, 1fr))`;

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const index = r * size + c;
        const cell = document.createElement("div");
        cell.className = "cell";

        if (isSolution && data.puzzle[index]) cell.classList.add("given");
        if ((c + 1) % cols === 0 && c < size - 1) cell.classList.add("box-right");
        if ((r + 1) % rows === 0 && r < size - 1) cell.classList.add("box-bottom");

        const value = isSolution ? data.solution[index] : data.puzzle[index];
        if (value) cell.appendChild(createSymbolNode(doc.symbols[value - 1]));

        board.appendChild(cell);
      }
    }

    return board;
  }

  function renderPuzzleBlock(item, doc, settings, isSolution) {
    const block = document.createElement("div");
    block.className = "puzzle-block";
    block.dataset.index = item.index;

    const label = document.createElement("div");
    label.className = "puzzle-label";
    const prefix = isSolution ? settings.solutionPrefix : settings.puzzlePrefix;
    label.textContent = [prefix, toAr(item.index + 1)].filter(Boolean).join(" ");

    block.appendChild(label);
    block.appendChild(renderBoard(doc, item.puzzle, isSolution));
    return block;
  }

  function renderKey(symbols) {
    const key = document.createElement("div");
    key.className = "page-key";

    for (const symbol of symbols) {
      const item = document.createElement("div");
      item.className = "key-item";

      const icon = document.createElement("span");
      icon.className = "key-icon";
      icon.appendChild(createSymbolNode(symbol));
      item.appendChild(icon);

      if (symbol.kind !== "text") {
        const name = document.createElement("span");
        name.textContent = symbol.label;
        item.appendChild(name);
      }

      key.appendChild(item);
    }

    return key;
  }

  function coverMeta(doc) {
    return (
      `${toAr(doc.puzzles.length)} لغزًا - ` +
      `${toAr(doc.size)} × ${toAr(doc.size)} - ` +
      `${doc.difficultyLabel}`
    );
  }

  function renderCover(el, doc, settings) {
    const title = document.createElement("h1");
    title.className = "cover-title";
    title.textContent = settings.title;

    const rule = document.createElement("div");
    rule.className = "cover-rule";

    const meta = document.createElement("p");
    meta.className = "cover-meta";
    meta.textContent = coverMeta(doc);

    const motif = document.createElement("div");
    motif.className = "cover-symbols";
    for (const symbol of doc.symbols) {
      const icon = document.createElement("span");
      icon.className = "motif";
      icon.appendChild(createSymbolNode(symbol));
      motif.appendChild(icon);
    }

    el.append(title, rule, motif, meta);
  }

  function renderPage(page, doc, settings) {
    const paper = PAPER_SIZES[settings.paper];
    const el = document.createElement("div");
    el.className = "page";
    el.dataset.widthMm = paper.width;
    el.dataset.heightMm = paper.height;

    el.style.setProperty("--page-w", `${paper.width}mm`);
    el.style.setProperty("--page-h", `${paper.height}mm`);
    el.style.setProperty("--m-top", `${settings.margins.top}mm`);
    el.style.setProperty("--m-right", `${settings.margins.right}mm`);
    el.style.setProperty("--m-bottom", `${settings.margins.bottom}mm`);
    el.style.setProperty("--m-left", `${settings.margins.left}mm`);
    el.style.setProperty("--ink", settings.colors.numbers);
    el.style.setProperty("--line", settings.colors.lines);
    el.style.setProperty("--cell", settings.colors.cells);
    el.style.setProperty("--title", settings.colors.title);
    el.style.setProperty("--title-size", `${settings.titleSize}pt`);
    el.style.fontFamily = `"${settings.font}", Tahoma, sans-serif`;

    if (page.type === "cover") {
      el.classList.add("cover");
      renderCover(el, doc, settings);
      return el;
    }

    if (page.header) {
      const heading = document.createElement("h1");
      heading.className = "page-title";
      heading.textContent = settings.title;
      el.appendChild(heading);
    }

    const body = document.createElement("div");
    body.className = "page-body";
    body.style.gridTemplateColumns = `repeat(${settings.cols}, minmax(0, 1fr))`;
    body.style.gridTemplateRows = `repeat(${settings.rows}, minmax(0, 1fr))`;

    const isSolution = page.type === "solutions";
    for (const item of page.items) {
      body.appendChild(renderPuzzleBlock(item, doc, settings, isSolution));
    }

    el.appendChild(body);
    el.appendChild(renderKey(doc.symbols));
    return el;
  }

  function buildSinglePages(doc, index, includeSolution) {
    const items = [{ puzzle: doc.puzzles[index], index }];
    const pages = [{ type: "puzzles", items, header: false }];
    if (includeSolution) {
      pages.push({ type: "solutions", items });
    }
    return pages;
  }

  return {
    PAPER_SIZES,
    FONTS,
    createSymbolNode,
    coverMeta,
    buildPages,
    buildSinglePages,
    renderPage
  };
})();
