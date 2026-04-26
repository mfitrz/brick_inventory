import { useState, useCallback, useRef, useEffect } from "react";
import { useFocusEffect } from "expo-router";
import {
  View,
  Text,
  Image,
  FlatList,
  Pressable,
  Alert,
  RefreshControl,
  StyleSheet,
  Animated,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { Swipeable, GestureHandlerRootView } from "react-native-gesture-handler";
import { supabase, API_URL, getAuthHeaders } from "../lib/supabase";
import StudBackground from "../components/StudBackground";
import { CollectionSkeleton } from "../components/Skeleton";

const C = {
  card: "#ffffff",
  cardBorder: "#f0dede",
  heading: "#2d0808",
  subtext: "#7a5050",
  red: "#cc1010",
  redShadow: "#8b0000",
  green: "#16a34a",
  dim: "#b08080",
};

const F = {
  brand: "SpaceGrotesk_700Bold",
  heading: "SpaceGrotesk_700Bold",
  semibold: "SpaceGrotesk_600SemiBold",
  body: "DMSans_400Regular",
  bodyMedium: "DMSans_500Medium",
  bodySemibold: "DMSans_600SemiBold",
  bodyBold: "DMSans_700Bold",
};

interface LegoSet {
  setNumber: number;
  name: string;
  imgUrl?: string;
  currentPrice?: number;
  year?: number;
}

function SetRow({
  item,
  index,
  onDelete,
}: {
  item: LegoSet;
  index: number;
  onDelete: (setNumber: number, name: string) => void;
}) {
  const swipeRef = useRef<Swipeable>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 280,
      delay: index * 45,
      useNativeDriver: true,
    }).start();
  }, []);

  const renderRightActions = (progress: Animated.AnimatedInterpolation<number>) => {
    const translateX = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [80, 0],
    });
    return (
      <Animated.View style={[styles.deleteAction, { transform: [{ translateX }] }]}>
        <Pressable
          style={styles.deleteActionInner}
          onPress={() => {
            swipeRef.current?.close();
            onDelete(item.setNumber, item.name);
          }}
        >
          <Text style={styles.deleteActionText}>Delete</Text>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
      }}
    >
      <Swipeable ref={swipeRef} renderRightActions={renderRightActions} overshootRight={false}>
        <View style={styles.card}>
          {/* Dark stud image area */}
          <View style={styles.cardImageBg}>
            {item.imgUrl ? (
              <Image
                source={{ uri: item.imgUrl }}
                style={styles.cardImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.cardImagePlaceholder} />
            )}
          </View>
          {/* Info */}
          <View style={styles.cardInfo}>
            <View style={styles.cardMetaRow}>
              <Text style={styles.cardNumber}>#{item.setNumber}</Text>
              {item.year != null && <Text style={styles.cardYear}>{item.year}</Text>}
            </View>
            <Text style={styles.cardName} numberOfLines={2}>{item.name}</Text>
            {item.currentPrice != null && (
              <View style={styles.priceBadge}>
                <Text style={styles.priceText}>${item.currentPrice.toFixed(2)}</Text>
              </View>
            )}
          </View>
        </View>
      </Swipeable>
    </Animated.View>
  );
}

export default function CollectionScreen() {
  const insets = useSafeAreaInsets();
  const [sets, setSets] = useState<LegoSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [initials, setInitials] = useState("?");

  useFocusEffect(
    useCallback(() => {
      fetchSets();
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (!user) return;
        const email = user.email ?? "";
        setInitials(email[0]?.toUpperCase() ?? "?");
        setAvatarUrl(user.user_metadata?.avatar_url ?? null);
      });
    }, [])
  );

  const fetchSets = async () => {
    const headers = await getAuthHeaders();
    if (!headers) return;
    try {
      const response = await fetch(`${API_URL}/api/sets`, { method: "GET", headers });
      if (response.ok) {
        const data = await response.json();
        setSets(data.sets || []);
      } else if (response.status === 401) {
        Alert.alert("Session Expired", "Please sign in again.");
        await supabase.auth.signOut();
      }
    } catch {
      Alert.alert("Error", "Failed to connect to API.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchSets();
  }, []);

  const deleteSet = async (setNumber: number, setName: string) => {
    Alert.alert(
      "Remove Set",
      `Remove "${setName}" from your vault?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            const headers = await getAuthHeaders();
            if (!headers) return;
            try {
              const response = await fetch(`${API_URL}/api/sets?set_number=${setNumber}`, {
                method: "DELETE",
                headers,
              });
              if (response.ok) {
                fetchSets();
              } else {
                const data = await response.json();
                Alert.alert("Error", data.message || "Failed to remove set.");
              }
            } catch {
              Alert.alert("Error", "Failed to connect to API.");
            }
          },
        },
      ]
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <StudBackground />
      {/* Frosted overlay so content is readable over the brick background */}
      <View style={styles.frostedOverlay} pointerEvents="none" />
      {/* Solid strip behind the status bar so system icons are always legible */}
      <View style={[styles.statusBarBg, { height: insets.top }]} pointerEvents="none" />
      <SafeAreaView style={styles.safe} edges={["top"]}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>YOUR{"\n"}VAULT</Text>
            <Text style={styles.headerSub}>Track and manage{"\n"}your LEGO sets</Text>
          </View>
          <View style={styles.headerRight}>
            <Pressable style={styles.avatarBtn} onPress={() => router.push("/profile")}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitials}>{initials}</Text>
                </View>
              )}
            </Pressable>
            <Text style={styles.brandLabel}>BuildaVault</Text>
            {!loading && sets.length > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{sets.length} sets</Text>
              </View>
            )}
          </View>
        </View>

        {/* List */}
        <FlatList
          data={sets}
          keyExtractor={(item) => String(item.setNumber)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={C.red}
              colors={[C.red]}
            />
          }
          ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
          renderItem={({ item, index }) => (
            <SetRow item={item} index={index} onDelete={deleteSet} />
          )}
          ListHeaderComponent={loading ? <CollectionSkeleton /> : null}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>Vault is empty</Text>
                <Text style={styles.emptySub}>
                  Tap Scan Barcode below to add your first LEGO set
                </Text>
              </View>
            ) : null
          }
        />

        {/* FAB background strip */}
        <View style={[styles.fabBg, { height: 85 + insets.bottom }]} pointerEvents="none" />

        {/* FAB */}
        <Pressable
          style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
          onPress={() => router.push("/scanner")}
        >
          <Text style={styles.fabLabel}>Scan Barcode</Text>
        </Pressable>

      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "transparent",
  },
  frostedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(252, 232, 232, 0.68)",
  },
  statusBarBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(252, 232, 232, 0.97)",
    zIndex: 10,
  },

  /* Header */
  header: {
    backgroundColor: "rgba(252, 232, 232, 0.85)",
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(224, 180, 180, 0.4)",
    flexDirection: "row",
    alignItems: "center",
  },
  headerLeft: {
    flex: 1,
    paddingRight: 16,
    justifyContent: "center",
  },
  headerRight: {
    alignItems: "center",
    gap: 6,
  },
  avatarBtn: {},
  avatarImg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2.5,
    borderColor: C.cardBorder,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#1a0404",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
    borderColor: C.cardBorder,
  },
  avatarInitials: {
    fontFamily: F.heading,
    fontSize: 24,
    color: C.red,
  },
  brandLabel: {
    fontFamily: F.brand,
    fontSize: 13,
    letterSpacing: -0.3,
    color: C.red,
  },
  headerTitle: {
    fontFamily: F.heading,
    fontSize: 42,
    color: "#2d0808",
    letterSpacing: -1.5,
    lineHeight: 42,
  },
  headerSub: {
    fontFamily: F.body,
    fontSize: 13,
    color: "#7a5050",
    marginTop: 8,
    lineHeight: 18,
  },
  countBadge: {
    backgroundColor: C.red,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    shadowColor: C.redShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 0,
    elevation: 2,
  },
  countBadgeText: {
    fontFamily: F.semibold,
    fontSize: 11,
    color: "#fff",
  },

  /* List */
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 130,
  },

  /* Card — full-width row matching web SetCard theme */
  card: {
    backgroundColor: C.card,
    borderRadius: 20,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.cardBorder,
    shadowColor: "#2d0808",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardImageBg: {
    backgroundColor: "#1a0404",
    width: 90,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
  },
  cardImage: {
    width: 68,
    height: 68,
  },
  cardImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: "#2d0808",
    borderWidth: 1,
    borderColor: "#3d1010",
  },
  cardInfo: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 4,
  },
  cardMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardNumber: {
    fontFamily: F.semibold,
    fontSize: 12,
    color: C.red,
    letterSpacing: 0.5,
  },
  cardYear: {
    fontFamily: F.bodySemibold,
    fontSize: 11,
    color: C.dim,
  },
  cardName: {
    fontFamily: F.bodySemibold,
    fontSize: 15,
    color: C.heading,
    lineHeight: 20,
  },
  priceBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#fce8e8",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 6,
  },
  priceText: {
    fontFamily: F.heading,
    fontSize: 13,
    color: C.red,
    fontWeight: "700",
  },

  /* Delete swipe action */
  deleteAction: {
    width: 80,
    borderRadius: 20,
    overflow: "hidden",
  },
  deleteActionInner: {
    flex: 1,
    backgroundColor: C.red,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    marginLeft: 8,
  },
  deleteActionText: {
    fontFamily: F.semibold,
    color: "#fff",
    fontSize: 13,
  },

  /* Empty state */
  emptyState: {
    alignItems: "center",
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontFamily: F.heading,
    fontSize: 20,
    color: "#2d0808",
    marginBottom: 10,
  },
  emptySub: {
    fontFamily: F.body,
    fontSize: 14,
    color: "#7a5050",
    textAlign: "center",
    lineHeight: 22,
  },

  /* FAB background bar */
  fabBg: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(252, 232, 232, 0.97)",
    borderTopWidth: 1,
    borderTopColor: "rgba(224, 180, 180, 0.4)",
  },

  /* FAB */
  fab: {
    position: "absolute",
    bottom: 32,
    alignSelf: "center",
    backgroundColor: C.red,
    paddingVertical: 16,
    paddingHorizontal: 36,
    borderRadius: 50,
    shadowColor: C.redShadow,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.55,
    shadowRadius: 0,
    elevation: 6,
  },
  fabPressed: {
    opacity: 0.88,
    shadowOffset: { width: 0, height: 2 },
  },
  fabLabel: {
    fontFamily: F.heading,
    color: "#fff",
    fontSize: 17,
    letterSpacing: 0.2,
  },
});
