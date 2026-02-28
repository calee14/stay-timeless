/**
 * Y2K Digital Camera Effect — React Native Skia
 *
 * Transforms modern photos to look like they were taken with early 2000s
 * digital cameras (2-4MP, JPEG artifacts, oversaturated, cool cast, bloom, etc.)
 *
 * Requires: @shopify/react-native-skia
 */

import {
  Skia,
  TileMode,
  AlphaType,
  ColorType,
  BlendMode,
  type SkImage,
  type SkSurface,
  type SkCanvas,
  type SkPaint,
} from "@shopify/react-native-skia";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Y2KOptions {
  /** Effect intensity from 0.0 to 1.0 (default 1.0) */
  intensity?: number;
  /** Add orange date stamp in corner */
  addDateStamp?: boolean;
  /** Custom date text (defaults to random 2000s date) */
  dateStampText?: string;
  /** Output JPEG quality 0-100 (default 85) */
  outputQuality?: number;
}

interface BloomOptions {
  intensity: number;
  highlightThreshold: number;
  bloomStrength: number;
  bloomRadius: number;
  shadowCrushStrength: number;
  shadowCrushRadius: number;
}

// ─── Pixel buffer helpers ────────────────────────────────────────────────────

/**
 * Reads the raw RGBA pixel bytes from an SkImage into a Float32Array
 * with shape [height][width][4] laid out as a flat buffer.
 */
function imageToPixels(image: SkImage): {
  data: Float32Array;
  width: number;
  height: number;
} {
  const width = image.width();
  const height = image.height();
  const bytesPerRow = width * 4;

  const rawBytes = image.readPixels(0, 0, {
    width,
    height,
    colorType: ColorType.RGBA_8888,
    alphaType: AlphaType.Unpremul,
  });

  if (!rawBytes) {
    throw new Error("Failed to read pixels from SkImage");
  }

  const uint8 = new Uint8Array(rawBytes);
  const data = new Float32Array(uint8.length);
  for (let i = 0; i < uint8.length; i++) {
    data[i] = uint8[i];
  }

  return { data, width, height };
}

/**
 * Converts a Float32Array of RGBA pixel data back to an SkImage.
 */
function pixelsToImage(
  data: Float32Array,
  width: number,
  height: number
): SkImage {
  const uint8 = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    uint8[i] = Math.max(0, Math.min(255, Math.round(data[i])));
  }

  const skData = Skia.Data.fromBytes(uint8);
  const image = Skia.Image.MakeImage(
    {
      width,
      height,
      colorType: ColorType.RGBA_8888,
      alphaType: AlphaType.Unpremul,
    },
    skData,
    width * 4
  );

  if (!image) {
    throw new Error("Failed to create SkImage from pixel data");
  }

  return image;
}

// ─── Inline pixel-level helpers ──────────────────────────────────────────────

/** Index into flat RGBA buffer */
function idx(x: number, y: number, w: number, c: number): number {
  return (y * w + x) * 4 + c;
}

/** Compute luminance for a pixel */
function luminance(
  data: Float32Array,
  x: number,
  y: number,
  w: number
): number {
  const base = (y * w + x) * 4;
  return 0.299 * data[base] + 0.587 * data[base + 1] + 0.114 * data[base + 2];
}

/** Clamp value between min and max */
function clamp(val: number, min: number, max: number): number {
  return val < min ? min : val > max ? max : val;
}

// ─── Skia surface helpers ────────────────────────────────────────────────────

function makeSurface(width: number, height: number): SkSurface {
  const surface = Skia.Surface.Make(width, height);
  if (!surface) {
    throw new Error(`Failed to create Skia surface (${width}x${height})`);
  }
  return surface;
}

function drawImageToSurface(
  image: SkImage,
  width: number,
  height: number,
  paint?: SkPaint
): SkImage {
  const surface = makeSurface(width, height);
  const canvas = surface.getCanvas();
  canvas.drawImageRect(
    image,
    Skia.XYWHRect(0, 0, image.width(), image.height()),
    Skia.XYWHRect(0, 0, width, height),
    paint ?? Skia.Paint()
  );
  surface.flush();
  return surface.makeImageSnapshot();
}

/**
 * Apply a Skia Gaussian blur to an SkImage and return the result.
 * sigma corresponds roughly to PIL radius * 0.425.
 */
function applyGaussianBlur(image: SkImage, sigma: number): SkImage {
  if (sigma <= 0) return image;
  const w = image.width();
  const h = image.height();
  const surface = makeSurface(w, h);
  const canvas = surface.getCanvas();
  const paint = Skia.Paint();
  paint.setImageFilter(
    Skia.ImageFilter.MakeBlur(sigma, sigma, TileMode.Clamp, null)
  );
  canvas.drawImage(image, 0, 0, paint);
  surface.flush();
  return surface.makeImageSnapshot();
}

// ─── Random helpers ──────────────────────────────────────────────────────────

/** Simple normally-distributed random using Box-Muller */
function randomNormal(): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

// ─── PIL radius → Skia sigma conversion ─────────────────────────────────────

function pilRadiusToSigma(radius: number): number {
  return radius * 0.425;
}

// ═════════════════════════════════════════════════════════════════════════════
//  EFFECT FUNCTIONS — each mirrors a Python function from the original script
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Step 1: Reduce to ~2MP (simulating 2-3 megapixel camera).
 * Returns the resized SkImage.
 */
function reduceResolution(image: SkImage, intensity: number): SkImage {
  const w = image.width();
  const h = image.height();
  const targetPixels = 2_000_000;
  const currentPixels = w * h;

  if (currentPixels <= targetPixels) return image;

  const scale = Math.sqrt(targetPixels / currentPixels);
  const blended = 1 - (1 - scale) * intensity;
  const newW = Math.round(w * blended);
  const newH = Math.round(h * blended);

  return drawImageToSurface(image, newW, newH);
}

/**
 * Step 2: Cool blue/cyan color cast (Sony / Fuji style).
 */
function applyCoolCast(
  data: Float32Array,
  w: number,
  h: number,
  intensity: number
): void {
  const rMul = 1.0 - 0.06 * intensity;
  const gMul = 1.0 + 0.02 * intensity;
  const bMul = 1.0 + 0.08 * intensity;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const base = (y * w + x) * 4;
      data[base] = clamp(data[base] * rMul, 0, 255);
      data[base + 1] = clamp(data[base + 1] * gMul, 0, 255);
      data[base + 2] = clamp(data[base + 2] * bMul, 0, 255);
    }
  }
}

/**
 * Step 3a: Adjust overall saturation using the luminance-desaturation method.
 * factor > 1 increases saturation, < 1 decreases, 0 = grayscale.
 */
function adjustSaturation(
  data: Float32Array,
  w: number,
  h: number,
  factor: number
): void {
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const base = (y * w + x) * 4;
      const r = data[base];
      const g = data[base + 1];
      const b = data[base + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      data[base] = clamp(lum + (r - lum) * factor, 0, 255);
      data[base + 1] = clamp(lum + (g - lum) * factor, 0, 255);
      data[base + 2] = clamp(lum + (b - lum) * factor, 0, 255);
    }
  }
}

/**
 * Step 3b: Vibrance — enhances less-saturated colours more.
 * Operates on HSV-style saturation per pixel.
 */
function adjustVibrance(
  data: Float32Array,
  w: number,
  h: number,
  vibranceFactor: number
): void {
  if (vibranceFactor === 1.0) return;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const base = (y * w + x) * 4;
      const r = data[base] / 255;
      const g = data[base + 1] / 255;
      const b = data[base + 2] / 255;

      const maxC = Math.max(r, g, b);
      const minC = Math.min(r, g, b);
      const sat = maxC === 0 ? 0 : (maxC - minC) / maxC;

      // Vibrance curve — affects less-saturated pixels more
      const curve = Math.pow(1.0 - sat, 1.5);
      const adjustment = (vibranceFactor - 1.0) * curve;

      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      const newFactor = 1.0 + adjustment;
      data[base] = clamp((lum + (r - lum) * newFactor) * 255, 0, 255);
      data[base + 1] = clamp((lum + (g - lum) * newFactor) * 255, 0, 255);
      data[base + 2] = clamp((lum + (b - lum) * newFactor) * 255, 0, 255);
    }
  }
}

/**
 * Step 4: Reduce dynamic range — crush shadows, clip highlights.
 */
function reduceDynamicRange(
  data: Float32Array,
  w: number,
  h: number,
  intensity: number
): void {
  const blackLift = 8 * intensity;
  const highlightCompress = 0.95 - 0.05 * intensity;
  const contrastReduction = 0.9 + 0.1 * (1 - intensity);
  const mid = 128;

  for (let i = 0; i < w * h * 4; i++) {
    if (i % 4 === 3) continue; // skip alpha
    let v = data[i];
    v = v + blackLift;
    v = v * highlightCompress;
    v = (v - mid) * contrastReduction + mid;
    data[i] = clamp(v, 0, 255);
  }
}

/**
 * Step 4b: Reduce local contrast.
 * Blurs the luminance and blends each pixel toward the local mean.
 */
function reduceLocalContrast(
  image: SkImage,
  amount: number,
  windowSize: number = 5
): SkImage {
  const { data, width, height } = imageToPixels(image);

  // Compute luminance channel
  const lumData = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      lumData[y * width + x] = luminance(data, x, y, width);
    }
  }

  // Create a grayscale SkImage from luminance, blur it, read back
  const lumRGBA = new Float32Array(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const v = lumData[i];
    lumRGBA[i * 4] = v;
    lumRGBA[i * 4 + 1] = v;
    lumRGBA[i * 4 + 2] = v;
    lumRGBA[i * 4 + 3] = 255;
  }
  const lumImage = pixelsToImage(lumRGBA, width, height);
  const blurredLumImage = applyGaussianBlur(
    lumImage,
    pilRadiusToSigma(Math.floor(windowSize / 2))
  );
  const blurredPixels = imageToPixels(blurredLumImage);

  // blurredPixels.data R channel ≈ local mean luminance
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const lum = lumData[y * width + x];
      const localMean = blurredPixels.data[(y * width + x) * 4]; // R channel
      const lumReduced = localMean + (lum - localMean) * (1 - amount);
      const ratio = lum !== 0 ? clamp(lumReduced / lum, 0, 2) : 1;

      const base = (y * width + x) * 4;
      data[base] = clamp(data[base] * ratio, 0, 255);
      data[base + 1] = clamp(data[base + 1] * ratio, 0, 255);
      data[base + 2] = clamp(data[base + 2] * ratio, 0, 255);
    }
  }

  return pixelsToImage(data, width, height);
}

/**
 * Step 5: Bloom / glow effect — bright areas bleed, shadows get crushed.
 *
 * This is the most complex effect. It uses Skia blur for the heavy lifting
 * and pixel math for the compositing.
 */
function applyBloomEffect(image: SkImage, opts: BloomOptions): SkImage {
  const { data, width, height } = imageToPixels(image);
  const intensity = opts.intensity;

  // ── Compute luminance & highlight mask ──
  const lumArray = new Float32Array(width * height);
  const highlightMask = new Float32Array(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const lum = luminance(data, x, y, width);
      lumArray[i] = lum;
      let hm =
        (lum - opts.highlightThreshold) / (255 - opts.highlightThreshold);
      hm = clamp(hm, 0, 1);
      hm = Math.pow(hm, 0.7);
      highlightMask[i] = hm;
    }
  }

  // ── Create bloom layer (image * highlightMask) ──
  const bloomPixels = new Float32Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const base = i * 4;
      const hm = highlightMask[i];
      bloomPixels[base] = data[base] * hm;
      bloomPixels[base + 1] = data[base + 1] * hm;
      bloomPixels[base + 2] = data[base + 2] * hm;
      bloomPixels[base + 3] = 255;
    }
  }
  const bloomImage = pixelsToImage(bloomPixels, width, height);

  // ── Blur bloom at three radii ──
  const baseBloomRadius = Math.max(15, Math.floor(40 * intensity));
  const r1 = pilRadiusToSigma(baseBloomRadius * opts.bloomRadius);
  const r2 = pilRadiusToSigma(baseBloomRadius * opts.bloomRadius * 2.5);
  const r3 = pilRadiusToSigma(baseBloomRadius * opts.bloomRadius * 4);

  const bloom1 = imageToPixels(applyGaussianBlur(bloomImage, r1));
  const bloom2 = imageToPixels(applyGaussianBlur(bloomImage, r2));
  const bloom3 = imageToPixels(applyGaussianBlur(bloomImage, r3));

  // Combine: 0.4 * b1 + 0.35 * b2 + 0.25 * b3
  const combinedBloom = new Float32Array(width * height * 4);
  for (let i = 0; i < combinedBloom.length; i++) {
    combinedBloom[i] =
      bloom1.data[i] * 0.4 + bloom2.data[i] * 0.35 + bloom3.data[i] * 0.25;
  }

  // ── Shadow crush influence map ──
  const baseCrushRadius = Math.max(10, Math.floor(30 * intensity));
  const cr1 = pilRadiusToSigma(baseCrushRadius * opts.shadowCrushRadius);
  const cr2 = pilRadiusToSigma(baseCrushRadius * opts.shadowCrushRadius * 2);

  // Build highlight mask image, blur it for crush influence
  const hmRGBA = new Float32Array(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const v = highlightMask[i] * 255;
    hmRGBA[i * 4] = v;
    hmRGBA[i * 4 + 1] = v;
    hmRGBA[i * 4 + 2] = v;
    hmRGBA[i * 4 + 3] = 255;
  }
  const hmImage = pixelsToImage(hmRGBA, width, height);

  const crush1Pixels = imageToPixels(applyGaussianBlur(hmImage, cr1));
  const crush2Pixels = imageToPixels(applyGaussianBlur(hmImage, cr2));

  const crushInfluence = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const c1 = crush1Pixels.data[i * 4] / 255;
    const c2 = crush2Pixels.data[i * 4] / 255;
    crushInfluence[i] = c1 * 0.6 + c2 * 0.4;
  }

  // ── Apply shadow crushing ──
  let highlightSum = 0;
  for (let i = 0; i < width * height; i++) highlightSum += highlightMask[i];
  const highlightAmount = highlightSum / (width * height);

  const shadowCrushFactor =
    1.0 +
    0.15 *
    intensity *
    opts.shadowCrushStrength *
    (1 + highlightAmount * 2);

  const adjusted = new Float32Array(data.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pi = y * width + x;
      const base = pi * 4;
      const lum = lumArray[pi];

      let shadowMask = clamp(1 - lum / 128, 0, 1);
      shadowMask = Math.pow(shadowMask, 1.5);

      const crushAmount =
        shadowMask *
        crushInfluence[pi] *
        0.3 *
        intensity *
        opts.shadowCrushStrength *
        shadowCrushFactor;
      const shadowAdj = 1 - crushAmount;

      adjusted[base] = data[base] * shadowAdj;
      adjusted[base + 1] = data[base + 1] * shadowAdj;
      adjusted[base + 2] = data[base + 2] * shadowAdj;
      adjusted[base + 3] = 255;

      // Lift darkest blacks
      const blackLift = 5 * intensity * (2 - opts.shadowCrushStrength);
      adjusted[base] = Math.max(adjusted[base], blackLift);
      adjusted[base + 1] = Math.max(adjusted[base + 1], blackLift);
      adjusted[base + 2] = Math.max(adjusted[base + 2], blackLift);
    }
  }

  // ── Apply bloom (screen blend + additive) ──
  const screenAmount = 0.5 * intensity * opts.bloomStrength;
  const additiveAmount = 0.25 * intensity * opts.bloomStrength;

  const result = new Float32Array(data.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const base = (y * width + x) * 4;

      for (let c = 0; c < 3; c++) {
        const orig = adjusted[base + c] / 255;
        const bloom = combinedBloom[base + c] / 255;
        // Screen blend
        const screened = 1 - (1 - orig) * (1 - bloom * screenAmount);
        // Additive
        result[base + c] = screened * 255 + combinedBloom[base + c] * additiveAmount;
      }

      // Colour shift in bloomed areas
      const bloomLum =
        (combinedBloom[base] +
          combinedBloom[base + 1] +
          combinedBloom[base + 2]) /
        765;
      const bmask = clamp(bloomLum, 0, 1);
      result[base] += bmask * 8 * intensity * opts.bloomStrength;
      result[base + 2] += bmask * 4 * intensity * opts.bloomStrength;

      result[base] = clamp(result[base], 0, 255);
      result[base + 1] = clamp(result[base + 1], 0, 255);
      result[base + 2] = clamp(result[base + 2], 0, 255);
      result[base + 3] = 255;
    }
  }

  return pixelsToImage(result, width, height);
}

/**
 * Step 5b: Chromatic aberration — shift R and B channels in opposite directions.
 */
function addChromaticAberration(
  data: Float32Array,
  w: number,
  h: number,
  intensity: number
): void {
  const shift = Math.floor(2 * intensity);
  if (shift < 1) return;

  // Copy original
  const orig = new Float32Array(data);

  const blendOrig = 1 - 0.5 * intensity;
  const blendShift = 0.5 * intensity;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const base = (y * w + x) * 4;

      // Red shifted right/down
      const srcRY = y - shift;
      const srcRX = x - shift;
      if (srcRY >= 0 && srcRX >= 0) {
        const srcBase = (srcRY * w + srcRX) * 4;
        data[base] = clamp(orig[base] * blendOrig + orig[srcBase] * blendShift, 0, 255);
      }

      // Blue shifted left/up
      const srcBY = y + shift;
      const srcBX = x + shift;
      if (srcBY < h && srcBX < w) {
        const srcBase = (srcBY * w + srcBX) * 4;
        data[base + 2] = clamp(
          orig[base + 2] * blendOrig + orig[srcBase + 2] * blendShift,
          0,
          255
        );
      }
    }
  }
}

/**
 * Step 6: Aggressive unsharp-mask sharpening with halos.
 */
function applyOversharpening(image: SkImage, intensity: number): SkImage {
  const sigma = pilRadiusToSigma(1.5);
  const blurred = applyGaussianBlur(image, sigma);

  const origPx = imageToPixels(image);
  const blurPx = imageToPixels(blurred);
  const sharpeningAmount = 1.5 * intensity;

  for (let i = 0; i < origPx.data.length; i++) {
    if (i % 4 === 3) continue; // alpha
    origPx.data[i] = clamp(
      origPx.data[i] + (origPx.data[i] - blurPx.data[i]) * sharpeningAmount,
      0,
      255
    );
  }

  return pixelsToImage(origPx.data, origPx.width, origPx.height);
}

/**
 * Step 7: Digital sensor noise, heavier in shadows.
 */
function addDigitalNoise(
  data: Float32Array,
  w: number,
  h: number,
  intensity: number
): void {
  const noiseStrength = 12 * intensity;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const base = (y * w + x) * 4;
      const lum = luminance(data, x, y, w);
      const shadowMask = 1 - lum / 255;

      for (let c = 0; c < 3; c++) {
        const noise = randomNormal() * noiseStrength;
        const weighted = noise * (0.5 + shadowMask * 0.5);
        data[base + c] = clamp(data[base + c] + weighted, 0, 255);
      }
    }
  }
}

/**
 * Step 8: JPEG compression artifacts via Skia re-encode.
 */
function applyJpegArtifacts(image: SkImage, intensity: number): SkImage {
  const quality = Math.round(70 - 30 * intensity); // 70→40

  const encoded = image.encodeToBytes(
    // @ts-expect-error — ImageFormat enum may differ across skia versions
    Skia.ImageFormat?.JPEG ?? 3,
    quality
  );

  if (!encoded) {
    console.warn("JPEG re-encode failed, skipping artifacts");
    return image;
  }

  const decoded = Skia.Image.MakeImageFromEncoded(Skia.Data.fromBytes(encoded));
  return decoded ?? image;
}

/**
 * Step 9: Barrel distortion (cheap lens simulation).
 */
function applyBarrelDistortion(
  data: Float32Array,
  w: number,
  h: number,
  intensity: number
): Float32Array {
  const k = 0.1 * intensity;
  const cx = w / 2;
  const cy = h / 2;
  const result = new Float32Array(data.length);

  // Fill alpha
  for (let i = 3; i < result.length; i += 4) {
    result[i] = 255;
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const xNorm = (x - cx) / cx;
      const yNorm = (y - cy) / cy;
      const r = Math.sqrt(xNorm * xNorm + yNorm * yNorm);

      const rDistorted = r * (1 + k * r * r);
      const scale = r === 0 ? 1 : rDistorted / r;

      const srcX = clamp(Math.round(xNorm * scale * cx + cx), 0, w - 1);
      const srcY = clamp(Math.round(yNorm * scale * cy + cy), 0, h - 1);

      const dstBase = (y * w + x) * 4;
      const srcBase = (srcY * w + srcX) * 4;
      result[dstBase] = data[srcBase];
      result[dstBase + 1] = data[srcBase + 1];
      result[dstBase + 2] = data[srcBase + 2];
    }
  }

  return result;
}

/**
 * Step 10: Orange date stamp (classic digicam feature).
 */
function addDateStamp(image: SkImage, customText?: string): SkImage {
  const w = image.width();
  const h = image.height();
  const surface = makeSurface(w, h);
  const canvas = surface.getCanvas();

  // Draw original
  canvas.drawImage(image, 0, 0);

  // Generate random 2000s date if not provided
  const text =
    customText ??
    (() => {
      const year = 2001 + Math.floor(Math.random() * 6);
      const month = 1 + Math.floor(Math.random() * 12);
      const day = 1 + Math.floor(Math.random() * 28);
      return `${String(month).padStart(2, "0")}/${String(day).padStart(2, "0")}/${year}`;
    })();

  const fontSize = Math.max(16, Math.floor(w / 30));
  const font = Skia.Font(undefined, fontSize); // system default monospace

  const textWidth = font.measureText(text).width;
  const padding = 20;
  const x = w - textWidth - padding;
  const y = h - padding;

  // Shadow
  const shadowPaint = Skia.Paint();
  shadowPaint.setColor(Skia.Color("rgba(100, 50, 0, 1)"));
  canvas.drawText(text, x + 1, y + 1, shadowPaint, font);

  // Orange foreground
  const datePaint = Skia.Paint();
  datePaint.setColor(Skia.Color("rgba(255, 140, 0, 1)"));
  canvas.drawText(text, x, y, datePaint, font);

  surface.flush();
  return surface.makeImageSnapshot();
}

// ═════════════════════════════════════════════════════════════════════════════
//  MAIN PIPELINE
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Apply the full Y2K digital camera effect to a Skia image.
 *
 * @param sourceImage - SkImage to process
 * @param options     - Y2K effect options
 * @returns           - Processed SkImage
 */
export function applyY2KCameraEffect(
  sourceImage: SkImage,
  options: Y2KOptions = {}
): SkImage {
  const {
    intensity = 1.0,
    addDateStamp: addStamp = true,
    dateStampText,
    outputQuality = 85,
  } = options;

  const originalW = sourceImage.width();
  const originalH = sourceImage.height();

  // Step 1: Reduce resolution
  let image = reduceResolution(sourceImage, intensity * 0.02);

  // Step 2: Cool cast (pixel-level)
  let px = imageToPixels(image);
  applyCoolCast(px.data, px.width, px.height, intensity);

  // Step 3: Saturation + Vibrance
  adjustSaturation(px.data, px.width, px.height, intensity * 1.3);
  adjustVibrance(px.data, px.width, px.height, intensity * 1.3);

  // Step 4: Dynamic range
  reduceDynamicRange(px.data, px.width, px.height, intensity);
  image = pixelsToImage(px.data, px.width, px.height);

  // Step 4b: Reduce local contrast
  image = reduceLocalContrast(image, intensity * 1.0);

  // Step 5: Bloom
  image = applyBloomEffect(image, {
    intensity: 0.8,
    highlightThreshold: 150,
    bloomStrength: intensity * 0.8,
    bloomRadius: intensity * 0.01,
    shadowCrushStrength: intensity * 0.5,
    shadowCrushRadius: intensity * 0.001,
  });

  // Step 5b: Chromatic aberration
  px = imageToPixels(image);
  addChromaticAberration(px.data, px.width, px.height, intensity);
  image = pixelsToImage(px.data, px.width, px.height);

  // Step 6: Oversharpening
  image = applyOversharpening(image, intensity * 1.3);

  // Step 7: Digital noise
  px = imageToPixels(image);
  addDigitalNoise(px.data, px.width, px.height, intensity);

  // Step 9: Barrel distortion
  px.data = applyBarrelDistortion(px.data, px.width, px.height, intensity);
  image = pixelsToImage(px.data, px.width, px.height);

  // Step 8: JPEG artifacts
  image = applyJpegArtifacts(image, intensity);

  // Step 10: Resize back to original
  image = drawImageToSurface(image, originalW, originalH);

  // Step 11: Date stamp
  if (addStamp) {
    image = addDateStamp(image, dateStampText);
  }

  return image;
}
