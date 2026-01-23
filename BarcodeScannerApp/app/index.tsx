import { useEffect, useState, useRef } from "react";
import { View, Text, Pressable, TextInput, Alert, ActivityIndicator } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface ProductInfo {
  title: string;
  brand?: string;
  barcode?: string;
}

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();

  const [isScanArmed, setIsScanArmed] = useState(false);
  const [lastScan, setLastScan] = useState<string | null>(null);
  const [productInfo, setProductInfo] = useState<ProductInfo | null>(null);

  const [showHint, setShowHint] = useState(false);
  const [justScanned, setJustScanned] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // API connection state
  const [apiUrl, setApiUrl] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!permission?.granted) requestPermission();
    loadApiUrl();
  }, [permission]);

  useEffect(() => {
    return () => {
      if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
    };
  }, []);

  // Load saved API URL
  const loadApiUrl = async () => {
    try {
      const saved = await AsyncStorage.getItem("apiUrl");
      if (saved) {
        setApiUrl(saved);
        checkConnection(saved);
      }
    } catch (error) {
      console.error("Failed to load API URL:", error);
    }
  };

  // Save API URL
  const saveApiUrl = async (url: string) => {
    try {
      await AsyncStorage.setItem("apiUrl", url);
      setApiUrl(url);
      checkConnection(url);
    } catch (error) {
      console.error("Failed to save API URL:", error);
    }
  };

  // Check if API is reachable
  const checkConnection = async (url: string) => {
    if (!url) {
      setIsConnected(false);
      return;
    }

    try {
      const response = await fetch(`${url}/sets`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        setIsConnected(true);
        Alert.alert("Connected", "Successfully connected to LEGO Inventory API");
      } else {
        setIsConnected(false);
        Alert.alert("Connection Failed", "API returned an error");
      }
    } catch (error) {
      setIsConnected(false);
      console.error("Connection error:", error);
    }
  };

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
    if (!apiUrl || !isConnected) {
      Alert.alert("Not Connected", "Please configure API connection in settings");
      return false;
    }

    try {
      const response = await fetch(`${apiUrl}/sets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          set_number: parseInt(setNumber),
          set_name: setName,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Success", `Added LEGO set ${setNumber} to your collection!`);
        return true;
      } else if (response.status === 409) {
        Alert.alert("Already in Collection", data.detail || "This set is already in your collection");
        return false;
      } else {
        Alert.alert("Error", data.detail || "Failed to add set to collection");
        return false;
      }
    } catch (error) {
      console.error("Error adding LEGO set:", error);
      Alert.alert("Error", "Failed to connect to inventory API");
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

    setIsScanArmed(true);
    setShowHint(false);

    if (scanTimerRef.current) clearTimeout(scanTimerRef.current);

    const timer = setTimeout(() => {
      setShowHint(true);
    }, 5000);

    scanTimerRef.current = timer;
  };

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    // Prevent duplicate scans
    if (lastScan === data) return;

    if (scanTimerRef.current) clearTimeout(scanTimerRef.current);

    // Haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Visual feedback
    setJustScanned(true);
    setTimeout(() => setJustScanned(false), 300);

    setLastScan(data);
    setIsScanArmed(false);
    setShowHint(false);
    setIsLoading(true);
    setProductInfo(null);

    // Look up product info
    const product = await lookupProduct(data);
    setIsLoading(false);

    if (product) {
      setProductInfo(product);
      
      // Check if it's a LEGO product
      if (product.brand?.toLowerCase().includes("lego") || product.title?.toLowerCase().includes("lego")) {
        // Automatically try to add to inventory
        await addLegoSet(data, product.title);
      } else {
        Alert.alert(
          "Not a LEGO Set",
          `Found: ${product.title}\n\nThis doesn't appear to be a LEGO product.`
        );
      }
    } else {
      Alert.alert("Product Not Found", "Could not find product information for this barcode.");
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

      {/* Settings Modal */}
      {showSettings && (
        <View style={settingsStyle.overlay}>
          <View style={settingsStyle.modal}>
            <Text style={settingsStyle.title}>API Settings</Text>
            
            <Text style={settingsStyle.label}>
              LEGO Inventory API URL (e.g., http://192.168.1.100:8000)
            </Text>
            <TextInput
              style={settingsStyle.input}
              value={apiUrl}
              onChangeText={setApiUrl}
              placeholder="http://192.168.1.100:8000"
              placeholderTextColor="#999"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />

            <Text style={settingsStyle.hint}>
              💡 Find your computer's IP address:{"\n"}
              • Mac/Linux: Run `ifconfig` or `ip addr`{"\n"}
              • Windows: Run `ipconfig`{"\n"}
              • Look for IP starting with 192.168.x.x or 10.0.x.x
            </Text>

            <View style={settingsStyle.status}>
              <Text style={settingsStyle.statusText}>
                Status: {isConnected ? "✅ Connected" : "❌ Not Connected"}
              </Text>
            </View>

            <View style={settingsStyle.buttons}>
              <Pressable
                style={[settingsStyle.button, settingsStyle.testButton]}
                onPress={() => checkConnection(apiUrl)}
              >
                <Text style={settingsStyle.buttonText}>Test Connection</Text>
              </Pressable>

              <Pressable
                style={[settingsStyle.button, settingsStyle.saveButton]}
                onPress={() => {
                  saveApiUrl(apiUrl);
                  setShowSettings(false);
                }}
              >
                <Text style={settingsStyle.buttonText}>Save</Text>
              </Pressable>

              <Pressable
                style={[settingsStyle.button, settingsStyle.cancelButton]}
                onPress={() => setShowSettings(false)}
              >
                <Text style={settingsStyle.buttonText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* Connection status indicator */}
      <View style={statusStyle.container}>
        <Pressable onPress={() => setShowSettings(true)}>
          <Text style={statusStyle.text}>
            {isConnected ? "🟢 API Connected" : "🔴 API Offline"}
          </Text>
        </Pressable>
      </View>

      {/* Error message */}
      {cameraError && (
        <View style={errorStyle.container}>
          <Text style={errorStyle.text}>Camera Error: {cameraError}</Text>
        </View>
      )}

      {/* Overlay: crosshair with scan animation */}
      <View pointerEvents="none" style={overlayStyle.container}>
        <View
          style={[
            overlayStyle.crosshairBox,
            justScanned && overlayStyle.crosshairScanned,
          ]}
        >
          <View style={[overlayStyle.corner, overlayStyle.tl]} />
          <View style={[overlayStyle.corner, overlayStyle.tr]} />
          <View style={[overlayStyle.corner, overlayStyle.bl]} />
          <View style={[overlayStyle.corner, overlayStyle.br]} />
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

      {/* Scan button */}
      <View style={scanButtonStyle.container}>
        <Pressable
          style={({ pressed }) => [
            scanButtonStyle.button,
            isScanArmed ? scanButtonStyle.armed : scanButtonStyle.idle,
            pressed && { opacity: 0.85 },
          ]}
          onPress={toggleScan}
        >
          <Text style={scanButtonStyle.text}>{isScanArmed ? "Stop scanning" : "Scan"}</Text>
        </Pressable>
      </View>

      {/* Bottom info bar */}
      <View style={uiStyle.bottomBar}>
        <View style={{ flex: 1 }}>
          {isLoading ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <ActivityIndicator color="white" />
              <Text style={uiStyle.label}>Looking up product...</Text>
            </View>
          ) : productInfo ? (
            <>
              <Text style={uiStyle.label}>Last scanned</Text>
              <Text style={uiStyle.value}>{productInfo.title}</Text>
              {productInfo.brand && (
                <Text style={uiStyle.brand}>Brand: {productInfo.brand}</Text>
              )}
              {productInfo.barcode && (
                <Text style={uiStyle.barcode}>Barcode: {productInfo.barcode}</Text>
              )}
            </>
          ) : lastScan ? (
            <>
              <Text style={uiStyle.label}>Last scanned</Text>
              <Text style={uiStyle.value}>{lastScan}</Text>
              <Text style={uiStyle.subtext}>Product info not available</Text>
            </>
          ) : (
            <>
              <Text style={uiStyle.label}>Last scanned</Text>
              <Text style={uiStyle.value}>None yet</Text>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const statusStyle = {
  container: {
    position: "absolute" as const,
    top: 50,
    left: 20,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  text: {
    color: "white",
    fontSize: 12,
    fontWeight: "600" as const,
  },
};

const settingsStyle = {
  overlay: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center" as const,
    alignItems: "center" as const,
    zIndex: 1000,
  },
  modal: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    width: "85%",
    maxWidth: 400,
  },
  title: {
    fontSize: 20,
    fontWeight: "700" as const,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600" as const,
    marginBottom: 8,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 12,
  },
  hint: {
    fontSize: 11,
    color: "#666",
    lineHeight: 16,
    marginBottom: 16,
    backgroundColor: "#f5f5f5",
    padding: 10,
    borderRadius: 6,
  },
  status: {
    padding: 10,
    backgroundColor: "#f0f0f0",
    borderRadius: 6,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600" as const,
    textAlign: "center" as const,
  },
  buttons: {
    flexDirection: "row" as const,
    gap: 8,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center" as const,
  },
  testButton: {
    backgroundColor: "#007AFF",
  },
  saveButton: {
    backgroundColor: "#34C759",
  },
  cancelButton: {
    backgroundColor: "#8E8E93",
  },
  buttonText: {
    color: "white",
    fontWeight: "600" as const,
    fontSize: 14,
  },
};

const errorStyle = {
  container: {
    position: "absolute" as const,
    top: 90,
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
  },

  crosshairBox: {
    position: "absolute" as const,
    left: "50%",
    top: "50%",
    transform: [{ translateX: -120 }, { translateY: -60 }],
    width: 240,
    height: 120,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 8,
  },

  crosshairScanned: {
    backgroundColor: "rgba(0,255,0,0.25)",
  },

  corner: {
    position: "absolute" as const,
    width: 22,
    height: 22,
    borderColor: "white",
  },
  tl: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
  tr: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
  br: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },

  hintContainer: {
    position: "absolute" as const,
    left: "50%",
    top: "50%",
    transform: [{ translateX: -160 }, { translateY: -90 - 14 - 44 }],
    width: 320,
    paddingHorizontal: 18,
  },
  hintText: {
    color: "white",
    fontSize: 20,
    fontWeight: "600" as const,
    textAlign: "center" as const,
    opacity: 0.9,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
};

const scanButtonStyle = {
  container: {
    position: "absolute" as const,
    top: "62%",
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