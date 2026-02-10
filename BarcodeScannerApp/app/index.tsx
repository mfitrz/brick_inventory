import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  TextInput,
  Alert,
  RefreshControl,
  StyleSheet,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Swipeable, GestureHandlerRootView } from "react-native-gesture-handler";

interface LegoSet {
  set_number: number;
  name: string;
}

export default function CollectionScreen() {
  const [sets, setSets] = useState<LegoSet[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // API connection state
  const [apiUrl, setApiUrl] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    loadApiUrl();
  }, []);

  // Load saved API URL and fetch sets
  const loadApiUrl = async () => {
    try {
      const saved = await AsyncStorage.getItem("apiUrl");
      if (saved) {
        setApiUrl(saved);
        await fetchSets(saved);
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
      await fetchSets(url);
      setShowSettings(false);
    } catch (error) {
      console.error("Failed to save API URL:", error);
    }
  };

  // Fetch all LEGO sets from the API
  const fetchSets = async (url: string) => {
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
        const data = await response.json();
        setSets(data.sets || []);
        setIsConnected(true);
      } else {
        setIsConnected(false);
        Alert.alert("Connection Failed", "Could not fetch your collection");
      }
    } catch (error) {
      console.error("Error fetching sets:", error);
      setIsConnected(false);
      Alert.alert("Error", "Failed to connect to inventory API");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Refresh the collection
  const onRefresh = () => {
    setIsRefreshing(true);
    fetchSets(apiUrl);
  };

  // Delete a single set
  const deleteSet = async (setNumber: number, setName: string) => {
    if (!apiUrl) {
      Alert.alert("Error", "No API connection");
      return;
    }

    Alert.alert(
      "Delete Set",
      `Are you sure you want to remove "${setName}" from your collection?`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch(
                `${apiUrl}/sets?set_number=${setNumber}`,
                {
                  method: "DELETE",
                }
              );

              if (response.ok) {
                Alert.alert("Success", "Set removed from collection");
                fetchSets(apiUrl); // Refresh the list
              } else {
                const data = await response.json();
                Alert.alert("Error", data.detail || "Failed to delete set");
              }
            } catch (error) {
              console.error("Error deleting set:", error);
              Alert.alert("Error", "Failed to connect to API");
            }
          }
        }
      ]
    );
  };

  // Delete all sets
  const deleteAllSets = async () => {
    if (!apiUrl) {
      Alert.alert("Error", "No API connection");
      return;
    }

    Alert.alert(
      "Delete All Sets",
      "Are you sure you want to delete your ENTIRE collection? This cannot be undone!",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete All",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch(`${apiUrl}/delete_sets`, {
                method: "DELETE",
              });

              if (response.ok) {
                Alert.alert("Success", "All sets deleted from collection");
                fetchSets(apiUrl); // Refresh the list
              } else {
                const data = await response.json();
                Alert.alert("Error", data.detail || "Failed to delete all sets");
              }
            } catch (error) {
              console.error("Error deleting all sets:", error);
              Alert.alert("Error", "Failed to connect to API");
            }
          }
        }
      ]
    );
  };

  // Render the delete action when swiping
  const renderRightActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>,
    item: LegoSet
  ) => {
    const trans = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [0, 80],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View
        style={[
          styles.deleteAction,
          {
            transform: [{ translateX: trans }],
          },
        ]}
      >
        <Pressable
          style={styles.deleteActionButton}
          onPress={() => deleteSet(item.set_number, item.name)}
        >
          <Text style={styles.deleteActionText}>Delete</Text>
        </Pressable>
      </Animated.View>
    );
  };

  // Render each LEGO set item
  const renderSet = ({ item }: { item: LegoSet }) => (
    <Swipeable
      renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, item)}
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

      {/* Connection status */}
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>
          {isConnected ? "🟢 Connected" : "🔴 Not Connected"}
        </Text>
        <Text style={styles.countText}>
          {sets.length} {sets.length === 1 ? "set" : "sets"}
        </Text>
      </View>

      {/* Collection list */}
      {!apiUrl || !isConnected ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No API Connection</Text>
          <Text style={styles.emptyMessage}>
            Please configure your API connection to view your collection.
          </Text>
          <Pressable style={styles.settingsButton} onPress={() => setShowSettings(true)}>
            <Text style={styles.settingsButtonText}>Configure API</Text>
          </Pressable>
        </View>
      ) : sets.length === 0 ? (
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
            <Text style={styles.settingsTitle}>API Settings</Text>

            <Text style={styles.label}>
              LEGO Inventory API URL (e.g., http://192.168.1.100:8000)
            </Text>
            <TextInput
              style={styles.input}
              value={apiUrl}
              onChangeText={setApiUrl}
              placeholder="http://192.168.1.100:8000"
              placeholderTextColor="#999"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />

            <Text style={styles.hint}>
              💡 Find your computer's IP address:{"\n"}
              • Mac/Linux: Run `ifconfig` or `ip addr`{"\n"}
              • Windows: Run `ipconfig`{"\n"}
              • Look for IP starting with 192.168.x.x or 10.0.x.x
            </Text>

            {/* Delete all sets section */}
            {sets.length > 0 && (
              <View style={styles.dangerZone}>
                <Text style={styles.dangerZoneTitle}>⚠️ Danger Zone</Text>
                <Pressable
                  style={styles.deleteAllButton}
                  onPress={() => {
                    setShowSettings(false);
                    deleteAllSets();
                  }}
                >
                  <Text style={styles.deleteAllButtonText}>Delete All Sets</Text>
                </Pressable>
              </View>
            )}

            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.saveButton]}
                onPress={() => saveApiUrl(apiUrl)}
              >
                <Text style={styles.modalButtonText}>Save & Connect</Text>
              </Pressable>

              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowSettings(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
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
  settingsButton: {
    marginTop: 20,
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  settingsButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
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
  label: {
    fontSize: 14,
    fontWeight: "600",
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
    marginBottom: 20,
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 8,
  },
  modalButtons: {
    gap: 12,
  },
  modalButton: {
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButton: {
    backgroundColor: "#34C759",
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
    marginTop: 8,
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
