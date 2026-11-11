const Exporter = (function () {
  const DPI = 300;
  const PX_PER_MM = DPI / 25.4;
  const PX_PER_PT = DPI / 72;
  const LABEL_MM = 3.4;
  const KEY_NAME_MM = 3.2;
  const KEY_ICON_MM = 6;
  const KEY_ICON_TEXT_MM = 3.6;
  const COVER_META_MM = 4.2;
  const RESERVED_LABEL_MM = 7;
  const JSZIP_URL = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";

  let pageSizeStyle = null;

  function fontStack(font) {
    return `"${font}", Tahoma, sans-serif`;
  }

  function setFont(ctx, weight, px, font) {
    ctx.font = `${weight} ${px}px ${fontStack(font)}`;
  }

  function drawText(ctx, text, x, y, px, weight, font, color, align) {
    setFont(ctx, weight, px, font);
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = "middle";
    ctx.fillText(text, x, y);
  }

  function mixWithWhite(hex, share) {
    const n = parseInt(hex.slice(1), 16);
    const channel = (shift) => Math.round(((n >> shift) & 255) * share + 255 * (1 - share));
    return `rgb(${channel(16)}, ${channel(8)}, ${channel(0)})`;
  }

  function shapeMarkup(svg, ink) {
    return (
      `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 40 40">` +
      `<g fill="none" stroke="${ink}" stroke-width="2.4" stroke-linejoin="round">${svg}</g>` +
      `</svg>`
    );
  }

  function loadSvgImage(markup) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(new Blob([markup], { type: "image/svg+xml" }));
      const image = new Image();
      image.onload = () => {
        URL.revokeObjectURL(url);
        resolve(image);
      };
      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("تعذر تجهيز أحد الأشكال للتصدير"));
      };
      image.src = url;
    });
  }

  async function prepare(doc, settings) {
    if (document.fonts) {
      await Promise.all(
        [400, 600, 700, 800].map((weight) =>
          document.fonts.load(`${weight} 40px ${fontStack(settings.font)}`).catch(() => null)
        )
      );
    }

    const images = new Map();
    for (const symbol of doc.symbols) {
      if (symbol.kind === "shape" && !images.has(symbol.label)) {
        const image = await loadSvgImage(shapeMarkup(symbol.svg, settings.colors.numbers));
        images.set(symbol.label, image);
      }
    }
    return { images };
  }

  function drawCellSymbol(ctx, symbol, cx, cy, cell, weight, font, ink, images) {
    if (symbol.kind === "color") {
      ctx.beginPath();
      ctx.arc(cx, cy, (cell * 0.52) / 2, 0, Math.PI * 2);
      ctx.fillStyle = symbol.value;
      ctx.fill();
      return;
    }
    if (symbol.kind === "shape") {
      const size = cell * 0.6;
      ctx.drawImage(images.get(symbol.label), cx - size / 2, cy - size / 2, size, size);
      return;
    }
    drawText(ctx, symbol.label, cx, cy, cell * 0.5, weight, font, ink, "center");
  }

  function drawKeySymbol(ctx, symbol, cx, cy, key, font, ink, images) {
    if (symbol.kind === "color") {
      ctx.beginPath();
      ctx.arc(cx, cy, (key.iconSize * 0.8) / 2, 0, Math.PI * 2);
      ctx.fillStyle = symbol.value;
      ctx.fill();
      return;
    }
    if (symbol.kind === "shape") {
      const size = key.iconSize * 0.8;
      ctx.drawImage(images.get(symbol.label), cx - size / 2, cy - size / 2, size, size);
      return;
    }
    drawText(ctx, symbol.label, cx, cy, KEY_ICON_TEXT_MM * PX_PER_MM, 700, font, ink, "center");
  }

  function drawBoard(ctx, doc, data, isSolution, x, y, side, settings, images) {
    const { size, rows, cols, symbols } = doc;
    const cell = side / size;
    const thin = 0.35 * PX_PER_MM;
    const thick = 0.8 * PX_PER_MM;
    const thinColor = mixWithWhite(settings.colors.lines, 0.45);
    const font = settings.font;
    const ink = settings.colors.numbers;

    ctx.fillStyle = settings.colors.cells;
    ctx.fillRect(x, y, side, side);

    ctx.fillStyle = thinColor;
    for (let i = 1; i < size; i++) {
      if (i % cols !== 0) ctx.fillRect(x + i * cell - thin / 2, y, thin, side);
      if (i % rows !== 0) ctx.fillRect(x, y + i * cell - thin / 2, side, thin);
    }

    ctx.fillStyle = settings.colors.lines;
    for (let i = 1; i < size; i++) {
      if (i % cols === 0) ctx.fillRect(x + i * cell - thick / 2, y, thick, side);
      if (i % rows === 0) ctx.fillRect(x, y + i * cell - thick / 2, side, thick);
    }
    ctx.fillRect(x, y, side, thick);
    ctx.fillRect(x, y + side - thick, side, thick);
    ctx.fillRect(x, y, thick, side);
    ctx.fillRect(x + side - thick, y, thick, side);

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const index = r * size + c;
        const value = isSolution ? data.solution[index] : data.puzzle[index];
        if (!value) continue;
        const weight = isSolution && data.puzzle[index] ? 800 : 600;
        drawCellSymbol(
          ctx,
          symbols[value - 1],
          x + (c + 0.5) * cell,
          y + (r + 0.5) * cell,
          cell,
          weight,
          font,
          ink,
          images
        );
      }
    }
  }

  function layoutKey(ctx, symbols, maxWidth, font) {
    const iconSize = KEY_ICON_MM * PX_PER_MM;
    const nameGap = 1.5 * PX_PER_MM;
    const itemGap = 5 * PX_PER_MM;
    const lineGap = 2 * PX_PER_MM;
    const namePx = KEY_NAME_MM * PX_PER_MM;
    setFont(ctx, 400, namePx, font);

    const items = symbols.map((symbol) => {
      const nameWidth = symbol.kind === "text" ? 0 : ctx.measureText(symbol.label).width;
      return { symbol, nameWidth, width: iconSize + (nameWidth ? nameGap + nameWidth : 0) };
    });

    const rows = [];
    let row = [];
    let rowWidth = 0;
    for (const item of items) {
      const extra = row.length ? itemGap : 0;
      if (row.length && rowWidth + extra + item.width > maxWidth) {
        rows.push(row);
        row = [];
        rowWidth = 0;
      }
      rowWidth += (row.length ? itemGap : 0) + item.width;
      row.push(item);
    }
    if (row.length) rows.push(row);

    return {
      rows,
      height: rows.length * iconSize + Math.max(0, rows.length - 1) * lineGap,
      iconSize,
      nameGap,
      itemGap,
      lineGap,
      namePx
    };
  }

  function drawKey(ctx, key, settings, centerX, topY, images) {
    const font = settings.font;
    const ink = settings.colors.numbers;
    let y = topY;

    for (const row of key.rows) {
      const rowWidth = row.reduce((sum, item, i) => sum + item.width + (i ? key.itemGap : 0), 0);
      let right = centerX + rowWidth / 2;

      for (const item of row) {
        const iconLeft = right - key.iconSize;
        const cx = iconLeft + key.iconSize / 2;
        const cy = y + key.iconSize / 2;
        drawKeySymbol(ctx, item.symbol, cx, cy, key, font, ink, images);

        if (item.nameWidth) {
          drawText(ctx, item.symbol.label, iconLeft - key.nameGap, cy, key.namePx, 400, font, ink, "right");
        }

        right = iconLeft - (item.nameWidth ? key.nameGap + item.nameWidth : 0) - key.itemGap;
      }

      y += key.iconSize + key.lineGap;
    }
  }

  function drawCover(ctx, box, doc, settings) {
    const font = settings.font;
    const centerX = (box.left + box.right) / 2;
    const titlePx = settings.titleSize * 1.4 * PX_PER_PT;
    const titleLine = titlePx * 1.3;
    const ruleGap = 8 * PX_PER_MM;
    const ruleH = 0.6 * PX_PER_MM;
    const ruleW = 40 * PX_PER_MM;
    const metaPx = COVER_META_MM * PX_PER_MM;
    const metaLine = metaPx * 1.3;
    const total = titleLine + ruleGap + ruleH + ruleGap + metaLine;

    let y = (box.top + box.bottom) / 2 - total / 2;
    drawText(ctx, settings.title, centerX, y + titleLine / 2, titlePx, 700, font, settings.colors.title, "center");

    y += titleLine + ruleGap;
    ctx.fillStyle = settings.colors.title;
    ctx.fillRect(centerX - ruleW / 2, y, ruleW, ruleH);

    y += ruleH + ruleGap;
    drawText(
      ctx,
      PageRenderer.coverMeta(doc),
      centerX,
      y + metaLine / 2,
      metaPx,
      400,
      font,
      settings.colors.numbers,
      "center"
    );
  }

  async function renderPageToCanvas(page, doc, settings, images) {
    const paper = PageRenderer.PAPER_SIZES[settings.paper];
    const width = Math.round(paper.width * PX_PER_MM);
    const height = Math.round(paper.height * PX_PER_MM);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    const m = settings.margins;
    const box = {
      left: m.left * PX_PER_MM,
      right: width - m.right * PX_PER_MM,
      top: m.top * PX_PER_MM,
      bottom: height - m.bottom * PX_PER_MM
    };

    if (page.type === "cover") {
      drawCover(ctx, box, doc, settings);
      return canvas;
    }

    const font = settings.font;
    const titleColor = settings.colors.title;
    const centerX = (box.left + box.right) / 2;
    let y = box.top;

    if (page.header) {
      const px = settings.titleSize * PX_PER_PT;
      drawText(ctx, settings.title, centerX, y + (px * 1.3) / 2, px, 700, font, titleColor, "center");
      y += px * 1.3 + 4 * PX_PER_MM;
    }

    const key = layoutKey(ctx, doc.symbols, box.right - box.left, font);
    const keyTop = box.bottom - key.height;
    const bodyBottom = keyTop - 4 * PX_PER_MM;

    const gap = 5 * PX_PER_MM;
    const cols = settings.cols;
    const rows = settings.rows;
    const bodyW = box.right - box.left;
    const bodyH = bodyBottom - y;
    const cellW = (bodyW - gap * (cols - 1)) / cols;
    const cellH = (bodyH - gap * (rows - 1)) / rows;
    const labelPx = LABEL_MM * PX_PER_MM;
    const labelLine = labelPx * 1.2;
    const reserved = RESERVED_LABEL_MM * PX_PER_MM;
    const isSolution = page.type === "solutions";

    page.items.forEach((item, k) => {
      const r = Math.floor(k / cols);
      const c = k % cols;
      const blockX = box.left + (cols - 1 - c) * (cellW + gap);
      const blockY = y + r * (cellH + gap);

      const prefix = isSolution ? settings.solutionPrefix : settings.puzzlePrefix;
      const label = [prefix, SymbolSets.toArabicNumerals(item.index + 1)].filter(Boolean).join(" ");
      drawText(ctx, label, blockX + cellW / 2, blockY + labelLine / 2, labelPx, 700, font, titleColor, "center");

      const side = Math.min(cellW, cellH - reserved);
      const boardX = blockX + (cellW - side) / 2;
      const boardY = blockY + labelLine + 1.5 * PX_PER_MM;
      drawBoard(ctx, doc, item.puzzle, isSolution, boardX, boardY, side, settings, images);
    });

    if (key.rows.length) {
      drawKey(ctx, key, settings, centerX, keyTop, images);
    }

    return canvas;
  }

  const CRC_TABLE = (function () {
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      table[n] = c >>> 0;
    }
    return table;
  })();

  function crc32(bytes) {
    let crc = 0xffffffff;
    for (const byte of bytes) {
      crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  async function withDpi(blob, dpi) {
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const pixelsPerMeter = Math.round(dpi / 0.0254);

    const typeAndData = new Uint8Array(13);
    typeAndData.set(new TextEncoder().encode("pHYs"), 0);
    const dataView = new DataView(typeAndData.buffer);
    dataView.setUint32(4, pixelsPerMeter);
    dataView.setUint32(8, pixelsPerMeter);
    typeAndData[12] = 1;

    const chunk = new Uint8Array(21);
    const chunkView = new DataView(chunk.buffer);
    chunkView.setUint32(0, 9);
    chunk.set(typeAndData, 4);
    chunkView.setUint32(17, crc32(typeAndData));

    const IHDR_END = 33;
    const output = new Uint8Array(bytes.length + chunk.length);
    output.set(bytes.subarray(0, IHDR_END), 0);
    output.set(chunk, IHDR_END);
    output.set(bytes.subarray(IHDR_END), IHDR_END + chunk.length);
    return new Blob([output], { type: "image/png" });
  }

  async function canvasToBlob(canvas) {
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (result) => (result ? resolve(result) : reject(new Error("تعذر إنشاء ملف الصورة"))),
        "image/png"
      );
    });
    return withDpi(blob, DPI);
  }

  function downloadBlob(blob, name) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  function loadJSZip() {
    if (window.JSZip) return Promise.resolve(window.JSZip);
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = JSZIP_URL;
      script.onload = () => resolve(window.JSZip);
      script.onerror = () => reject(new Error("تعذر تحميل مكتبة الضغط"));
      document.head.appendChild(script);
    });
  }

  async function saveFiles(files, zipName) {
    if (files.length === 1) {
      downloadBlob(files[0].blob, files[0].name);
      return;
    }

    try {
      const JSZip = await loadJSZip();
      const zip = new JSZip();
      files.forEach((file) => zip.file(file.name, file.blob));
      downloadBlob(await zip.generateAsync({ type: "blob" }), zipName);
    } catch (error) {
      for (const file of files) {
        downloadBlob(file.blob, file.name);
        await new Promise((resolve) => setTimeout(resolve, 600));
      }
    }
  }

  function printPages(pages, doc, settings) {
    const area = document.getElementById("print-area");
    const paper = PageRenderer.PAPER_SIZES[settings.paper];

    if (!pageSizeStyle) {
      pageSizeStyle = document.createElement("style");
      document.head.appendChild(pageSizeStyle);
    }
    pageSizeStyle.textContent = `@page { size: ${paper.width}mm ${paper.height}mm; margin: 0; }`;

    area.innerHTML = "";
    for (const page of pages) {
      const el = PageRenderer.renderPage(page, doc, settings);
      el.classList.add("print-page");
      area.appendChild(el);
    }

    const previousTitle = document.title;
    document.title = "sudoku-puzzles";

    const cleanup = () => {
      area.innerHTML = "";
      document.title = previousTitle;
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);

    window.print();
  }

  return {
    prepare,
    renderPageToCanvas,
    canvasToBlob,
    saveFiles,
    printPages
  };
})();
