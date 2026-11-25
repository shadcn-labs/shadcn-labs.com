export interface NameBox {
  height: number;
  login: string;
  width: number;
  x: number;
  y: number;
}

export interface FieldLayout {
  /** White names on transparent, sized to the canvas backing store. */
  atlas: HTMLCanvasElement;
  /** Every drawn name in CSS px, in drawing order. */
  boxes: NameBox[];
}

const FONT_SIZE = 8;
const LINE_HEIGHT = 10;
const GAP = 4;

/**
 * Park–Miller minimal standard PRNG: deterministic, so a given size always
 * produces the same field.
 */
const parkMiller = (seed: number) => {
  let state = seed;
  return () => {
    state = (state * 16_807) % 2_147_483_647;
    return (state - 1) / 2_147_483_646;
  };
};

const shuffled = (items: readonly string[], random: () => number) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

/**
 * Packs logins into rows that fill `width` x `height` CSS px. Short lists
 * repeat in a fresh shuffled order each pass, so every pixel row is covered.
 */
export const layoutField = (
  logins: readonly string[],
  width: number,
  height: number,
  dpr: number,
  fontFamily: string
): FieldLayout => {
  const atlas = document.createElement("canvas");
  atlas.width = Math.max(1, Math.round(width * dpr));
  atlas.height = Math.max(1, Math.round(height * dpr));

  const ctx = atlas.getContext("2d");
  const boxes: NameBox[] = [];

  if (!ctx || logins.length === 0) {
    return { atlas, boxes };
  }

  ctx.scale(dpr, dpr);
  ctx.font = `500 ${FONT_SIZE}px ${fontFamily}`;
  ctx.fillStyle = "#fff";
  ctx.textBaseline = "middle";

  const widths = new Map(
    logins.map((login) => [login, ctx.measureText(login).width])
  );
  const random = parkMiller(0x40_40);
  let queue: string[] = [];

  for (let y = 0; y < height; y += LINE_HEIGHT) {
    // Stagger rows so repeated names never line up in columns.
    let x = -random() * 60;

    while (x < width) {
      if (queue.length === 0) {
        queue = shuffled(logins, random);
      }

      const login = queue.pop() as string;
      const textWidth = widths.get(login) ?? 0;

      ctx.fillText(login, x, y + LINE_HEIGHT / 2);
      boxes.push({ height: LINE_HEIGHT, login, width: textWidth, x, y });
      x += textWidth + GAP;
    }
  }

  return { atlas, boxes };
};

/**
 * The drawn copy of `login` nearest a point left of centre, so a highlighted
 * name stays clear of the centred page copy.
 */
export const findNameBox = (
  boxes: readonly NameBox[],
  login: string,
  width: number,
  height: number
): NameBox | null => {
  const targetX = width * 0.2;
  const targetY = height * 0.5;
  let best: NameBox | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const box of boxes) {
    if (box.login !== login || box.x < 0 || box.x + box.width > width) {
      continue;
    }

    const distance = Math.hypot(
      box.x + box.width / 2 - targetX,
      box.y + box.height / 2 - targetY
    );

    if (distance < bestDistance) {
      best = box;
      bestDistance = distance;
    }
  }

  return best;
};
