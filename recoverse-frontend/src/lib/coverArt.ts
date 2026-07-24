/**
 * 호마다 고유한 "표지 아트"를 결정적으로 생성한다 (Phase 1엔 실제 사진이 없으므로).
 * 리소그래프 프린트 결 — 겹쳐 찍힌 큰 도형·오버프린트·살짝 어긋난 등록·종이 그레인.
 * seed(호의 id 등)가 같으면 늘 같은 그림이라, 렌더마다 흔들리지 않는다.
 *
 * 표지는 "인쇄물"이라 자체 색 세계를 가진다 — 앱 라이트/다크 테마에 흔들리지 않도록
 * 바탕(GROUND)과 잉크(INK)를 고정한다. 종류색만 호마다 바뀐다.
 */

type RGB = readonly [number, number, number];

const GROUND: RGB = [244, 239, 228];
const INK: RGB = [34, 28, 22];

function makeRng(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i += 1) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

function hexToRgb(hex: string): RGB {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mix(a: RGB, b: RGB, t: number): RGB {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

function rgb(c: RGB, alpha = 1): string {
  return `rgba(${c[0]},${c[1]},${c[2]},${alpha})`;
}

function grain(ctx: CanvasRenderingContext2D, w: number, h: number, rng: () => number, amount: number): void {
  const iw = Math.max(1, Math.floor(w));
  const ih = Math.max(1, Math.floor(h));
  const image = ctx.getImageData(0, 0, iw, ih);
  const data = image.data;
  for (let i = 0; i < data.length; i += 4) {
    const n = (rng() * 2 - 1) * amount;
    data[i] += n;
    data[i + 1] += n;
    data[i + 2] += n;
  }
  ctx.putImageData(image, 0, 0);
}

/** 리소 프린트풍 표지를 ctx(논리 크기 w×h)에 그린다. */
export function drawRisoCover(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  seed: string,
  kindHex: string,
): void {
  const rng = makeRng(`riso:${seed}`);
  const kc = hexToRgb(kindHex);

  ctx.fillStyle = rgb(mix(GROUND, kc, 0.1));
  ctx.fillRect(0, 0, w, h);

  ctx.globalCompositeOperation = 'multiply';
  const shapes = 3 + Math.floor(rng() * 2);
  for (let s = 0; s < shapes; s += 1) {
    const color = s === 0 ? mix(kc, INK, 0.12) : rng() < 0.35 ? INK : kc;
    ctx.globalAlpha = 0.62 + rng() * 0.3;
    const off = (rng() * 2 - 1) * 6; // 살짝 어긋난 등록(misregistration)
    ctx.save();
    ctx.translate(off, -off);
    ctx.fillStyle = rgb(color);
    const type = rng();
    const cx = rng() * w;
    const cy = rng() * h;
    const r = (0.34 + rng() * 0.5) * w;
    ctx.beginPath();
    if (type < 0.45) {
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    } else if (type < 0.72) {
      ctx.arc(cx, cy, r, rng() * Math.PI, rng() * Math.PI + Math.PI * (0.7 + rng() * 0.8));
      ctx.lineTo(cx, cy);
      ctx.fill();
    } else {
      const bw = (0.5 + rng()) * w;
      const angle = (rng() * 2 - 1) * 0.9;
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      ctx.fillRect(-bw / 2, -r * 0.28, bw, r * 0.56);
    }
    ctx.restore();
  }

  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  grain(ctx, w, h, rng, 14);
}
