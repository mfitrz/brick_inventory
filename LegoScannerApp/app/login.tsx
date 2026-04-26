import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Animated,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { supabase } from "../lib/supabase";
import StudBackground from "../components/StudBackground";

const C = {
  card: "#ffffff",
  heading: "#2d0808",
  subtext: "#7a5050",
  inputBg: "#fcd6d6",
  inputPlaceholder: "#c49090",
  red: "#cc1010",
  redShadow: "#8b0000",
  divider: "#f0dede",
};

const F = {
  brand: "SpaceGrotesk_700Bold",
  heading: "SpaceGrotesk_700Bold",
  semibold: "SpaceGrotesk_600SemiBold",
  body: "DMSans_400Regular",
  bodyMedium: "DMSans_500Medium",
};

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 320, useNativeDriver: true }).start();
  }, []);

  const fadeOutThen = (fn: () => void) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => fn());
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Missing fields", "Please enter both email and password.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) Alert.alert("Login failed", error.message);
  };

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <StudBackground animate />
      <View style={[styles.statusBarBg, { height: insets.top }]} pointerEvents="none" />
      <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.card}>
            {/* Card header */}
            <View style={styles.cardHeader}>
              <Text style={styles.brandLabel}>BuildaVault</Text>
              <Text style={styles.headerTitle}>WELCOME BACK</Text>
              <Text style={styles.headerSub}>Sign in to your vault</Text>
            </View>

            {/* Form */}
            <Text style={styles.fieldLabel}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="master.builder@vault.com"
              placeholderTextColor={C.inputPlaceholder}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={[styles.fieldLabel, { marginTop: 20 }]}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={C.inputPlaceholder}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <Pressable
              style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? "Signing in…" : "SIGN IN  →"}
              </Text>
            </Pressable>

            <View style={styles.divider} />

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account?  </Text>
              <Pressable onPress={() => fadeOutThen(() => router.replace("/signup"))}>
                <Text style={styles.footerLink}>Sign Up</Text>
              </Pressable>
            </View>
          </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "transparent",
  },
  statusBarBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(252, 232, 232, 0.97)",
    zIndex: 10,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: C.card,
    borderRadius: 28,
    padding: 36,
    shadowColor: "#640000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.16,
    shadowRadius: 64,
    elevation: 16,
  },
  cardHeader: {
    alignItems: "center",
    marginBottom: 32,
  },
  brandLabel: {
    fontFamily: F.brand,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
    color: C.red,
    marginBottom: 10,
  },
  headerTitle: {
    fontFamily: F.heading,
    fontSize: 32,
    fontWeight: "700",
    color: C.heading,
    letterSpacing: -0.5,
    lineHeight: 36,
    marginBottom: 8,
    textAlign: "center",
  },
  headerSub: {
    fontFamily: F.body,
    fontSize: 14,
    color: C.subtext,
    textAlign: "center",
  },
  fieldLabel: {
    fontFamily: F.semibold,
    fontSize: 11,
    color: C.heading,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 9,
  },
  input: {
    fontFamily: F.body,
    backgroundColor: C.inputBg,
    borderWidth: 2,
    borderColor: "transparent",
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    fontSize: 15,
    color: C.heading,
  },
  button: {
    backgroundColor: C.red,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 28,
    shadowColor: C.redShadow,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  buttonPressed: {
    opacity: 0.88,
    shadowOffset: { width: 0, height: 2 },
  },
  buttonText: {
    fontFamily: F.heading,
    color: "#ffffff",
    fontSize: 15,
    letterSpacing: 0.8,
  },
  divider: {
    height: 1,
    backgroundColor: C.divider,
    marginTop: 28,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 22,
  },
  footerText: {
    fontFamily: F.body,
    color: C.subtext,
    fontSize: 14,
  },
  footerLink: {
    fontFamily: F.heading,
    color: C.red,
    fontSize: 14,
  },
});
