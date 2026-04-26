import { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { supabase, API_URL } from "../lib/supabase";
import StudBackground from "../components/StudBackground";

const C = {
  red: "#cc1010",
  redShadow: "#8b0000",
  heading: "#2d0808",
  subtext: "#7a5050",
  dim: "#b08080",
  pageBg: "#fce8e8",
  card: "#ffffff",
  cardBorder: "#f0dede",
  inputBg: "#fcd6d6",
  inputPlaceholder: "#c49090",
};

const F = {
  brand: "SpaceGrotesk_700Bold",
  heading: "SpaceGrotesk_700Bold",
  semibold: "SpaceGrotesk_600SemiBold",
  body: "DMSans_400Regular",
  bodySemibold: "DMSans_600SemiBold",
};

// ─── Shared bottom-sheet modal ────────────────────────────────────────────────

function FormModal({
  visible,
  title,
  subtitle,
  onClose,
  onSubmit,
  submitLabel,
  loading,
  children,
}: {
  visible: boolean;
  title: string;
  subtitle: string;
  onClose: () => void;
  onSubmit: () => void;
  submitLabel: string;
  loading: boolean;
  children: React.ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <Pressable style={ms.backdrop} onPress={onClose} />
        <View style={ms.sheet}>
          <View style={ms.handle} />
          <Text style={ms.sheetTitle}>{title}</Text>
          <Text style={ms.sheetSub}>{subtitle}</Text>
          <View style={ms.fields}>{children}</View>
          <Pressable
            style={({ pressed }) => [ms.submitBtn, pressed && ms.submitBtnPressed, loading && ms.submitBtnDisabled]}
            onPress={onSubmit}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={ms.submitLabel}>{submitLabel}</Text>
            }
          </Pressable>
          <Pressable style={ms.cancelBtn} onPress={onClose} disabled={loading}>
            <Text style={ms.cancelLabel}>Cancel</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Profile screen ───────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [initials, setInitials] = useState<string>("?");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [clearingVault, setClearingVault] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Email change
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [changingEmail, setChangingEmail] = useState(false);

  // Password change
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => { loadUser(); }, []);

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const email = user.email ?? "";
    setUserEmail(email);
    setInitials(email[0]?.toUpperCase() ?? "?");
    setAvatarUrl(user.user_metadata?.avatar_url ?? null);
  };

  // ── Photo ──────────────────────────────────────────────────────────────────

  const handleChangePhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Please allow access to your photo library to change your profile picture.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]) return;
    setUploadingPhoto(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");
      const imageUri = result.assets[0].uri;
      const filePath = `${user.id}/avatar.jpg`;
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, blob, { contentType: "image/jpeg", upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);
      await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
      setAvatarUrl(publicUrl);
    } catch (e: any) {
      Alert.alert("Upload Failed", e.message ?? "Could not update profile picture.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  // ── Email ──────────────────────────────────────────────────────────────────

  const handleChangeEmail = async () => {
    const trimmed = newEmail.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }
    setChangingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: trimmed });
      if (error) throw error;
      setShowEmailModal(false);
      setNewEmail("");
      Alert.alert(
        "Confirm your new email",
        `A confirmation link has been sent to ${trimmed}. Check your inbox to complete the change.`
      );
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "Could not update email.");
    } finally {
      setChangingEmail(false);
    }
  };

  // ── Password ───────────────────────────────────────────────────────────────

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      Alert.alert("Too Short", "Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Mismatch", "Passwords do not match.");
      return;
    }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setShowPasswordModal(false);
      setNewPassword("");
      setConfirmPassword("");
      Alert.alert("Password Updated", "Your password has been changed successfully.");
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "Could not update password.");
    } finally {
      setChangingPassword(false);
    }
  };

  // ── Vault ──────────────────────────────────────────────────────────────────

  const handleClearVault = () => {
    Alert.alert(
      "Clear Vault",
      "This will permanently delete your entire collection. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear Vault",
          style: "destructive",
          onPress: async () => {
            setClearingVault(true);
            try {
              const { data: { session } } = await supabase.auth.getSession();
              if (!session) return;
              const res = await fetch(`${API_URL}/api/sets/all`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${session.access_token}` },
              });
              if (res.ok) {
                Alert.alert("Vault Cleared", "All sets have been removed.", [
                  { text: "OK", onPress: () => router.back() },
                ]);
              } else {
                Alert.alert("Error", "Failed to clear vault.");
              }
            } catch {
              Alert.alert("Error", "Failed to connect to API.");
            } finally {
              setClearingVault(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This will permanently delete your account and all your LEGO sets. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Account",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Are you absolutely sure?",
              "Your account and all data will be gone forever.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Yes, delete everything",
                  style: "destructive",
                  onPress: async () => {
                    setDeletingAccount(true);
                    try {
                      const { data: { session } } = await supabase.auth.getSession();
                      if (!session) return;
                      const res = await fetch(`${API_URL}/api/account`, {
                        method: "DELETE",
                        headers: { Authorization: `Bearer ${session.access_token}` },
                      });
                      if (res.ok) {
                        await supabase.auth.signOut();
                      } else {
                        Alert.alert("Error", "Failed to delete account. Please try again.");
                      }
                    } catch {
                      Alert.alert("Error", "Failed to connect to API.");
                    } finally {
                      setDeletingAccount(false);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => { await supabase.auth.signOut(); },
      },
    ]);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <StudBackground />
      <View style={styles.frostedOverlay} pointerEvents="none" />
      <View style={[styles.statusBarBg, { height: insets.top }]} pointerEvents="none" />

      <SafeAreaView style={styles.safe} edges={["top"]}>

        {/* Avatar header */}
        <View style={styles.avatarCard}>
          <View style={styles.cardNav}>
            <Pressable
              style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
              onPress={() => router.back()}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.backChevron}>‹</Text>
            </Pressable>
            <Text style={styles.navTitle}>Profile</Text>
            <View style={{ width: 44 }} />
          </View>

          <Pressable onPress={handleChangePhoto} disabled={uploadingPhoto} style={styles.avatarWrap}>
            {avatarUrl
              ? <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              : <View style={styles.avatarPlaceholder}><Text style={styles.avatarInitials}>{initials}</Text></View>
            }
            <View style={styles.avatarBadge}>
              {uploadingPhoto
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={styles.avatarBadgeText}>✎</Text>
              }
            </View>
          </Pressable>

          <Text style={styles.userEmail}>{userEmail}</Text>
          <Pressable onPress={handleChangePhoto} disabled={uploadingPhoto}>
            <Text style={styles.changePhotoLink}>
              {uploadingPhoto ? "Uploading…" : "Change Photo"}
            </Text>
          </Pressable>
        </View>

        {/* Actions */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <Pressable
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              onPress={() => { setNewEmail(""); setShowEmailModal(true); }}
            >
              <View style={styles.rowBody}>
                <Text style={styles.rowLabel}>Change Email</Text>
                <Text style={styles.rowSub}>Update your email address</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>

            <View style={styles.divider} />

            <Pressable
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              onPress={() => { setNewPassword(""); setConfirmPassword(""); setShowPasswordModal(true); }}
            >
              <View style={styles.rowBody}>
                <Text style={styles.rowLabel}>Change Password</Text>
                <Text style={styles.rowSub}>Set a new password</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>

            <View style={styles.divider} />

            <Pressable
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              onPress={handleSignOut}
            >
              <View style={styles.rowBody}>
                <Text style={styles.rowLabel}>Sign Out</Text>
                <Text style={styles.rowSub}>Log out of your account</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>

            <View style={styles.divider} />

            <Pressable
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              onPress={handleClearVault}
              disabled={clearingVault}
            >
              <View style={styles.rowBody}>
                <Text style={styles.rowLabelDanger}>Clear Vault</Text>
                <Text style={styles.rowSub}>Delete your entire collection</Text>
              </View>
              {clearingVault
                ? <ActivityIndicator size="small" color={C.red} />
                : <Text style={styles.chevron}>›</Text>
              }
            </Pressable>

            <View style={styles.divider} />

            <Pressable
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              onPress={handleDeleteAccount}
              disabled={deletingAccount}
            >
              <View style={styles.rowBody}>
                <Text style={styles.rowLabelDanger}>Delete Account</Text>
                <Text style={styles.rowSub}>Permanently remove your account</Text>
              </View>
              {deletingAccount
                ? <ActivityIndicator size="small" color={C.red} />
                : <Text style={styles.chevron}>›</Text>
              }
            </Pressable>
          </View>

          <View style={styles.brandFooterWrap}>
            <Text style={styles.brandFooter}>BuildaVault</Text>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Change Email modal */}
      <FormModal
        visible={showEmailModal}
        title="Change Email"
        subtitle="A confirmation link will be sent to your new address."
        onClose={() => setShowEmailModal(false)}
        onSubmit={handleChangeEmail}
        submitLabel="Send Confirmation"
        loading={changingEmail}
      >
        <Text style={ms.fieldLabel}>New Email Address</Text>
        <TextInput
          style={ms.input}
          placeholder="new@email.com"
          placeholderTextColor={C.inputPlaceholder}
          value={newEmail}
          onChangeText={setNewEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
        />
      </FormModal>

      {/* Change Password modal */}
      <FormModal
        visible={showPasswordModal}
        title="Change Password"
        subtitle="Choose a strong password of at least 6 characters."
        onClose={() => setShowPasswordModal(false)}
        onSubmit={handleChangePassword}
        submitLabel="Update Password"
        loading={changingPassword}
      >
        <Text style={ms.fieldLabel}>New Password</Text>
        <TextInput
          style={ms.input}
          placeholder="Min. 6 characters"
          placeholderTextColor={C.inputPlaceholder}
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          autoFocus
        />
        <Text style={[ms.fieldLabel, { marginTop: 16 }]}>Confirm Password</Text>
        <TextInput
          style={ms.input}
          placeholder="Repeat password"
          placeholderTextColor={C.inputPlaceholder}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
      </FormModal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  frostedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(252, 232, 232, 0.72)",
  },
  statusBarBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(252, 232, 232, 0.97)",
    zIndex: 10,
  },
  safe: { flex: 1, backgroundColor: "transparent" },

  /* Avatar header */
  avatarCard: {
    backgroundColor: "rgba(252, 232, 232, 0.85)",
    paddingBottom: 28,
    paddingHorizontal: 20,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(224, 180, 180, 0.4)",
  },
  cardNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    alignSelf: "stretch",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(204, 16, 16, 0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  backBtnPressed: { backgroundColor: "rgba(204, 16, 16, 0.20)" },
  backChevron: {
    fontFamily: F.heading,
    fontSize: 28,
    color: C.red,
    lineHeight: 32,
    marginLeft: -2,
  },
  navTitle: {
    fontFamily: F.heading,
    fontSize: 26,
    color: C.heading,
    letterSpacing: -0.5,
  },
  avatarWrap: { position: "relative", marginBottom: 16 },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: C.cardBorder,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#1a0404",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: C.cardBorder,
  },
  avatarInitials: { fontFamily: F.heading, fontSize: 38, color: C.red },
  avatarBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.red,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
    shadowColor: C.redShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 0,
    elevation: 3,
  },
  avatarBadgeText: { color: "#fff", fontSize: 13 },
  userEmail: {
    fontFamily: F.bodySemibold,
    fontSize: 15,
    color: C.heading,
    marginBottom: 6,
  },
  changePhotoLink: { fontFamily: F.semibold, fontSize: 14, color: C.red },

  scrollContent: { paddingTop: 24, paddingBottom: 32 },

  /* Action cards */
  section: {
    marginHorizontal: 20,
    backgroundColor: C.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: C.cardBorder,
    overflow: "hidden",
    shadowColor: "#2d0808",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 24,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 14,
  },
  rowPressed: { backgroundColor: C.pageBg },
  rowBody: { flex: 1 },
  rowLabel: {
    fontFamily: F.bodySemibold,
    fontSize: 15,
    color: C.heading,
    marginBottom: 2,
  },
  rowLabelDanger: {
    fontFamily: F.bodySemibold,
    fontSize: 15,
    color: C.red,
    marginBottom: 2,
  },
  rowSub: { fontFamily: F.body, fontSize: 12, color: C.dim },
  chevron: { fontFamily: F.body, fontSize: 22, color: C.dim, marginTop: -2 },
  divider: { height: 1, backgroundColor: C.cardBorder, marginLeft: 18 },

  /* Footer */
  brandFooterWrap: {
    alignSelf: "center",
    backgroundColor: "rgba(252, 232, 232, 0.85)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(224, 180, 180, 0.4)",
    marginTop: 8,
  },
  brandFooter: {
    fontFamily: F.brand,
    fontSize: 13,
    color: C.red,
    letterSpacing: -0.3,
  },
});

// Modal styles
const ms = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(20, 4, 4, 0.55)",
  },
  sheet: {
    backgroundColor: C.card,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.cardBorder,
    alignSelf: "center",
    marginBottom: 20,
  },
  sheetTitle: {
    fontFamily: F.heading,
    fontSize: 24,
    color: C.heading,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  sheetSub: {
    fontFamily: F.body,
    fontSize: 13,
    color: C.subtext,
    marginBottom: 24,
    lineHeight: 18,
  },
  fields: { gap: 4 },
  fieldLabel: {
    fontFamily: F.semibold,
    fontSize: 11,
    color: C.heading,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  input: {
    fontFamily: F.body,
    backgroundColor: C.inputBg,
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 16,
    fontSize: 15,
    color: C.heading,
  },
  submitBtn: {
    backgroundColor: C.red,
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: "center",
    marginTop: 24,
    shadowColor: C.redShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  submitBtnPressed: { opacity: 0.88, shadowOffset: { width: 0, height: 2 } },
  submitBtnDisabled: { opacity: 0.7 },
  submitLabel: {
    fontFamily: F.heading,
    color: "#fff",
    fontSize: 15,
    letterSpacing: 0.5,
  },
  cancelBtn: {
    alignItems: "center",
    paddingVertical: 14,
    marginTop: 4,
  },
  cancelLabel: {
    fontFamily: F.semibold,
    fontSize: 14,
    color: C.dim,
  },
});
