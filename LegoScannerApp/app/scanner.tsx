import { useState, useRef, useEffect } from "react";
import { View, Text, Image, Pressable, Alert, Platform, Animated } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { supabase, API_URL, getAuthHeaders } from "../lib/supabase";

const F = {
  brand: "SpaceGrotesk_700Bold",
  heading: "SpaceGrotesk_700Bold",
  semibold: "SpaceGrotesk_600SemiBold",
  body: "DMSans_400Regular",
  bodySemibold: "DMSans_600SemiBold",
};

const C = {
  red: "#cc1010",
  redShadow: "#8b0000",
  green: "#16a34a",
  studDark: "#1a0404",
  heading: "#2d0808",
  subtext: "#7a5050",
  dim: "#b08080",
  pageBg: "#fce8e8",
  cardBorder: "#f0dede",
};

interface ProductInfo {
  title: string;
  brand?: string;
  model?: string;
  offerTitles?: string[];
}

interface SetPreview {
  setNumber: number;
  name: string;
  imgUrl?: string;
  year?: number;
}

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanArmed, setIsScanArmed] = useState(false);
  const [justScanned, setJustScanned] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);

  // Sheet state: hidden | loading | preview | not-lego
  const [sheetMode, setSheetMode] = useState<"hidden" | "loading" | "preview" | "not-lego">("hidden");
  const [pendingSetNumber, setPendingSetNumber] = useState<string | null>(null);
  const [setPreview, setSetPreview] = useState<SetPreview | null>(null);
  const [notLegoTitle, setNotLegoTitle] = useState<string>("");
  const [isAddingSet, setIsAddingSet] = useState(false);

  const scanLockRef = useRef(false);
  const lastScanRef = useRef<{ data: string; ts: number } | null>(null);
  const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const slideAnim = useRef(new Animated.Value(600)).current;
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, [permission]);

  useEffect(() => {
    return () => { if (scanTimerRef.current) clearTimeout(scanTimerRef.current); };
  }, []);

  // Pulse loop for the loading skeleton
  useEffect(() => {
    if (sheetMode !== "loading") return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [sheetMode]);

  const openSheet = () => {
    slideAnim.setValue(600);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 62,
      friction: 12,
    }).start();
  };

  const closeSheet = (onDone?: () => void) => {
    Animated.timing(slideAnim, {
      toValue: 600,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      setSheetMode("hidden");
      setSetPreview(null);
      setPendingSetNumber(null);
      scanLockRef.current = false;
      lastScanRef.current = null;
      onDone?.();
    });
  };

  const lookupProduct = async (barcode: string): Promise<ProductInfo | null> => {
    console.log("Looking up barcode:", barcode);
    try {
      const res = await fetch("https://api.upcitemdb.com/prod/trial/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ upc: barcode }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (data.items?.length > 0) {
        const item = data.items[0];
        const offerTitles: string[] = [];
        for (const it of data.items) {
          console.log("Checking item:", it.title, it.brand, it.model);
          if (Array.isArray(it.offers)) {
            for (const offer of it.offers) {
              if (offer.title) offerTitles.push(offer.title);
            }
          }
        }
        return { title: item.title || "Unknown", brand: item.brand, model: item.model, offerTitles };
      }
      return null;
    } catch {
      return null;
    }
  };

  const setNameMatchesTitle = (productTitle: string, setName: string): boolean => {
    const STOP = new Set(["lego", "the", "and", "for", "with", "from", "set", "building", "kit"]);
    const toWords = (s: string) =>
      s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter(w => w.length > 2 && !STOP.has(w));

    const titleWords = new Set(toWords(productTitle));
    const setWords = toWords(setName);

    if (setWords.length === 0) return true;
    const matches = setWords.filter(w => titleWords.has(w)).length;
    return matches >= Math.min(2, setWords.length);
  };

  const extractSetCandidates = (product: ProductInfo): string[] => {
    const seen = new Set<string>();
    const candidates: string[] = [];
    const add = (n: string) => { if (!seen.has(n)) { seen.add(n); candidates.push(n); } };

    if (product.model) add(product.model);

    const numbersIn = (text: string) =>
      [...text.matchAll(/(\d{3,})/g)].map((m) => m[1]);

    for (const n of numbersIn(product.title)) add(n);
    for (const t of product.offerTitles ?? []) {
      for (const n of numbersIn(t)) add(n);
    }

    return candidates;
  };

  const fetchSetPreview = async (setNumber: string): Promise<SetPreview | null> => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(
        `${API_URL}/api/sets/lookup?set_number=${encodeURIComponent(setNumber)}`,
        { headers: headers ?? {} }
      );
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  };

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (scanLockRef.current) return;
    const now = Date.now();
    if (lastScanRef.current && lastScanRef.current.data === data && now - lastScanRef.current.ts < 1500) return;
    scanLockRef.current = true;
    lastScanRef.current = { data, ts: now };

    if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
    setIsScanArmed(false);
    setShowHint(false);
    setJustScanned(true);
    setTimeout(() => setJustScanned(false), 300);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Show loading sheet immediately
    setSheetMode("loading");
    setPendingSetNumber(data);
    openSheet();

    const product = await lookupProduct(data);

    if (!product) {
      closeSheet(() =>
        Alert.alert("Not Found", "Could not find product information for this barcode.")
      );
      return;
    }

    const isLego =
      product.brand?.toLowerCase().includes("lego") ||
      product.title?.toLowerCase().includes("lego");

    if (!isLego) {
      setNotLegoTitle(product.title);
      setSheetMode("not-lego");
      return;
    }

    const candidates = extractSetCandidates(product);
    console.log("Set number candidates:", candidates);

    if (candidates.length === 0) {
      closeSheet(() =>
        Alert.alert("No Set Number", "Could not extract a set number from this barcode.")
      );
      return;
    }

    const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 10000));
    const preview = await Promise.race([
      Promise.any(
        candidates.map(async (candidate) => {
          console.log("Trying set number:", candidate);
          const result = await fetchSetPreview(candidate);
          const numberInTitle = new RegExp(`\\b${candidate}\\b`).test(product.title);
          if (result && (numberInTitle || setNameMatchesTitle(product.title, result.name))) return result;
          throw new Error("no match");
        })
      ).catch(() => null),
      timeout,
    ]);

    if (!preview) {
      closeSheet(() =>
        Alert.alert("Set Not Found", "Could not find a matching LEGO set for this barcode.")
      );
      return;
    }

    setSetPreview(preview);
    setSheetMode("preview");
  };

  const handleAddSet = async () => {
    if (!setPreview) return;
    setIsAddingSet(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        Alert.alert("Not Signed In", "Please sign in to add sets.");
        setIsAddingSet(false);
        return;
      }
      const res = await fetch(
        `${API_URL}/api/sets/scan?set_number=${encodeURIComponent(setPreview.setNumber)}`,
        { method: "POST", headers: { Authorization: `Bearer ${session.access_token}` } }
      );
      const data = await res.json();
      setIsAddingSet(false);

      if (res.ok) {
        closeSheet(() => {
          setScanSuccess(true);
          setTimeout(() => setScanSuccess(false), 2200);
        });
      } else if (res.status === 409) {
        Alert.alert("Already in Vault", data.message || "This set is already in your collection.");
      } else {
        Alert.alert("Error", data.message || "Failed to add set.");
      }
    } catch {
      setIsAddingSet(false);
      Alert.alert("Connection Error", "Failed to connect to the API.");
    }
  };

  const toggleScan = () => {
    if (isScanArmed) {
      setIsScanArmed(false);
      if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
      setShowHint(false);
    } else {
      scanLockRef.current = false;
      lastScanRef.current = null;
      setScanSuccess(false);
      setIsScanArmed(true);
      setShowHint(false);
      scanTimerRef.current = setTimeout(() => setShowHint(true), 5000);
    }
  };

  if (!permission) return <View style={{ flex: 1, backgroundColor: C.studDark }} />;

  if (!permission.granted) {
    return (
      <View style={permStyle.container}>
        <Text style={permStyle.title}>Camera Access Needed</Text>
        <Text style={permStyle.sub}>BuildaVault needs camera access to scan LEGO set barcodes.</Text>
        <Pressable style={permStyle.button} onPress={requestPermission}>
          <Text style={permStyle.buttonText}>Grant Permission</Text>
        </Pressable>
        <Pressable style={permStyle.back} onPress={() => router.push("/")}>
          <Text style={permStyle.backText}>← Back to Vault</Text>
        </Pressable>
      </View>
    );
  }

  const sheetVisible = sheetMode !== "hidden";

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "code128", "code39"],
        }}
        onBarcodeScanned={isScanArmed ? handleBarcodeScanned : undefined}
        onCameraReady={() => setCameraError(null)}
        onMountError={(e) => setCameraError(e.message)}
      />

      {/* Back button */}
      <View style={backBtn.container}>
        <Pressable style={backBtn.button} onPress={() => router.back()}>
          <Text style={backBtn.text}>← Vault</Text>
        </Pressable>
      </View>

      {/* Brand watermark */}
      <View style={brand.container} pointerEvents="none">
        <Text style={brand.text}>BuildaVault</Text>
      </View>

      {/* Camera error */}
      {cameraError && (
        <View style={errBox.container}>
          <Text style={errBox.text}>Camera error: {cameraError}</Text>
        </View>
      )}

      {/* Crosshair + scan button — hidden while sheet is open */}
      {!sheetVisible && (
        <>
          <View pointerEvents="none" style={xhair.container}>
            <View style={xhair.bracketTopLeft} />
            <View style={xhair.bracketTopRight} />
            <View style={xhair.bracketBottomLeft} />
            <View style={xhair.bracketBottomRight} />
            <View style={[xhair.dot, justScanned && xhair.dotScanned]} />
            {showHint && (
              <View style={xhair.hintBox}>
                <Text style={xhair.hintText}>
                  Try moving the camera slightly closer or farther from the barcode.
                </Text>
              </View>
            )}
          </View>

          <View style={scanBtn.container}>
            <Pressable
              style={({ pressed }) => [
                scanBtn.button,
                scanSuccess ? scanBtn.success : isScanArmed ? scanBtn.armed : scanBtn.idle,
                pressed && { opacity: 0.85 },
              ]}
              onPress={toggleScan}
            >
              <Text style={scanBtn.text}>
                {scanSuccess ? "✓ Added!" : isScanArmed ? "Stop" : "Scan Barcode"}
              </Text>
            </Pressable>
          </View>
        </>
      )}

      {/* Bottom sheet — backdrop + card */}
      {sheetVisible && (
        <>
          <Pressable
            style={sheet.backdrop}
            onPress={() => !isAddingSet && closeSheet()}
          />
          <Animated.View style={[sheet.card, { transform: [{ translateY: slideAnim }] }]}>

            {/* ── LOADING STATE ── */}
            {sheetMode === "loading" && (
              <>
                <Animated.View style={[sheet.imageBg, { opacity: pulseAnim }]}>
                  <View style={sheet.skeletonImageCircle} />
                </Animated.View>
                <View style={sheet.info}>
                  <View style={sheet.skeletonMeta}>
                    <Animated.View style={[sheet.skeletonChip, { opacity: pulseAnim }]} />
                    <Animated.View style={[sheet.skeletonChipSm, { opacity: pulseAnim }]} />
                  </View>
                  <Animated.View style={[sheet.skeletonNameBar, { opacity: pulseAnim }]} />
                  <Animated.View style={[sheet.skeletonNameBarShort, { opacity: pulseAnim }]} />
                  <View style={sheet.lookupLabel}>
                    <Text style={sheet.lookupText}>Looking up set…</Text>
                  </View>
                </View>
              </>
            )}

            {/* ── NOT A LEGO SET ── */}
            {sheetMode === "not-lego" && (
              <>
                <View style={sheet.notLegoImageBg}>
                  <Text style={sheet.notLegoIcon}>✕</Text>
                </View>
                <View style={sheet.info}>
                  <Text style={sheet.notLegoHeading}>Not a LEGO Set</Text>
                  {notLegoTitle ? (
                    <Text style={sheet.notLegoSub} numberOfLines={2}>{notLegoTitle}</Text>
                  ) : null}
                </View>
                <View style={sheet.buttons}>
                  <Pressable
                    style={({ pressed }) => [sheet.addBtn, sheet.notLegoBtn, pressed && { opacity: 0.8 }]}
                    onPress={() => closeSheet()}
                  >
                    <Text style={sheet.addText}>Scan Another</Text>
                  </Pressable>
                </View>
              </>
            )}

            {/* ── PREVIEW STATE ── */}
            {sheetMode === "preview" && setPreview && (
              <>
                {/* Image area */}
                <View style={sheet.imageBg}>
                  {setPreview.imgUrl ? (
                    <Image
                      source={{ uri: setPreview.imgUrl }}
                      style={sheet.image}
                      resizeMode="contain"
                    />
                  ) : (
                    <View style={sheet.imagePlaceholder} />
                  )}
                </View>

                {/* Set info */}
                <View style={sheet.info}>
                  <View style={sheet.metaRow}>
                    <Text style={sheet.setNumber}>#{setPreview.setNumber}</Text>
                    {setPreview.year != null && (
                      <Text style={sheet.year}>{setPreview.year}</Text>
                    )}
                  </View>
                  <Text style={sheet.name}>{setPreview.name}</Text>
                </View>

                {/* Buttons */}
                <View style={sheet.buttons}>
                  <Pressable
                    style={({ pressed }) => [sheet.cancelBtn, pressed && { opacity: 0.6 }]}
                    onPress={() => closeSheet()}
                    disabled={isAddingSet}
                  >
                    <Text style={sheet.cancelText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [
                      sheet.addBtn,
                      (pressed || isAddingSet) && { opacity: 0.8 },
                    ]}
                    onPress={handleAddSet}
                    disabled={isAddingSet}
                  >
                    <Text style={sheet.addText}>
                      {isAddingSet ? "Adding…" : "Add to Vault"}
                    </Text>
                  </Pressable>
                </View>
              </>
            )}

          </Animated.View>
        </>
      )}
    </View>
  );
}

/* ─── Permission screen ─── */
const permStyle = {
  container: {
    flex: 1, backgroundColor: C.studDark,
    alignItems: "center" as const, justifyContent: "center" as const, padding: 36,
  },
  title: { fontFamily: F.heading, fontSize: 24, color: "#fff", marginBottom: 12, textAlign: "center" as const },
  sub: { fontFamily: F.body, fontSize: 15, color: "rgba(255,255,255,0.6)", textAlign: "center" as const, lineHeight: 22, marginBottom: 32 },
  button: {
    backgroundColor: C.red, borderRadius: 14, paddingVertical: 16, paddingHorizontal: 40,
    shadowColor: C.redShadow, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 1, shadowRadius: 0, elevation: 5, marginBottom: 16,
  },
  buttonText: { fontFamily: F.heading, color: "#fff", fontSize: 16, letterSpacing: 0.5 },
  back: { paddingVertical: 10, paddingHorizontal: 20 },
  backText: { fontFamily: F.body, color: "rgba(255,255,255,0.5)", fontSize: 14 },
};

/* ─── Back button ─── */
const backBtn = {
  container: { position: "absolute" as const, top: Platform.OS === "ios" ? 56 : 36, left: 20 },
  button: {
    backgroundColor: "rgba(26,4,4,0.75)", paddingHorizontal: 16, paddingVertical: 9,
    borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
  },
  text: { fontFamily: F.semibold, color: "#fff", fontSize: 14 },
};

/* ─── Brand watermark ─── */
const brand = {
  container: { position: "absolute" as const, top: Platform.OS === "ios" ? 60 : 40, right: 20 },
  text: { fontFamily: F.brand, fontSize: 11, letterSpacing: -0.2, color: C.red },
};

/* ─── Camera error ─── */
const errBox = {
  container: {
    position: "absolute" as const, top: 110, left: 20, right: 20,
    backgroundColor: "rgba(204,16,16,0.9)", padding: 12, borderRadius: 10,
  },
  text: { color: "#fff", fontSize: 13, textAlign: "center" as const },
};

/* ─── Crosshair overlay ─── */
const BRACKET = 28;
const BRACKET_THICK = 3;
const FRAME = 200;

const xhair = {
  container: {
    position: "absolute" as const, top: 0, left: 0, right: 0, bottom: 0,
    alignItems: "center" as const, justifyContent: "center" as const,
  },
  bracketTopLeft: {
    position: "absolute" as const, top: "50%" as any, left: "50%" as any,
    marginTop: -(FRAME / 2), marginLeft: -(FRAME / 2),
    width: BRACKET, height: BRACKET,
    borderTopWidth: BRACKET_THICK, borderLeftWidth: BRACKET_THICK,
    borderColor: "#fff", borderRadius: 4,
  },
  bracketTopRight: {
    position: "absolute" as const, top: "50%" as any, right: "50%" as any,
    marginTop: -(FRAME / 2), marginRight: -(FRAME / 2),
    width: BRACKET, height: BRACKET,
    borderTopWidth: BRACKET_THICK, borderRightWidth: BRACKET_THICK,
    borderColor: "#fff", borderRadius: 4,
  },
  bracketBottomLeft: {
    position: "absolute" as const, bottom: "50%" as any, left: "50%" as any,
    marginBottom: -(FRAME / 2), marginLeft: -(FRAME / 2),
    width: BRACKET, height: BRACKET,
    borderBottomWidth: BRACKET_THICK, borderLeftWidth: BRACKET_THICK,
    borderColor: "#fff", borderRadius: 4,
  },
  bracketBottomRight: {
    position: "absolute" as const, bottom: "50%" as any, right: "50%" as any,
    marginBottom: -(FRAME / 2), marginRight: -(FRAME / 2),
    width: BRACKET, height: BRACKET,
    borderBottomWidth: BRACKET_THICK, borderRightWidth: BRACKET_THICK,
    borderColor: "#fff", borderRadius: 4,
  },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "rgba(255,255,255,0.85)" },
  dotScanned: {
    backgroundColor: "#22c55e",
    shadowColor: "#22c55e", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 8,
  },
  hintBox: { position: "absolute" as const, top: "62%" as any, left: 40, right: 40, alignItems: "center" as const },
  hintText: {
    fontFamily: F.body, color: "rgba(255,255,255,0.85)", fontSize: 13,
    textAlign: "center" as const, lineHeight: 20,
    textShadowColor: "rgba(0,0,0,0.8)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3,
  },
};

/* ─── Scan button ─── */
const scanBtn = {
  container: { position: "absolute" as const, bottom: 52, left: 0, right: 0, alignItems: "center" as const },
  button: { width: 220, height: 58, borderRadius: 50, alignItems: "center" as const, justifyContent: "center" as const, borderWidth: 1.5 },
  idle: { backgroundColor: "rgba(26,4,4,0.72)", borderColor: "rgba(255,255,255,0.25)" },
  armed: { backgroundColor: "rgba(204,16,16,0.82)", borderColor: "rgba(255,255,255,0.2)" },
  success: { backgroundColor: "rgba(22,163,74,0.9)", borderColor: "rgba(255,255,255,0.2)" },
  text: { fontFamily: F.heading, color: "#fff", fontSize: 17, letterSpacing: 0.3 },
};

/* ─── Bottom sheet ─── */
const sheet = {
  backdrop: {
    position: "absolute" as const, top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  card: {
    position: "absolute" as const, left: 0, right: 0, bottom: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden" as const,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 20,
  },

  /* Image area */
  imageBg: {
    backgroundColor: C.studDark,
    height: 220,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  image: { width: 180, height: 180 },
  imagePlaceholder: {
    width: 100, height: 100, borderRadius: 16,
    backgroundColor: "#2d0808", borderWidth: 1, borderColor: "#3d1010",
  },

  /* Info */
  info: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 8 },
  metaRow: { flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "space-between" as const, marginBottom: 8 },
  setNumber: { fontFamily: F.semibold, fontSize: 13, color: C.red, letterSpacing: 0.5 },
  year: { fontFamily: F.bodySemibold, fontSize: 13, color: C.dim },
  name: { fontFamily: F.heading, fontSize: 22, color: C.heading, lineHeight: 28 },

  /* Buttons */
  buttons: {
    flexDirection: "row" as const, gap: 12,
    paddingHorizontal: 24, paddingTop: 20, paddingBottom: 36,
  },
  cancelBtn: {
    flex: 1, height: 54, borderRadius: 16, borderWidth: 1.5, borderColor: C.cardBorder,
    alignItems: "center" as const, justifyContent: "center" as const,
    backgroundColor: C.pageBg,
  },
  cancelText: { fontFamily: F.semibold, fontSize: 16, color: C.subtext },
  addBtn: {
    flex: 2, height: 54, borderRadius: 16,
    alignItems: "center" as const, justifyContent: "center" as const,
    backgroundColor: C.red,
    shadowColor: C.redShadow, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 1, shadowRadius: 0, elevation: 5,
  },
  addText: { fontFamily: F.heading, fontSize: 17, color: "#fff", letterSpacing: 0.3 },

  /* Not a LEGO set */
  notLegoImageBg: {
    backgroundColor: "#1a0404",
    height: 220,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  notLegoIcon: {
    fontSize: 72,
    color: C.red,
    fontWeight: "900" as const,
    lineHeight: 80,
    textShadowColor: C.redShadow,
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 0,
  },
  notLegoHeading: {
    fontFamily: F.heading,
    fontSize: 22,
    color: C.heading,
    marginBottom: 6,
    textAlign: "center" as const,
  },
  notLegoSub: {
    fontFamily: F.body,
    fontSize: 14,
    color: C.dim,
    lineHeight: 20,
    textAlign: "center" as const,
  },
  notLegoBtn: {
    flex: 1,
    backgroundColor: C.heading,
    shadowColor: "#000",
  },

  /* Loading skeleton */
  skeletonImageCircle: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: "#2d0808",
  },
  skeletonMeta: { flexDirection: "row" as const, justifyContent: "space-between" as const, marginBottom: 14 },
  skeletonChip: { width: 80, height: 14, borderRadius: 7, backgroundColor: C.cardBorder },
  skeletonChipSm: { width: 44, height: 14, borderRadius: 7, backgroundColor: C.cardBorder },
  skeletonNameBar: { width: "100%" as any, height: 20, borderRadius: 10, backgroundColor: C.cardBorder, marginBottom: 10 },
  skeletonNameBarShort: { width: "65%" as any, height: 20, borderRadius: 10, backgroundColor: C.cardBorder, marginBottom: 20 },
  lookupLabel: { alignItems: "center" as const, paddingBottom: 8 },
  lookupText: { fontFamily: F.body, fontSize: 14, color: C.dim },
};
