import { useEffect, useState, useRef } from "react";
import { View, Text, Pressable, Alert, ActivityIndicator } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface ProductInfo {
  title: string;
  brand?: string;
  barcode?: string;
  model?: string;
}

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();

  const [isScanArmed, setIsScanArmed] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [justScanned, setJustScanned] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [hideScanUI, setHideScanUI] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);

  const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scanLockRef = useRef(false);
  const lastScanRef = useRef<{ data: string; ts: number } | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, [permission]);

  useEffect(() => {
    return () => {
      if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  // Look up product info from UPC database
  const lookupProduct = async (barcode: string): Promise<ProductInfo | null> => {
    try {
      const response = await fetch("https://api.upcitemdb.com/prod/trial/lookup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          upc: barcode,
        }),
      });

      if (!response.ok) {
        console.error("UPC lookup failed:", response.status);
        return null;
      }

      const data = await response.json();

      if (data.items && data.items.length > 0) {
        const item = data.items[0];

        return {
          title: item.title || "Unknown Product",
          brand: item.brand,
          barcode: barcode,
          model: item.model,
        };
      }

      return null;
    } catch (error) {
      console.error("Error looking up product:", error);
      return null;
    }
  };

  // Send LEGO set to the backend
  const addLegoSet = async (setNumber: string, setName: string) => {
    try {
      const apiUrl = await AsyncStorage.getItem("apiUrl");

      if (!apiUrl) {
        Alert.alert("Not Connected", "Please configure API connection in settings from the home screen", [
          { text: "OK", onPress: () => setHideScanUI(false) },
        ]);
        return false;
      }

      const response = await fetch(
        `${apiUrl}/sets?set_number=${encodeURIComponent(setNumber)}&set_name=${encodeURIComponent(setName)}`,
        {
          method: "POST",
        },
      );

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Success", `Added LEGO set ${setNumber} to your collection!`, [
          {
            text: "Add Another",
            style: "default",
            onPress: () => setHideScanUI(false),
          },
          {
            text: "View Collection",
            onPress: () => {
              setHideScanUI(false);
              router.push("/");
            },
          },
        ]);
        return true;
      } else if (response.status === 409) {
        Alert.alert("Already in Collection", data.detail || "This set is already in your collection", [
          { text: "OK", onPress: () => setHideScanUI(false) },
        ]);
        return false;
      } else {
        Alert.alert("Error", data.detail || "Failed to add set to collection", [
          { text: "OK", onPress: () => setHideScanUI(false) },
        ]);
        return false;
      }
    } catch (error) {
      console.error("Error adding LEGO set:", error);
      Alert.alert("Error", "Failed to connect to inventory API", [
        { text: "OK", onPress: () => setHideScanUI(false) },
      ]);
      return false;
    }
  };

  if (!permission) return <Text>Loading…</Text>;
  if (!permission.granted) return <Text>Camera permission is required.</Text>;

  const stopScan = () => {
    if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
    setIsScanArmed(false);
    setShowHint(false);
  };

  const toggleScan = () => {
    if (isScanArmed) {
      stopScan();
      return;
    }

    // Re-arm scanning and clear any previous scan lock
    scanLockRef.current = false;
    setScanSuccess(false);

    setIsScanArmed(true);
    setShowHint(false);

    if (scanTimerRef.current) clearTimeout(scanTimerRef.current);

    const timer = setTimeout(() => {
      setShowHint(true);
    }, 5000);

    scanTimerRef.current = timer;
  };

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    // Guard against duplicate scan events (camera can fire multiple times quickly)
    if (scanLockRef.current) return;
    const now = Date.now();
    if (lastScanRef.current && lastScanRef.current.data === data && now - lastScanRef.current.ts < 1500) {
      return;
    }
    scanLockRef.current = true;
    lastScanRef.current = { data, ts: now };

    if (scanTimerRef.current) clearTimeout(scanTimerRef.current);

    // Haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Visual feedback
    setJustScanned(true);
    setTimeout(() => setJustScanned(false), 300);
    setScanSuccess(true);

    setIsScanArmed(false);
    setShowHint(false);
    setIsLoading(true);
    setHideScanUI(false);

    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => {
      setHideScanUI(true);
      setScanSuccess(false);
    }, 400);

    try {
      // Look up product info
      const product = await lookupProduct(data);
      //await new Promise((resolve) => setTimeout(resolve, 5000));
      setIsLoading(false);

      if (product) {
        // Check if it's a LEGO product
        if (product.brand?.toLowerCase().includes("lego") || product.title?.toLowerCase().includes("lego")) {
          const setNumber = product.model;

          Alert.alert(
            "LEGO Product Found",
            `Title: ${product.title}\n\nSet Number: ${product.model || 'Not found'}\n\nBarcode: ${product.barcode}`,
            [
              {
                text: "Cancel",
                style: "cancel",
                onPress: () => setHideScanUI(false),
              },
              {
                text: "Add to Collection",
                onPress: async () => {
                  if (setNumber) {
                    await addLegoSet(setNumber, product.title);
                  } else {
                  Alert.alert("No Set Number", "The model field is empty/null.", [
                    { text: "OK", onPress: () => setHideScanUI(false) },
                  ]);
                  }
                }
              }
            ]
          );
        } else {
          Alert.alert(
            "Not a LEGO Set",
            `Found: ${product.title}\n\nThis doesn't appear to be a LEGO product.`,
            [{ text: "OK", onPress: () => setHideScanUI(false) }]
          );
        }
      } else {
        Alert.alert("Product Not Found", "Could not find product information for this barcode.", [
          { text: "OK", onPress: () => setHideScanUI(false) },
        ]);
      }
    } finally {
      // Keep lock until user explicitly re-arms scanning
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <CameraView
        style={{ flex: 1 }}
        barcodeScannerSettings={{
          barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "code128", "code39"],
        }}
        onBarcodeScanned={isScanArmed ? handleBarcodeScanned : undefined}
        onCameraReady={() => setCameraError(null)}
        onMountError={(error) => setCameraError(error.message)}
      />

      {/* Back button */}
      <View style={backButtonStyle.container}>
        <Pressable
          style={backButtonStyle.button}
          onPress={() => router.push("/")}
        >
          <Text style={backButtonStyle.text}>← Back</Text>
        </Pressable>
      </View>

      {/* Error message */}
      {cameraError && (
        <View style={errorStyle.container}>
          <Text style={errorStyle.text}>Camera Error: {cameraError}</Text>
        </View>
      )}

      {/* Overlay: crosshair - simple + symbol */}
      {!hideScanUI && (
        <View pointerEvents="none" style={overlayStyle.container}>
          <View style={overlayStyle.crosshairContainer}>
            <Text style={[
              overlayStyle.crosshair,
              justScanned && overlayStyle.crosshairScanned,
            ]}>
              +
            </Text>
          </View>

          {showHint && (
            <View style={overlayStyle.hintContainer}>
              <Text style={overlayStyle.hintText}>
                If barcode is aligned but not scanning, try moving camera slightly closer or
                farther.
              </Text>
            </View>
          )}
        </View>
      )}

      {hideScanUI && isLoading && (
        <View pointerEvents="none" style={overlayStyle.lookupContainer}>
          <Text style={overlayStyle.lookupText}>Looking up set information…</Text>
        </View>
      )}

      {/* Scan button */}
      {!hideScanUI && (
        <View style={scanButtonStyle.container}>
          <Pressable
            style={({ pressed }) => [
              scanButtonStyle.button,
              scanSuccess ? scanButtonStyle.success : (isScanArmed ? scanButtonStyle.armed : scanButtonStyle.idle),
              pressed && { opacity: 0.85 },
            ]}
            onPress={toggleScan}
          >
            <Text style={scanButtonStyle.text}>
              {scanSuccess ? "Success" : (isScanArmed ? "Stop scanning" : "Scan")}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const backButtonStyle = {
  container: {
    position: "absolute" as const,
    top: 50,
    right: 20,
  },
  button: {
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  text: {
    color: "white",
    fontSize: 16,
    fontWeight: "600" as const,
  },
};

const errorStyle = {
  container: {
    position: "absolute" as const,
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: "rgba(200, 60, 60, 0.9)",
    padding: 12,
    borderRadius: 8,
  },
  text: {
    color: "white",
    fontSize: 14,
    textAlign: "center" as const,
  },
};

const overlayStyle = {
  container: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },

  crosshairContainer: {
    width: 80,
    height: 80,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },

  crosshair: {
    fontSize: 80,
    color: "white",
    fontWeight: "300" as const,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },

  crosshairScanned: {
    color: "#00FF00",
  },

  hintContainer: {
    position: "absolute" as const,
    top: 150,
    left: 0,
    right: 0,
    paddingHorizontal: 18,
    alignItems: "center" as const,
  },
  hintText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600" as const,
    textAlign: "center" as const,
    opacity: 0.9,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    maxWidth: 320,
  },
  lookupContainer: {
    position: "absolute" as const,
    top: "52%" as any,
    left: 0,
    right: 0,
    alignItems: "center" as const,
    paddingHorizontal: 18,
  },
  lookupText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700" as const,
    textAlign: "center" as const,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
};

const scanButtonStyle = {
  container: {
    position: "absolute" as const,
    top: "62%" as any,
    alignSelf: "center" as const,
  },
  button: {
    width: 220,
    height: 62,
    borderRadius: 18,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
  idle: {
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  armed: {
    backgroundColor: "rgba(200,60,60,0.7)",
  },
  success: {
    backgroundColor: "rgba(0, 180, 90, 0.85)",
  },
  text: {
    color: "white",
    fontSize: 20,
    fontWeight: "700" as const,
  },
};

const uiStyle = {
  bottomBar: {
    position: "absolute" as const,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 14,
    flexDirection: "row" as const,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  label: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
  },
  value: {
    color: "white",
    fontSize: 16,
    marginTop: 2,
    fontWeight: "600" as const,
  },
  brand: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    marginTop: 2,
  },
  barcode: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    marginTop: 2,
  },
  subtext: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    marginTop: 2,
    fontStyle: "italic" as const,
  },
};
