import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  Alert,
  RefreshControl,
  StyleSheet,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Swipeable, GestureHandlerRootView } from "react-native-gesture-handler";
import { supabase, API_URL } from "../lib/supabase";

interface LegoSet {
  set_number: number;
  name: string;
}

export default function CollectionScreen() {
  const [sets, setSets] = useState<LegoSet[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    fetchSets();
  }, []);

  // Get the current auth token
  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    };
  };

  // Fetch all LEGO sets from the API
  const fetchSets = async () => {
    const headers = await getAuthHeaders();
    if (!headers) return;

    try {
      const response = await fetch(`${API_URL}/sets`, {
        method: "GET",
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        setSets(data.sets || []);
      } else if (response.status === 401) {
        Alert.alert("Session Expired", "Please sign in again");
        await supabase.auth.signOut();
      }
    } catch (error) {
      console.error("Error fetching sets:", error);
      Alert.alert("Error", "Failed to connect to API");
    } finally {
      setIsRefreshing(false);
    }
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchSets();
  };

  // Delete a single set
  const deleteSet = async (setNumber: number, setName: string) => {
    Alert.alert(
      "Delete Set",
      `Are you sure you want to remove "${setName}" from your collection?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const headers = await getAuthHeaders();
            if (!headers) return;

            try {
              const response = await fetch(
                `${API_URL}/sets?set_number=${setNumber}`,
                { method: "DELETE", headers }
              );

              if (response.ok) {
                fetchSets();
              } else {
                const data = await response.json();
                Alert.alert("Error", data.detail || "Failed to delete set");
              }
            } catch (error) {
              console.error("Error deleting set:", error);
              Alert.alert("Error", "Failed to connect to API");
            }
          },
        },
      ]
    );
  };

  // Delete all sets
  const deleteAllSets = async () => {
    Alert.alert(
      "Delete All Sets",
      "Are you sure you want to delete your ENTIRE collection? This cannot be undone!",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete All",
          style: "destructive",
          onPress: async () => {
            const headers = await getAuthHeaders();
            if (!headers) return;

            try {
              const response = await fetch(`${API_URL}/delete_sets`, {
                method: "DELETE",
                headers,
              });

              if (response.ok) {
                Alert.alert("Success", "All sets deleted from collection");
                fetchSets();
              } else {
                const data = await response.json();
                Alert.alert("Error", data.detail || "Failed to delete all sets");
              }
            } catch (error) {
              console.error("Error deleting all sets:", error);
              Alert.alert("Error", "Failed to connect to API");
            }
          },
        },
      ]
    );
  };

  const handleSignOut = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await supabase.auth.signOut();
        },
      },
    ]);
  };

  // Render the delete action when swiping
  const renderRightActions = useCallback(
    (
      _progress: Animated.AnimatedInterpolation<number>,
      dragX: Animated.AnimatedInterpolation<number>,
      item: LegoSet
    ) => {
      const trans = dragX.interpolate({
        inputRange: [-80, 0],
        outputRange: [0, 80],
        extrapolate: "clamp",
      });

      return (
        <Animated.View
          style={[styles.deleteAction, { transform: [{ translateX: trans }] }]}
        >
          <Pressable
            style={styles.deleteActionButton}
            onPress={() => deleteSet(item.set_number, item.name)}
          >
            <Text style={styles.deleteActionText}>Delete</Text>
          </Pressable>
        </Animated.View>
      );
    },
    []
  );

  const renderSet = ({ item }: { item: LegoSet }) => (
    <Swipeable
      renderRightActions={(progress, dragX) =>
        renderRightActions(progress, dragX, item)
      }
      overshootRight={false}
    >
      <View style={styles.setItem}>
        <View style={styles.setInfo}>
          <Text style={styles.setNumber}>#{item.set_number}</Text>
          <Text style={styles.setName}>{item.name}</Text>
        </View>
      </View>
    </Swipeable>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>My LEGO Collection</Text>
          <Pressable onPress={() => setShowSettings(true)}>
            <Text style={styles.settingsIcon}>⚙️</Text>
          </Pressable>
        </View>

        {/* Status bar */}
        <View style={styles.statusBar}>
          <Text style={styles.countText}>
            {sets.length} {sets.length === 1 ? "set" : "sets"}
          </Text>
        </View>

        {/* Collection list */}
        {sets.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No Sets Yet</Text>
            <Text style={styles.emptyMessage}>
              Start building your collection by scanning LEGO set barcodes!
            </Text>
          </View>
        ) : (
          <FlatList
            data={sets}
            renderItem={renderSet}
            keyExtractor={(item) => item.set_number.toString()}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
            }
          />
        )}

        {/* Add button */}
        <Pressable
          style={styles.addButton}
          onPress={() => router.push("/scanner")}
        >
          <Text style={styles.addButtonText}>+ Add Set</Text>
        </Pressable>

        {/* Settings Modal */}
        {showSettings && (
          <View style={styles.settingsOverlay}>
            <View style={styles.settingsModal}>
              <Text style={styles.settingsTitle}>Settings</Text>

              {/* Delete all sets section */}
              {sets.length > 0 && (
                <View style={styles.dangerZone}>
                  <Text style={styles.dangerZoneTitle}>Danger Zone</Text>
                  <Pressable
                    style={styles.deleteAllButton}
                    onPress={() => {
                      setShowSettings(false);
                      deleteAllSets();
                    }}
                  >
                    <Text style={styles.deleteAllButtonText}>
                      Delete All Sets
                    </Text>
                  </Pressable>
                </View>
              )}

              <View style={styles.modalButtons}>
                <Pressable
                  style={[styles.modalButton, styles.signOutButton]}
                  onPress={() => {
                    setShowSettings(false);
                    handleSignOut();
                  }}
                >
                  <Text style={styles.modalButtonText}>Sign Out</Text>
                </Pressable>

                <Pressable
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowSettings(false)}
                >
                  <Text style={styles.modalButtonText}>Close</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
  },
  settingsIcon: {
    fontSize: 24,
  },
  statusBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  countText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "600",
  },
  listContent: {
    padding: 16,
  },
  setItem: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  setInfo: {
    flex: 1,
  },
  setNumber: {
    fontSize: 14,
    fontWeight: "700",
    color: "#007AFF",
    marginBottom: 4,
  },
  setName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  deleteAction: {
    backgroundColor: "#E53E3E",
    justifyContent: "center",
    alignItems: "flex-end",
    borderRadius: 12,
    marginBottom: 12,
  },
  deleteActionButton: {
    width: 80,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteActionText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
  },
  addButton: {
    position: "absolute",
    bottom: 30,
    right: 20,
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  addButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
  },
  settingsOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  settingsModal: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    width: "85%",
    maxWidth: 400,
  },
  settingsTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 20,
    color: "#333",
  },
  modalButtons: {
    gap: 12,
  },
  modalButton: {
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  signOutButton: {
    backgroundColor: "#E53E3E",
  },
  cancelButton: {
    backgroundColor: "#8E8E93",
  },
  modalButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  dangerZone: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: "#FFF5F5",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FED7D7",
  },
  dangerZoneTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#C53030",
    marginBottom: 12,
  },
  deleteAllButton: {
    backgroundColor: "#E53E3E",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  deleteAllButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
});
