/// <reference types="@webgpu/types" />
import { common, d, std, tgpu } from "typegpu";
import type { TgpuBindGroup } from "typegpu";

/** Cursor trail samples kept alive at once (ring buffer). */
export const MAX_SPLATS = 64;
/** Click ripples kept alive at once (ring buffer). */
export const MAX_RIPPLES = 4;

/** Seconds a trail sample keeps names revealed. */
export const TRAIL_LIFE = 1.6;
const TRAIL_RADIUS = 64;
/** Seconds a click ripple lives, including its fade out. */
export const RIPPLE_LIFE = 3.4;
const RIPPLE_HOLD = 1.4;
const RIPPLE_SPEED = 1400;
const RIPPLE_EDGE = 220;
const HALO_RADIUS = 170;
/** Revealed names stay translucent; only the searched name reaches full ink. */
const REVEAL_CEILING = 0.42;

/**
 * Every field is a vec4f so the uniform has no padding and the CPU can write
 * one packed Float32Array per frame.
 */
const Params = d.struct({
  /** Searched name box in CSS px (x, y, width, height); width 0 = none. */
  highlight: d.vec4f,
  /** rgb ink colour, w = resting opacity of the names. */
  ink: d.vec4f,
  /** Clicks (x, y, start, unused). */
  ripples: d.arrayOf(d.vec4f, MAX_RIPPLES),
  /** Cursor samples (x, y, start, strength). */
  splats: d.arrayOf(d.vec4f, MAX_SPLATS),
  /** x = seconds, y = device pixel ratio, z = highlight start, w = drift. */
  timing: d.vec4f,
});

export const PARAMS_FLOATS = d.sizeOf(Params) / 4;

/** Float offsets of each field inside the packed `Params` array. */
export const OFFSET = {
  highlight: d.memoryLayoutOf(Params, (p) => p.highlight).offset / 4,
  ink: d.memoryLayoutOf(Params, (p) => p.ink).offset / 4,
  ripples: d.memoryLayoutOf(Params, (p) => p.ripples).offset / 4,
  splats: d.memoryLayoutOf(Params, (p) => p.splats).offset / 4,
  timing: d.memoryLayoutOf(Params, (p) => p.timing).offset / 4,
} as const;

const layout = tgpu.bindGroupLayout({
  atlas: { texture: d.texture2d(d.f32) },
  params: { uniform: Params },
});

const hash = (p: d.v2f) => {
  "use gpu";
  return std.fract(std.sin(std.dot(p, d.vec2f(127.1, 311.7))) * 43_758.547);
};

const valueNoise = (p: d.v2f) => {
  "use gpu";
  const cell = std.floor(p);
  const f = std.fract(p);
  const u = std.mul(std.mul(f, f), std.sub(d.vec2f(3), std.mul(f, 2)));
  const a = hash(cell);
  const b = hash(std.add(cell, d.vec2f(1, 0)));
  const c = hash(std.add(cell, d.vec2f(0, 1)));
  const e = hash(std.add(cell, d.vec2f(1, 1)));
  return std.mix(std.mix(a, b, u.x), std.mix(c, e, u.x), u.y);
};

const gaussian = (dist: number, radius: number) => {
  "use gpu";
  return std.exp(-(dist * dist) / (2 * radius * radius));
};

const fieldFragment = tgpu.fragmentFn({
  in: { position: d.builtin.position },
  out: d.vec4f,
})((input) => {
  "use gpu";
  // 'use gpu' code cannot destructure, so the linter's autofix would break it.
  // oxlint-disable-next-line prefer-destructuring
  const params = layout.$.params;
  const time = params.timing.x;
  const p = std.div(input.position.xy, params.timing.y);
  const mask = std.textureLoad(layout.$.atlas, d.vec2i(input.position.xy), 0).w;

  // Resting state: barely-there names with slow drifting patches of density.
  const drift = time * params.timing.w;
  const n = valueNoise(
    std.add(std.mul(p, 0.006), d.vec2f(drift * 0.05, drift * 0.03))
  );
  let reveal = params.ink.w * (0.25 + 1.2 * std.smoothstep(0.55, 0.95, n));

  // Cursor trail.
  for (let i = d.u32(0); i < MAX_SPLATS; i += 1) {
    const splat = params.splats[i];
    const age = time - splat.z;
    if (age >= 0 && age < TRAIL_LIFE) {
      const fade = 1 - std.smoothstep(0, TRAIL_LIFE, age);
      const dist = std.length(std.sub(p, splat.xy));
      reveal += splat.w * fade * gaussian(dist, TRAIL_RADIUS);
    }
  }

  // Click ripples: an expanding disc that reveals everything it covers.
  for (let i = d.u32(0); i < MAX_RIPPLES; i += 1) {
    const ripple = params.ripples[i];
    const age = time - ripple.z;
    if (age >= 0 && age < RIPPLE_LIFE) {
      const dist = std.length(std.sub(p, ripple.xy));
      const front = age * RIPPLE_SPEED;
      const inside = 1 - std.smoothstep(front - RIPPLE_EDGE, front, dist);
      const wave = (front - dist) / 48;
      const ring =
        std.exp(-(wave * wave)) * (1 - std.smoothstep(0, RIPPLE_HOLD, age));
      const fade = 1 - std.smoothstep(RIPPLE_HOLD, RIPPLE_LIFE, age);
      reveal += (inside * 0.7 + ring * 0.4) * fade;
    }
  }

  // Searched name: a halo that reveals its neighbours, then settles.
  const box = params.highlight;
  let alpha = mask * std.min(reveal, REVEAL_CEILING);
  if (box.z > 0) {
    const center = std.add(box.xy, std.mul(box.zw, 0.5));
    const age = time - params.timing.z;
    const halo =
      gaussian(std.length(std.sub(p, center)), HALO_RADIUS) *
      (1 - std.smoothstep(1.5, 5, age));
    alpha = mask * std.min(reveal + halo * 0.8, REVEAL_CEILING);
    const inside =
      std.all(std.ge(p, box.xy)) && std.all(std.le(p, std.add(box.xy, box.zw)));
    if (inside) {
      alpha = mask;
    }
  }

  return d.vec4f(std.mul(params.ink.xyz, alpha), alpha);
});

export interface FieldGpu {
  /** Upload a new name atlas; its size must match the canvas backing store. */
  setAtlas: (atlas: HTMLCanvasElement) => void;
  /** Packed `Params` uniform, laid out per `OFFSET`. */
  render: (params: Float32Array<ArrayBuffer>) => void;
  destroy: () => void;
}

/**
 * Draws the contributor field on `canvas` with WebGPU. Rejects when WebGPU is
 * unavailable so the caller can fall back to a static 2D field.
 */
export const createFieldGpu = async (
  canvas: HTMLCanvasElement
): Promise<FieldGpu> => {
  const root = await tgpu.init();
  const context = root.configureContext({ alphaMode: "premultiplied", canvas });
  const paramsUniform = root.createUniform(Params);
  const pipeline = root.createRenderPipeline({
    fragment: fieldFragment,
    vertex: common.fullScreenTriangle,
  });

  let atlasTexture: { destroy: () => void } | null = null;
  let bindGroup: TgpuBindGroup<typeof layout.entries> | null = null;

  return {
    destroy: () => {
      atlasTexture?.destroy();
      root.destroy();
    },
    render: (params) => {
      if (!bindGroup) {
        return;
      }
      paramsUniform.buffer.write(params.buffer);
      pipeline.with(bindGroup).withColorAttachment({ view: context }).draw(3);
    },
    setAtlas: (atlas) => {
      const texture = root
        .createTexture({
          format: "rgba8unorm",
          size: [atlas.width, atlas.height],
        })
        .$usage("sampled", "render");
      texture.write(atlas);
      bindGroup = root.createBindGroup(layout, {
        atlas: texture,
        params: paramsUniform,
      });
      // The previous texture may still be referenced by a submitted frame;
      // WebGPU defers the actual free until that work completes.
      atlasTexture?.destroy();
      atlasTexture = texture;
    },
  };
};
