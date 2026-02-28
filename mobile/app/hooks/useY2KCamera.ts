/**
 * useY2KCamera — React hook for applying the Y2K digital camera effect.
 *
 * Usage:
 *
 *   const { processImage, result, processing, error, progress } = useY2KCamera();
 *
 *   // From a file path (e.g. after image picker)
 *   await processImage({ uri: 'file:///path/to/photo.jpg', intensity: 0.8 });
 *
 *   // From an existing SkImage
 *   await processImage({ skImage: mySkImage });
 *
 *   // Render the result
 *   if (result) {
 *     return <SkiaImage image={result} width={300} height={400} />;
 *   }
 */

import { useCallback, useRef, useState } from "react";
import { Skia, type SkImage } from "@shopify/react-native-skia";
import { applyY2KCameraEffect, type Y2KOptions } from "../utils/y2kEffects";
// ─── Types ───────────────────────────────────────────────────────────────────

export interface ProcessImageInput extends Y2KOptions {
  /** File URI (file://, content://, ph://, etc.) */
  uri?: string;
  /** Raw image bytes (e.g. from fetch or camera capture) */
  bytes?: Uint8Array;
  /** An existing Skia image */
  skImage?: SkImage;
}

export interface UseY2KCameraReturn {
  /** Trigger processing on an image. */
  processImage: (input: ProcessImageInput) => Promise<SkImage | null>;
  /** The resulting processed SkImage, or null. */
  result: SkImage | null;
  /** Whether processing is in progress. */
  processing: boolean;
  /** Error message if something went wrong. */
  error: string | null;
  /** Reset state (clear result and error). */
  reset: () => void;
  /** Save the current result to a file path. Returns the path or null. */
  saveResult: (
    outputPath: string,
    quality?: number
  ) => Promise<string | null>;
}

// ─── Helper: load SkImage from various sources ───────────────────────────────

async function loadSkImage(input: ProcessImageInput): Promise<SkImage> {
  if (input.skImage) {
    return input.skImage;
  }

  if (input.bytes) {
    const data = Skia.Data.fromBytes(input.bytes);
    const image = Skia.Image.MakeImageFromEncoded(data);
    if (!image) throw new Error("Failed to decode image from bytes");
    return image;
  }

  if (input.uri) {
    // Fetch the file and decode
    const response = await fetch(input.uri);
    const arrayBuffer = await response.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);
    const data = Skia.Data.fromBytes(uint8);
    const image = Skia.Image.MakeImageFromEncoded(data);
    if (!image) throw new Error(`Failed to decode image from URI: ${input.uri}`);
    return image;
  }

  throw new Error(
    "processImage requires at least one of: uri, bytes, or skImage"
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useY2KCamera(): UseY2KCameraReturn {
  const [result, setResult] = useState<SkImage | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track the latest request to avoid stale updates
  const requestIdRef = useRef(0);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setProcessing(false);
    requestIdRef.current++;
  }, []);

  const processImage = useCallback(
    async (input: ProcessImageInput): Promise<SkImage | null> => {
      const currentRequestId = ++requestIdRef.current;

      setProcessing(true);
      setError(null);

      try {
        // 1. Load source image
        const sourceImage = await loadSkImage(input);

        // 2. Check if this request is still the latest
        if (currentRequestId !== requestIdRef.current) return null;

        // 3. Run the effect pipeline
        //    This is CPU-heavy; Skia blur runs on GPU but pixel loops are JS.
        //    We wrap in a microtask to keep the UI responsive.
        const processed = await new Promise<SkImage>((resolve, reject) => {
          // Use setTimeout to yield to the UI thread before heavy work
          setTimeout(() => {
            try {
              const output = applyY2KCameraEffect(sourceImage, {
                intensity: input.intensity,
                addDateStamp: input.addDateStamp,
                dateStampText: input.dateStampText,
                outputQuality: input.outputQuality,
              });
              resolve(output);
            } catch (e) {
              reject(e);
            }
          }, 0);
        });

        // 4. Check staleness again
        if (currentRequestId !== requestIdRef.current) return null;

        setResult(processed);
        setProcessing(false);
        return processed;
      } catch (e: any) {
        if (currentRequestId === requestIdRef.current) {
          const message =
            e?.message ?? "Unknown error processing image";
          setError(message);
          setProcessing(false);
        }
        return null;
      }
    },
    []
  );

  const saveResult = useCallback(
    async (
      outputPath: string,
      quality: number = 85
    ): Promise<string | null> => {
      if (!result) {
        setError("No result to save");
        return null;
      }

      try {
        const encoded = result.encodeToBytes(
          // @ts-expect-error — ImageFormat enum may differ across skia versions
          Skia.ImageFormat?.JPEG ?? 3,
          quality
        );

        if (!encoded) {
          throw new Error("Failed to encode result as JPEG");
        }

        // Write to file system using react-native-fs or expo-file-system
        // This is a placeholder — adapt to your file system library:
        const RNFS = require("react-native-fs");
        const binary = Array.from(encoded)
          .map((byte) => String.fromCharCode(byte))
          .join("");
        const base64 = btoa(binary);
        await RNFS.writeFile(outputPath, base64, "base64");

        return outputPath;
      } catch (e: any) {
        setError(e?.message ?? "Failed to save image");
        return null;
      }
    },
    [result]
  );

  return {
    processImage,
    result,
    processing,
    error,
    reset,
    saveResult,
  };
}

export default useY2KCamera;
