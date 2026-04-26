import { useEffect, useRef } from "react";
import { Animated, View, StyleSheet } from "react-native";

const BONE_BG = "rgba(45,8,8,0.1)";
const STUD_BG = "rgba(204,16,16,0.25)";

function usePulse(delay = 0) {
  const anim = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.85, duration: 800, delay, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);
  return anim;
}

function SkeletonRow({ delay }: { delay: number }) {
  const opacity = usePulse(delay);
  return (
    <Animated.View style={[styles.row, { opacity }]}>
      <View style={styles.stud} />
      <View style={styles.body}>
        <View style={styles.number} />
        <View style={styles.name} />
      </View>
    </Animated.View>
  );
}

export function CollectionSkeleton({ count = 7 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={{ marginBottom: 10 }}>
          <SkeletonRow delay={i * 80} />
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(45,8,8,0.07)",
  },
  stud: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: STUD_BG,
    marginRight: 14,
    flexShrink: 0,
  },
  body: {
    flex: 1,
    gap: 8,
  },
  number: {
    height: 10,
    width: 52,
    borderRadius: 4,
    backgroundColor: BONE_BG,
  },
  name: {
    height: 14,
    width: "72%",
    borderRadius: 4,
    backgroundColor: BONE_BG,
  },
});
