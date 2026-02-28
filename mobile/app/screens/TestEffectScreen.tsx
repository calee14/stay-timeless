/**
 * Example usage of useY2KCamera hook in a React Native component.
 *
 * This shows a minimal photo picker → Y2K effect → display flow.
 * Adapt the image picker to your setup (expo-image-picker, react-native-image-picker, etc.)
 */

import React from "react";
import { View, TouchableOpacity, Text, StyleSheet, ActivityIndicator } from "react-native";
import { Canvas, Image as SkiaImage, useImage } from "@shopify/react-native-skia";
import { launchImageLibrary } from "react-native-image-picker";
import { useY2KCamera } from "../hooks/useY2KCamera";

export default function Y2KCameraScreen() {
  const { processImage, result, processing, error, reset } = useY2KCamera();

  const pickAndProcess = async () => {
    const response = await launchImageLibrary({ mediaType: "photo" });
    const uri = response?.assets?.[0]?.uri;
    if (!uri) return;

    await processImage({
      uri,
      intensity: 1.0,
      addDateStamp: true,
    });
  };

  const resultWidth = result?.width() ?? 0;
  const resultHeight = result?.height() ?? 0;

  // Scale to fit screen width (adjust as needed)
  const displayWidth = 350;
  const displayHeight = resultWidth > 0
    ? (resultHeight / resultWidth) * displayWidth
    : 350;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Y2K Camera</Text>

      {processing && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF8C00" />
          <Text style={styles.loadingText}>Applying effect...</Text>
        </View>
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      {result && !processing && (
        <Canvas style={{ width: displayWidth, height: displayHeight }}>
          <SkiaImage
            image={result}
            x={0}
            y={0}
            width={displayWidth}
            height={displayHeight}
            fit="contain"
          />
        </Canvas>
      )}

      <View style={styles.buttons}>
        <TouchableOpacity style={styles.button} onPress={pickAndProcess}>
          <Text style={styles.buttonText}>
            {result ? "Pick Another Photo" : "Pick a Photo"}
          </Text>
        </TouchableOpacity>

        {result && (
          <TouchableOpacity
            style={[styles.button, styles.resetButton]}
            onPress={reset}
          >
            <Text style={styles.buttonText}>Reset</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111",
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FF8C00",
    marginBottom: 20,
  },
  loadingContainer: {
    alignItems: "center",
    marginVertical: 40,
  },
  loadingText: {
    color: "#aaa",
    marginTop: 12,
    fontSize: 14,
  },
  error: {
    color: "#ff4444",
    marginBottom: 12,
    textAlign: "center",
  },
  buttons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  button: {
    backgroundColor: "#FF8C00",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
  },
  resetButton: {
    backgroundColor: "#444",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
