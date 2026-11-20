const DecoTheme = (function () {
  const W = 1410;
  const H = 2000;
  const BOARD = { x: 195, y: 480, side: 1020 };
  const HEART = { x: 1085, y: 1650 };
  const BAR = { x: 430, y: 395, w: 560, h: 26 };
  const PX_PER_MM = 300 / 25.4;
  const GRAY_DEFAULT = "#E8E8E8";
  const DEFAULT_FONT = "DG Forsha Scribble";

  const BIG = ["clock", "mug", "globe", "books", "plant", "leaf", "coffee", "plane"];
  const SMALL = ["sparkle", "heart", "swirl", "star", "dots", "pencil"];

  const ZONES = [
    { x: 40, y: 60, w: 290, h: 310, cat: "big", p: 0.9 },
    { x: 520, y: 40, w: 370, h: 330, cat: "big", p: 0.85 },
    { x: 1000, y: 60, w: 370, h: 320, cat: "big", p: 0.9 },
    { x: 20, y: 400, w: 160, h: 150, cat: "small", p: 0.6 },
    { x: 20, y: 860, w: 160, h: 260, cat: "small", p: 0.9 },
    { x: 1235, y: 800, w: 165, h: 380, cat: "small", p: 0.9 },
    { x: 20, y: 1560, w: 310, h: 420, cat: "big", p: 0.9 },
    { x: 350, y: 1560, w: 700, h: 420, cat: "big", p: 0.85 },
    { x: 1230, y: 1270, w: 170, h: 330, cat: "small", p: 0.8 }
  ];

  const HEART_PATH = '<path d="M100 178 C40 130 14 96 18 62 C24 26 72 18 100 60 C128 18 176 26 182 62 C186 96 160 130 100 178 Z"/>';

  function mulberry32(a) {
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function between(rng, a, b) {
    return a + (b - a) * rng();
  }

  function pick(rng, list) {
    return list[Math.floor(rng() * list.length)];
  }

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  function polar(cx, cy, r, a) {
    return [cx + r * Math.sin(a), cy - r * Math.cos(a)];
  }

  const DOODLES = {
    clock(rng) {
      let s = '<circle cx="100" cy="100" r="88"/><circle cx="100" cy="100" r="78"/>';
      for (let k = 0; k < 12; k++) {
        const [x1, y1] = polar(100, 100, 62, (k * Math.PI) / 6);
        const [x2, y2] = polar(100, 100, 72, (k * Math.PI) / 6);
        s += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`;
      }
      const [hx, hy] = polar(100, 100, 36, between(rng, 0, 2 * Math.PI));
      const [mx, my] = polar(100, 100, 56, between(rng, 0, 2 * Math.PI));
      s += `<line x1="100" y1="100" x2="${hx.toFixed(1)}" y2="${hy.toFixed(1)}"/>`;
      s += `<line x1="100" y1="100" x2="${mx.toFixed(1)}" y2="${my.toFixed(1)}"/>`;
      return s;
    },
    mug() {
      return (
        '<ellipse cx="84" cy="52" rx="56" ry="11"/>' +
        '<path d="M28 52 L40 170 Q44 182 60 182 L108 182 Q124 182 128 170 L140 52"/>' +
        '<path d="M140 80 Q180 78 180 115 Q180 150 138 150"/>' +
        '<path d="M80 120 C66 108 58 100 62 92 C66 84 76 86 80 94 C84 86 94 84 98 92 C102 100 94 108 80 120 Z"/>'
      );
    },
    globe(rng) {
      const dx = between(rng, -6, 6);
      return (
        '<circle cx="100" cy="88" r="72"/><ellipse cx="100" cy="88" rx="34" ry="72"/>' +
        '<path d="M28 88 L172 88"/>' +
        `<path d="M${(60 + dx).toFixed(0)} 70 Q90 50 112 68 T128 98 Q108 122 86 110 T66 84 Z"/>` +
        '<path d="M120 110 Q138 104 146 120 Q140 134 124 130 Z"/>' +
        '<path d="M96 160 L96 182"/><path d="M62 186 Q96 176 130 186"/>'
      );
    },
    books(rng) {
      let s = '<path d="M8 190 L192 190"/>';
      let x = 16;
      const n = 4 + Math.floor(rng() * 2);
      for (let i = 0; i < n && x < 170; i++) {
        const w = between(rng, 20, 30);
        const h = between(rng, 80, 150);
        s += `<rect x="${x.toFixed(1)}" y="${(190 - h).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}"/>`;
        s += `<path d="M${(x + 5).toFixed(1)} ${(190 - h + 18).toFixed(1)} L${(x + w - 5).toFixed(1)} ${(190 - h + 18).toFixed(1)}"/>`;
        x += w + 2;
      }
      return s;
    },
    plant(rng) {
      const lean = between(rng, -8, 8);
      return (
        '<path d="M60 150 L140 150 L130 190 L70 190 Z"/>' +
        `<path d="M100 150 Q${(96 + lean).toFixed(1)} 110 100 70"/>` +
        '<ellipse cx="78" cy="112" rx="24" ry="10" transform="rotate(-30 78 112)"/>' +
        '<ellipse cx="122" cy="100" rx="24" ry="10" transform="rotate(30 122 100)"/>' +
        '<circle cx="100" cy="52" r="14"/>' +
        '<circle cx="100" cy="28" r="12"/><circle cx="124" cy="46" r="12"/><circle cx="76" cy="46" r="12"/>'
      );
    },
    leaf(rng) {
      const v = between(rng, -10, 10);
      return (
        `<path d="M20 180 Q30 70 180 22 Q170 ${(120 + v).toFixed(0)} 90 120 Q120 128 150 136 Q90 152 52 140 Q34 162 20 180 Z"/>` +
        '<path d="M26 176 Q100 118 176 26"/>' +
        '<path d="M70 150 L92 136"/><path d="M90 118 L110 90"/><path d="M118 96 L140 66"/>'
      );
    },
    coffee() {
      return (
        '<path d="M40 80 L44 150 Q46 176 74 176 L126 176 Q154 176 156 150 L160 80 Z"/>' +
        '<path d="M160 100 Q190 96 190 124 Q190 150 158 148"/>' +
        '<path d="M22 186 L178 186"/>' +
        '<path d="M80 62 Q70 42 84 26"/><path d="M116 62 Q106 42 120 26"/>'
      );
    },
    plane(rng) {
      const t = between(rng, -10, 10);
      return (
        `<path d="M16 ${(100 + t).toFixed(0)} L186 30 L138 172 L96 122 Z"/>` +
        '<path d="M96 122 L186 30"/><path d="M96 122 L112 172 L138 172"/>'
      );
    },
    sparkle() {
      return (
        '<path d="M100 8 Q110 90 192 100 Q110 110 100 192 Q90 110 8 100 Q90 90 100 8 Z"/>' +
        '<circle cx="170" cy="30" r="5"/><circle cx="34" cy="168" r="4"/>'
      );
    },
    heart() {
      return HEART_PATH;
    },
    swirl() {
      return '<path d="M20 150 C60 196 160 180 160 120 C160 70 100 66 92 104 C86 132 122 140 130 116"/>';
    },
    star() {
      const pts = [];
      for (let i = 0; i < 10; i++) {
        const r = i % 2 ? 40 : 92;
        const [x, y] = polar(100, 100, r, (i * Math.PI) / 5);
        pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
      }
      return `<polygon points="${pts.join(" ")}"/>`;
    },
    dots(rng) {
      let s = "";
      for (let i = 0; i < 4; i++) {
        s += `<circle cx="${between(rng, 20, 180).toFixed(0)}" cy="${between(rng, 20, 180).toFixed(0)}" r="${between(rng, 4, 9).toFixed(1)}"/>`;
      }
      return s;
    },
    pencil() {
      return '<path d="M40 160 L146 54 L170 78 L64 184 Z"/><path d="M40 160 L24 190 L56 180"/><path d="M134 66 L158 90"/>';
    }
  };

  function layout(seed) {
    const rng = mulberry32(seed);
    const placements = [];
    const usedNames = new Set();

    for (const z of ZONES) {
      if (rng() > z.p) continue;
      const copies = z.cat === "small" && rng() < 0.35 ? 2 : 1;
      for (let c = 0; c < copies; c++) {
        const pool = z.cat === "big" ? BIG : SMALL;
        const fresh = pool.filter((n) => !usedNames.has(n));
        const name = pick(rng, fresh.length ? fresh : pool);
        usedNames.add(name);
        const base = Math.min(z.w, z.h) / 200;
        const s = z.cat === "big" ? base * between(rng, 1.0, 1.2) : base * between(rng, 0.7, 1.0);
        const half = 100 * s;
        const cx = half * 2 > z.w ? z.x + z.w / 2 : clamp(z.x + z.w * between(rng, 0.3, 0.7), z.x + half, z.x + z.w - half);
        const cy = half * 2 > z.h ? z.y + z.h / 2 : clamp(z.y + z.h * between(rng, 0.3, 0.7), z.y + half, z.y + z.h - half);
        placements.push({
          name,
          s: Number(s.toFixed(2)),
          cx: Math.round(cx),
          cy: Math.round(cy),
          rot: Math.round(between(rng, -16, 16)),
          flip: rng() < 0.3 ? -1 : 1,
          sub: Math.floor(rng() * 1000000)
        });
      }
    }

    return { placements, filterSeed: 1 + Math.floor(rng() * 999) };
  }

  function signature(seed) {
    return JSON.stringify(layout(seed).placements);
  }

  function makeSeeds(count) {
    const seeds = [];
    const used = new Set();
    while (seeds.length < count * 2) {
      const seed = 1 + Math.floor(Math.random() * 2000000000);
      const sig = signature(seed);
      if (used.has(sig)) continue;
      used.add(sig);
      seeds.push(seed);
    }
    return seeds;
  }

  function partsOf(page, doc, settings) {
    const n = doc.puzzles.length;
    const idx = page.items[0].index;
    const isSolution = page.type === "solutions";
    const seed = isSolution ? doc.seeds[n + idx] : doc.seeds[idx];
    const L = layout(seed);
    const ink = settings.colors.numbers;
    const gray = settings.colors.gray || GRAY_DEFAULT;
    const filterId = `deco-${isSolution ? "s" : "p"}-${idx}`;

    let doodles = "";
    for (const p of L.placements) {
      const body = DOODLES[p.name](mulberry32(p.sub));
      doodles +=
        `<g transform="translate(${p.cx} ${p.cy}) rotate(${p.rot}) scale(${p.flip * p.s} ${p.s}) translate(-100 -100)">${body}</g>`;
    }
    const heart = `<g transform="translate(${HEART.x} ${HEART.y}) scale(1.5)">${HEART_PATH}</g>`;
    const bar =
      `<rect x="${BAR.x}" y="${BAR.y}" width="${BAR.w}" height="${BAR.h}" rx="6"/>` +
      `<path d="M465 ${BAR.y + BAR.h} L465 470 M955 ${BAR.y + BAR.h} L955 470"/>`;

    const { x, y, side } = BOARD;
    const N = doc.size;
    const cols = doc.cols;
    const rows = doc.rows;
    const cell = side / N;

    let board = "";
    for (let br = 0; br < N / rows; br++) {
      for (let bc = 0; bc < N / cols; bc++) {
        if ((br + bc) % 2 === 0) {
          board += `<rect x="${x + bc * cols * cell}" y="${y + br * rows * cell}" width="${cols * cell}" height="${rows * cell}" fill="${gray}"/>`;
        }
      }
    }
    for (let i = 1; i < N; i++) {
      const bx = x + i * cell;
      const by = y + i * cell;
      if (i % cols === 0) {
        board += `<rect x="${bx - 8}" y="${y}" width="16" height="${side}" fill="${ink}"/>`;
      } else {
        board += `<rect x="${bx - 1.5}" y="${y}" width="3" height="${side}" fill="${ink}"/>`;
      }
      if (i % rows === 0) {
        board += `<rect x="${x}" y="${by - 8}" width="${side}" height="16" fill="${ink}"/>`;
      } else {
        board += `<rect x="${x}" y="${by - 1.5}" width="${side}" height="3" fill="${ink}"/>`;
      }
    }
    board +=
      `<rect x="${x - 10}" y="${y - 10}" width="${side + 20}" height="20" fill="${ink}"/>` +
      `<rect x="${x - 10}" y="${y + side - 10}" width="${side + 20}" height="20" fill="${ink}"/>` +
      `<rect x="${x - 10}" y="${y - 10}" width="20" height="${side + 20}" fill="${ink}"/>` +
      `<rect x="${x + side - 10}" y="${y - 10}" width="20" height="${side + 20}" fill="${ink}"/>`;

    const data = page.items[0].puzzle;
    const digits = [];
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const index = r * N + c;
        const value = isSolution ? data.solution[index] : data.puzzle[index];
        if (!value) continue;
        digits.push({
          x: x + (c + 0.5) * cell,
          y: y + (r + 0.5) * cell,
          size: cell * 0.8,
          text: doc.symbols[value - 1].label
        });
      }
    }

    const filter =
      `<defs><filter id="${filterId}" x="-3%" y="-3%" width="106%" height="106%">` +
      `<feTurbulence type="fractalNoise" baseFrequency="0.028" numOctaves="2" seed="${L.filterSeed}" result="n"/>` +
      `<feDisplacementMap in="SourceGraphic" in2="n" scale="9" xChannelSelector="R" yChannelSelector="G"/>` +
      `</filter></defs>`;

    const graphics =
      filter +
      `<g filter="url(#${filterId})">` +
      `<g fill="none" stroke="${ink}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">${doodles}${heart}${bar}</g>` +
      `<g>${board}</g>` +
      `</g>`;

    return { graphics, digits };
  }

  function markup(page, doc, settings) {
    const { graphics, digits } = partsOf(page, doc, settings);
    const family = `"${settings.font}", Tahoma, sans-serif`;
    const texts = digits
      .map(
        (d) =>
          `<text x="${d.x}" y="${d.y}" text-anchor="middle" dominant-baseline="central" font-family='${family}' ` +
          `font-size="${d.size}" font-weight="700" fill="${settings.colors.numbers}">${d.text}</text>`
      )
      .join("");
    return (
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%" height="100%" style="display:block">` +
      `<rect width="${W}" height="${H}" fill="#FFFFFF"/>${graphics}${texts}</svg>`
    );
  }

  function loadSvgImage(markupText) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(new Blob([markupText], { type: "image/svg+xml" }));
      const image = new Image();
      image.onload = () => {
        URL.revokeObjectURL(url);
        resolve(image);
      };
      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("تعذر تجهيز رسم الصفحة للتصدير"));
      };
      image.src = url;
    });
  }

  async function renderCanvas(page, doc, settings) {
    const paper = PageRenderer.PAPER_SIZES[settings.paper];
    const width = Math.round(paper.width * PX_PER_MM);
    const height = Math.round(paper.height * PX_PER_MM);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, width, height);

    const { graphics, digits } = partsOf(page, doc, settings);
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${width}" height="${height}">` +
      `<rect width="${W}" height="${H}" fill="#FFFFFF"/>${graphics}</svg>`;
    const image = await loadSvgImage(svg);
    ctx.drawImage(image, 0, 0, width, height);

    const k = width / W;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = settings.colors.numbers;
    for (const d of digits) {
      ctx.font = `700 ${d.size * k}px "${settings.font}", Tahoma, sans-serif`;
      ctx.fillText(d.text, d.x * k, d.y * k);
    }
    return canvas;
  }

  return {
    DEFAULT_FONT,
    makeSeeds,
    markup,
    renderCanvas
  };
})();
