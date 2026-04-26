import { View, StyleSheet, useWindowDimensions, Animated, Easing } from "react-native";
import { useMemo, useRef, useEffect } from "react";

const G = 48;
const DOT_R = 9;
const PAD = 3;
const RX = 5;
const STUD_R = 8;

const BRICK_COLORS = [
  "#c62828", "#1565c0", "#ffd600", "#2e7d32",
  "#6a1b9a", "#00838f", "#558b2f", "#1976d2", "#f9a825", "#ad1457",
];

const SIZES = [[1,1],[2,1],[1,2],[2,2],[3,1],[4,1],[2,1],[1,1],[2,2],[3,2]];


function luma(hex: string) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return 0.299*r + 0.587*g + 0.114*b;
}

function lcg(seed: number) {
  let s = seed & 0x7fffffff;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function buildBricks(cols: number, rows: number) {
  const rng = lcg(0xc0ffee);
  const grid = Array.from({ length: rows }, () => new Uint8Array(cols));
  const out: { c: number; r: number; w: number; h: number; color: string }[] = [];
  let ci = 0;
  for (let attempt = 0; attempt < 500 && out.length < 70; attempt++) {
    const [w, h] = SIZES[Math.floor(rng() * SIZES.length)];
    const maxC = Math.max(1, cols - w);
    const maxR = Math.max(1, rows - h);
    const c = Math.floor(rng() * maxC);
    const r = Math.floor(rng() * maxR);
    let ok = true;
    outer: for (let dr = 0; dr < h; dr++)
      for (let dc = 0; dc < w; dc++)
        if (grid[r + dr]?.[c + dc]) { ok = false; break outer; }
    if (ok) {
      out.push({ c, r, w, h, color: BRICK_COLORS[ci % BRICK_COLORS.length] });
      ci++;
      for (let dr = 0; dr < h; dr++)
        for (let dc = 0; dc < w; dc++)
          if (grid[r + dr]) grid[r + dr][c + dc] = 1;
    }
  }
  return out;
}

function Brick({ c, r, w, h, color }: { c: number; r: number; w: number; h: number; color: string }) {
  const bw = w * G - PAD * 2;
  const bh = h * G - PAD * 2;
  const studColor = luma(color) > 140 ? "rgba(0,0,0,0.22)" : "rgba(255,255,255,0.45)";
  const studs = [];
  for (let row = 0; row < h; row++)
    for (let col = 0; col < w; col++)
      studs.push(
        <View
          key={`${row}-${col}`}
          style={{
            position: "absolute",
            left: col * G + G / 2 - STUD_R - PAD,
            top: row * G + G / 2 - STUD_R - PAD,
            width: STUD_R * 2,
            height: STUD_R * 2,
            borderRadius: STUD_R,
            borderWidth: 2.5,
            borderColor: studColor,
          }}
        />
      );
  return (
    <View style={{ position: "absolute", left: c * G, top: r * G, width: w * G, height: h * G }}>
      <View style={{ position: "absolute", top: PAD + 2, left: PAD + 2, width: bw, height: bh, borderRadius: RX, backgroundColor: "rgba(0,0,0,0.18)" }} />
      <View style={{ position: "absolute", top: PAD, left: PAD, width: bw, height: bh, borderRadius: RX, backgroundColor: color }}>
        {studs}
      </View>
    </View>
  );
}

export default function StudBackground({ animate = false }: { animate?: boolean }) {
  const { width, height } = useWindowDimensions();
  const cols = Math.ceil(width / G) + 1;
  const rows = Math.ceil(height / G) + 2;

  const bricks = useMemo(() => buildBricks(cols, rows), [cols, rows]);

  // Start off-screen when animating, otherwise render already in place
  const animsRef = useRef<Animated.Value[]>([]);
  if (animsRef.current.length !== bricks.length) {
    const startY = animate ? -(height * 2) : 0;
    animsRef.current = bricks.map(() => new Animated.Value(startY));
  }
  const anims = animsRef.current;

  useEffect(() => {
    if (!animate) return;

    // Stagger bricks by row (top rows land first), matching web behaviour
    Animated.parallel(
      bricks.map((brick, i) => {
        const delay = brick.r * 40 + Math.random() * 180;
        return Animated.sequence([
          Animated.delay(delay),
          // Drop and overshoot slightly (bounce)
          Animated.timing(anims[i], {
            toValue: 10,
            duration: 460,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          // Settle back to rest
          Animated.timing(anims[i], {
            toValue: 0,
            duration: 100,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]);
      })
    ).start();
  }, []);

  return (
    <View style={[StyleSheet.absoluteFill, styles.bg]} pointerEvents="none">
      {/* Dot grid — static, never animates */}
      <View style={[StyleSheet.absoluteFill, styles.dotGrid]}>
        {Array.from({ length: rows }).map((_, ri) => (
          <View key={ri} style={styles.dotRow}>
            {Array.from({ length: cols }).map((_, ci) => (
              <View key={ci} style={styles.dot} />
            ))}
          </View>
        ))}
      </View>

      {/* Falling bricks */}
      <View style={StyleSheet.absoluteFill}>
        {bricks.map((b, i) => (
          <Animated.View
            key={i}
            style={{ transform: [{ translateY: anims[i] }] }}
          >
            <Brick {...b} />
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: {
    backgroundColor: "#fce8e8",
  },
  dotGrid: {
    paddingTop: G / 2 - DOT_R,
    paddingLeft: G / 2 - DOT_R,
  },
  dotRow: {
    flexDirection: "row",
    marginBottom: G - DOT_R * 2,
  },
  dot: {
    width: DOT_R * 2,
    height: DOT_R * 2,
    borderRadius: DOT_R,
    backgroundColor: "#e4b8b8",
    marginRight: G - DOT_R * 2,
  },
});
