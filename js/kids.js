const KidsTheme = (function () {
  const WIDTH = 1410;
  const HEIGHT = 2000;
  const DISPLAY_SCALE = 1410 / 924;
  const BOARD_REF = 1136;
  const BORDER_REF = 24;
  const THIN_REF = 4;

  const COLORS = {
    background: "#5170FF",
    navy: "#033372",
    white: "#FFFFFF",
    coverFrame: "#FDFDFD",
    cardBorder: "#3B2E8C",
    line: "#000000",
    cells: ["#FFF3C2", "#D8C7FA", "#C2DCFF", "#E4FFC2"]
  };

  const FAMILY = {
    title: `"Baloo Bhaijaan 2", Tahoma, sans-serif`,
    digits: `"Rakkas", Tahoma, sans-serif`,
    text: `"Cairo", Tahoma, sans-serif`
  };

  const DEFAULTS = {
    age: "من عمر 3 حتى 10 سنوات",
    author: "إيمان صبحي"
  };

  const FONT_LOADS = [
    '800 40px "Baloo Bhaijaan 2"',
    '600 40px "Baloo Bhaijaan 2"',
    '40px "Rakkas"',
    '700 40px "Cairo"'
  ];

  const DECOR_BARS = [
    { x: 37, y: 37, w: 148, h: 18, fill: "#FFE066" },
    { x: 740, y: 1250, w: 145, h: 25, fill: "#D9F7C9" }
  ];

  const DECOR_GLYPHS = [
    { text: "9", x: 200, y: 70, size: 150, rot: -12, fill: "#9179CE" },
    { text: "0", x: 46, y: 160, size: 150, rot: 0, fill: "#9199FC" },
    { text: "½", x: 846, y: 62, size: 110, rot: 0, fill: "#9199FC" },
    { text: "×", x: 846, y: 125, size: 120, rot: 0, fill: "#9199FC" },
    { text: "½", x: 75, y: 745, size: 110, rot: 0, fill: "#9199FC" },
    { text: "×", x: 75, y: 810, size: 120, rot: 0, fill: "#9199FC" },
    { text: "6", x: 40, y: 1010, size: 170, rot: 15, fill: "#9179CE" },
    { text: "7", x: 160, y: 1150, size: 170, rot: 10, fill: "#4D98EC" },
    { text: "9", x: 205, y: 1260, size: 150, rot: -10, fill: "#9179CE" },
    { text: "½", x: 850, y: 1140, size: 110, rot: 0, fill: "#9199FC" },
    { text: "×", x: 850, y: 1210, size: 120, rot: 0, fill: "#9199FC" }
  ];

  const DECOR_DOTS = [
    [46, 330, 9, "#D9F7C9"], [870, 330, 12, "#FFE066"], [66, 493, 20, "#FFE066"],
    [157, 560, 11, "#D9F7C9"], [862, 493, 16, "#E3D0FF"], [886, 577, 10, "#CFE3FF"],
    [858, 710, 11, "#CFE3FF"], [872, 775, 11, "#CFE3FF"], [98, 925, 14, "#CFE3FF"],
    [826, 925, 20, "#D9F7C9"], [178, 990, 8, "#FFE066"], [246, 1138, 10, "#D9F7C9"],
    [676, 1140, 11, "#E3D0FF"], [116, 1255, 9, "#D9F7C9"], [806, 1255, 11, "#FFE066"],
    [896, 1005, 9, "#FFE066"], [846, 1055, 16, "#D9F7C9"], [66, 1055, 16, "#CFE3FF"],
    [48, 710, 9, "#E3D0FF"], [68, 780, 8, "#E3D0FF"]
  ];

  function s(value) {
    return value * DISPLAY_SCALE;
  }

  function rect(x, y, w, h, fill, props) {
    return Object.assign({ t: "rect", x, y, w, h, r: 0, fill, stroke: null, sw: 0 }, props || {});
  }

  function text(props) {
    return Object.assign(
      { t: "text", anchor: "middle", rot: 0, stroke: null, sw: 0, weight: 400 },
      props
    );
  }

  function symbolItems(symbol, cx, cy, cell) {
    if (symbol.kind === "color") {
      return [{ t: "circle", x: cx, y: cy, r: cell * 0.26, fill: symbol.value }];
    }
    if (symbol.kind === "shape") {
      return [{ t: "shape", cx, cy, size: cell * 0.5, svg: symbol.svg, color: COLORS.navy, label: symbol.label }];
    }
    return [
      text({
        x: cx,
        y: cy,
        text: symbol.label,
        size: cell * 0.48,
        family: FAMILY.digits,
        fill: COLORS.navy
      })
    ];
  }

  function boardItems(doc, data, isSolution, x, y, side) {
    const { size, rows, cols, symbols } = doc;
    const k = side / BOARD_REF;
    const border = BORDER_REF * k;
    const thin = THIN_REF * k;
    const ax = x + border;
    const ay = y + border;
    const inner = side - 2 * border;
    const cell = inner / size;
    const boxesPerRow = size / cols;

    const items = [rect(x, y, side, side, COLORS.navy)];

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const box = Math.floor(r / rows) * boxesPerRow + Math.floor(c / cols);
        items.push(rect(ax + c * cell, ay + r * cell, cell, cell, COLORS.cells[box % COLORS.cells.length]));
      }
    }

    for (let i = 1; i < size; i++) {
      if (i % cols === 0) {
        items.push(rect(ax + i * cell - border / 2, ay, border, inner, COLORS.navy));
      } else {
        items.push(rect(ax + i * cell - thin / 2, ay, thin, inner, COLORS.line));
      }
      if (i % rows === 0) {
        items.push(rect(ax, ay + i * cell - border / 2, inner, border, COLORS.navy));
      } else {
        items.push(rect(ax, ay + i * cell - thin / 2, inner, thin, COLORS.line));
      }
    }

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const index = r * size + c;
        const value = isSolution ? data.solution[index] : data.puzzle[index];
        if (!value) continue;
        items.push(...symbolItems(symbols[value - 1], ax + (c + 0.5) * cell, ay + (r + 0.5) * cell, cell));
      }
    }

    return items;
  }

  function keyItems(symbols) {
    const perRow = 5;
    const colWidth = 220;
    const cell = 150;
    const top = 1690;
    const rowHeight = 150;
    const items = [];

    symbols.forEach((symbol, i) => {
      const row = Math.floor(i / perRow);
      const inRow = Math.min(perRow, symbols.length - row * perRow);
      const col = i % perRow;
      const x = WIDTH / 2 + ((inRow - 1) / 2 - col) * colWidth;
      const y = top + row * rowHeight;
      items.push(...symbolItems(symbol, x, y, cell));
      items.push(
        text({
          x,
          y: y + 72,
          text: symbol.label,
          size: 40,
          family: FAMILY.text,
          weight: 700,
          fill: COLORS.navy
        })
      );
    });

    return items;
  }

  function coverItems(doc, settings) {
    const items = [rect(0, 0, WIDTH, HEIGHT, COLORS.background)];

    DECOR_BARS.forEach((bar) => {
      items.push(rect(s(bar.x), s(bar.y), s(bar.w), s(bar.h), bar.fill, { r: s(bar.h) / 2 }));
    });

    DECOR_DOTS.forEach(([x, y, r, fill]) => {
      items.push({ t: "circle", x: s(x), y: s(y), r: s(r), fill });
    });

    DECOR_GLYPHS.forEach((glyph) => {
      items.push(
        text({
          x: s(glyph.x),
          y: s(glyph.y),
          text: glyph.text,
          size: s(glyph.size),
          family: FAMILY.title,
          weight: 800,
          fill: glyph.fill,
          rot: glyph.rot
        })
      );
    });

    items.push(
      text({
        x: s(740),
        y: s(150),
        text: "لعبة",
        size: 88,
        family: FAMILY.title,
        weight: 800,
        fill: COLORS.white,
        stroke: COLORS.navy,
        sw: 22
      })
    );
    items.push(
      text({
        x: s(465),
        y: s(242),
        text: settings.kidsTitle || "سودوكو",
        size: 340,
        family: FAMILY.title,
        weight: 800,
        fill: COLORS.white,
        stroke: COLORS.navy,
        sw: 26
      })
    );
    items.push(
      text({
        x: 438,
        y: 520,
        text: "للأطفال",
        size: 80,
        family: FAMILY.title,
        weight: 800,
        fill: COLORS.white,
        stroke: COLORS.navy,
        sw: 22
      })
    );

    items.push(rect(s(238), s(408), s(400), s(100), COLORS.navy, { r: s(50) }));
    items.push(
      text({
        x: s(438),
        y: s(458),
        text: settings.kidsAge || DEFAULTS.age,
        size: 58,
        family: FAMILY.text,
        weight: 700,
        fill: COLORS.white
      })
    );

    items.push(
      rect(328, 884, 752, 735, COLORS.coverFrame, {
        r: 90,
        stroke: COLORS.navy,
        sw: 11
      })
    );
    items.push(...boardItems(doc, doc.puzzles[0], false, 386, 943, 637));

    items.push(
      text({
        x: s(460),
        y: s(1120),
        text: "إعداد وتصميم:",
        size: 62,
        family: FAMILY.title,
        weight: 600,
        fill: COLORS.white,
        stroke: COLORS.navy,
        sw: 14
      })
    );
    items.push(
      text({
        x: s(460),
        y: s(1200),
        text: settings.kidsAuthor || DEFAULTS.author,
        size: 100,
        family: FAMILY.title,
        weight: 800,
        fill: COLORS.white,
        stroke: COLORS.navy,
        sw: 22
      })
    );

    return items;
  }

  function pageItems(page, doc, settings) {
    const items = [rect(0, 0, WIDTH, HEIGHT, COLORS.background)];
    items.push(
      rect(73, 73, 1263, 1854, COLORS.white, {
        r: 76,
        stroke: COLORS.cardBorder,
        sw: 14
      })
    );

    const isSolution = page.type === "solutions";
    const cols = settings.cols;
    const rows = settings.rows;
    const hasKey = doc.symbols[0].kind !== "text";

    if (cols * rows === 1) {
      const y = hasKey ? 500 : 548;
      items.push(...boardItems(doc, page.items[0].puzzle, isSolution, 132, y, 1136));
    } else {
      const gap = 50;
      const areaX = 150;
      const areaY = 150;
      const areaW = 1110;
      const areaH = 1480;
      const labelH = 60;
      const bw = (areaW - gap * (cols - 1)) / cols;
      const bh = (areaH - gap * (rows - 1)) / rows;
      const prefix = isSolution ? settings.solutionPrefix : settings.puzzlePrefix;

      page.items.forEach((item, k) => {
        const r = Math.floor(k / cols);
        const c = k % cols;
        const bx = areaX + (cols - 1 - c) * (bw + gap);
        const by = areaY + r * (bh + gap);
        const label = [prefix, SymbolSets.toArabicNumerals(item.index + 1)].filter(Boolean).join(" ");
        items.push(
          text({
            x: bx + bw / 2,
            y: by + labelH / 2,
            text: label,
            size: 52,
            family: FAMILY.text,
            weight: 700,
            fill: COLORS.navy
          })
        );
        const side = Math.min(bw, bh - labelH);
        items.push(...boardItems(doc, item.puzzle, isSolution, bx + (bw - side) / 2, by + labelH, side));
      });
    }

    if (hasKey) {
      items.push(...keyItems(doc.symbols));
    }

    return items;
  }

  function buildItems(page, doc, settings) {
    return page.type === "cover" ? coverItems(doc, settings) : pageItems(page, doc, settings);
  }

  function escapeXml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function itemToSvg(item) {
    if (item.t === "rect") {
      const stroke = item.stroke ? ` stroke="${item.stroke}" stroke-width="${item.sw}"` : "";
      return `<rect x="${item.x}" y="${item.y}" width="${item.w}" height="${item.h}" rx="${item.r}" fill="${item.fill}"${stroke}/>`;
    }
    if (item.t === "circle") {
      return `<circle cx="${item.x}" cy="${item.y}" r="${item.r}" fill="${item.fill}"/>`;
    }
    if (item.t === "text") {
      const stroke = item.stroke
        ? ` stroke="${item.stroke}" stroke-width="${item.sw}" stroke-linejoin="round" paint-order="stroke"`
        : "";
      const rot = item.rot ? ` transform="rotate(${item.rot} ${item.x} ${item.y})"` : "";
      return (
        `<text x="${item.x}" y="${item.y}" text-anchor="middle" dominant-baseline="central" ` +
        `font-family='${item.family}' font-size="${item.size}" font-weight="${item.weight}" fill="${item.fill}"${stroke}${rot}>` +
        `${escapeXml(item.text)}</text>`
      );
    }
    const half = item.size / 2;
    return (
      `<svg x="${item.cx - half}" y="${item.cy - half}" width="${item.size}" height="${item.size}" viewBox="0 0 40 40">` +
      `<g fill="none" stroke="${item.color}" stroke-width="2.4" stroke-linejoin="round">${item.svg}</g></svg>`
    );
  }

  function roundRectPath(ctx, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  function drawItems(ctx, items, k, images) {
    for (const item of items) {
      if (item.t === "rect") {
        roundRectPath(ctx, item.x * k, item.y * k, item.w * k, item.h * k, item.r * k);
        ctx.fillStyle = item.fill;
        ctx.fill();
        if (item.stroke) {
          ctx.lineWidth = item.sw * k;
          ctx.strokeStyle = item.stroke;
          ctx.stroke();
        }
      } else if (item.t === "circle") {
        ctx.beginPath();
        ctx.arc(item.x * k, item.y * k, item.r * k, 0, Math.PI * 2);
        ctx.fillStyle = item.fill;
        ctx.fill();
      } else if (item.t === "text") {
        ctx.save();
        ctx.translate(item.x * k, item.y * k);
        ctx.rotate((item.rot * Math.PI) / 180);
        ctx.font = `${item.weight} ${item.size * k}px ${item.family}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        if (item.stroke) {
          ctx.lineJoin = "round";
          ctx.lineWidth = item.sw * k;
          ctx.strokeStyle = item.stroke;
          ctx.strokeText(item.text, 0, 0);
        }
        ctx.fillStyle = item.fill;
        ctx.fillText(item.text, 0, 0);
        ctx.restore();
      } else {
        const size = item.size * k;
        ctx.drawImage(images.get(item.label), item.cx * k - size / 2, item.cy * k - size / 2, size, size);
      }
    }
  }

  function markup(page, doc, settings) {
    const body = buildItems(page, doc, settings).map(itemToSvg).join("");
    return (
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" ` +
      `width="100%" height="100%" style="display:block">${body}</svg>`
    );
  }

  function draw(ctx, page, doc, settings, images, k) {
    drawItems(ctx, buildItems(page, doc, settings), k, images);
  }

  function loadFonts() {
    if (!document.fonts) return Promise.resolve();
    return Promise.all(FONT_LOADS.map((spec) => document.fonts.load(spec).catch(() => null)));
  }

  return {
    WIDTH,
    HEIGHT,
    ink: COLORS.navy,
    markup,
    draw,
    loadFonts
  };
})();
