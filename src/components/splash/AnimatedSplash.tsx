import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, StatusBar, StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { ClipPath, Defs, G, Line, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import * as SplashScreen from 'expo-splash-screen';

import {
  DIAMOND_PATH,
  DOT,
  RING_LENGTH,
  RING_PATH,
  TAIL,
  TAIL_LENGTH,
  WORDMARK_GLYPHS,
  WORDMARK_TRANSFORM,
  WORDMARK_VIEWBOX,
} from './logoPaths';

// Palet versi "on dark" dari logo resmi (cassier-q-logo-vertical-ondark.svg).
const NAVY = '#0B1F33';
const RING_STOPS = ['#3D7BFF', '#5B8CFF', '#22B888'] as const;
const DIAMOND_STOPS = ['#3D7BFF', '#8FD4B8'] as const;
const EMERALD = '#22B888';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedLine = Animated.createAnimatedComponent(Line);
const AnimatedRect = Animated.createAnimatedComponent(Rect);

// Satu sumber waktu (ms) untuk seluruh koreografi — gampang disetel ulang.
const T = {
  ringStart: 150,
  ringDuration: 900,
  diamond: 600,
  tailStart: 900,
  tailDuration: 280,
  dot: 1130,
  shimmer: 1250,
  wordmark: 1150,
  glyphStep: 55,
  heavyDone: 2000,
  tagline: 1750,
  introEnd: 2250,
  exit: 520,
} as const;

export interface AnimatedSplashProps {
  /** true setelah font, SSL pinning, dan cek sesi login selesai — baru boleh keluar. */
  ready: boolean;
  /** Font Inter sudah dimuat (dipakai tagline); sebelum itu pakai font sistem. */
  fontsLoaded: boolean;
  /** 0→1 saat splash keluar; dipakai App untuk "mengangkat" layar di belakangnya. */
  reveal: Animated.Value;
  /**
   * Dipanggil saat bagian animasi yang digerakkan JS (garis tergambar, huruf
   * menyala) selesai — App menunda memasang layar berat sampai titik ini
   * supaya animasi tidak tersendat.
   */
  onHeavyPhaseDone: () => void;
  onFinish: () => void;
}

/**
 * Splash screen beranimasi: logo cassier-Q "dirakit" bagian demi bagian di
 * atas latar navy, lalu zoom-out masuk ke aplikasi. Splash native (warna navy
 * polos, lihat app.config) ditahan sampai frame pertama komponen ini tampil,
 * jadi transisinya tanpa kedipan.
 */
export function AnimatedSplash({ ready, fontsLoaded, reveal, onHeavyPhaseDone, onFinish }: AnimatedSplashProps) {
  const { width, height } = useWindowDimensions();
  const symbolSize = Math.round(Math.max(112, Math.min(168, Math.min(width, height) * 0.3)));
  const k = symbolSize / 200;

  const [introDone, setIntroDone] = useState(false);
  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null);
  const exiting = useRef(false);

  // --- nilai animasi -------------------------------------------------------
  const glow = useRef(new Animated.Value(0)).current;
  const symbolIn = useRef(new Animated.Value(0)).current;
  const ring = useRef(new Animated.Value(0)).current;
  const diamond = useRef(new Animated.Value(0)).current;
  const tail = useRef(new Animated.Value(0)).current;
  const dot = useRef(new Animated.Value(0)).current;
  const ripple = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;
  const wordmark = useRef(new Animated.Value(0)).current;
  const glyphs = useRef(WORDMARK_GLYPHS.map(() => new Animated.Value(0))).current;
  const tagline = useRef(new Animated.Value(0)).current;
  const halo = useRef(new Animated.Value(0)).current;
  const exit = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setReduceMotion)
      .catch(() => setReduceMotion(false));
  }, []);

  // --- intro ----------------------------------------------------------------
  useEffect(() => {
    if (reduceMotion === null) return;
    if (reduceMotion) {
      // Tanpa gerak: tampilkan logo utuh, cukup fade.
      [glow, symbolIn, ring, diamond, tail, dot, wordmark, tagline, ...glyphs].forEach((v) => v.setValue(1));
      setIntroDone(true);
      onHeavyPhaseDone();
      return;
    }

    const timing = (value: Animated.Value, delay: number, duration: number, easing = Easing.out(Easing.cubic), native = true) =>
      Animated.timing(value, { toValue: 1, delay, duration, easing, useNativeDriver: native });

    const intro = Animated.parallel([
      timing(glow, 0, 1400),
      timing(symbolIn, 0, 1100),
      // stroke-dashoffset bukan properti transform → JS driver.
      timing(ring, T.ringStart, T.ringDuration, Easing.inOut(Easing.cubic), false),
      Animated.sequence([
        Animated.delay(T.diamond),
        Animated.spring(diamond, { toValue: 1, speed: 9, bounciness: 9, useNativeDriver: true }),
      ]),
      timing(tail, T.tailStart, T.tailDuration, Easing.out(Easing.quad), false),
      Animated.sequence([
        Animated.delay(T.dot),
        Animated.spring(dot, { toValue: 1, speed: 14, bounciness: 14, useNativeDriver: true }),
      ]),
      timing(ripple, T.dot + 50, 750, Easing.out(Easing.quad)),
      timing(halo, T.dot, 900),
      timing(shimmer, T.shimmer, 750, Easing.inOut(Easing.quad), false),
      timing(wordmark, T.wordmark, 520),
      ...glyphs.map((g, i) => timing(g, T.wordmark + 50 + i * T.glyphStep, 320, Easing.out(Easing.quad), false)),
      timing(tagline, T.tagline, 500),
    ]);
    intro.start();
    const heavyTimer = setTimeout(onHeavyPhaseDone, T.heavyDone);
    const doneTimer = setTimeout(() => setIntroDone(true), T.introEnd);
    return () => {
      intro.stop();
      clearTimeout(heavyTimer);
      clearTimeout(doneTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion]);

  // --- keluar ---------------------------------------------------------------
  const startExit = () => {
    if (exiting.current) return;
    exiting.current = true;
    Animated.parallel([
      Animated.timing(exit, {
        toValue: 1,
        duration: T.exit + 120,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(reveal, {
        toValue: 1,
        duration: T.exit + 180,
        delay: 80,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => onFinish());
  };

  useEffect(() => {
    if (ready && introDone) startExit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, introDone]);

  // Ketuk untuk melewati animasi (hanya kalau app memang sudah siap).
  const onSkip = () => {
    if (ready) startExit();
  };

  // --- interpolasi ----------------------------------------------------------
  const ringOffset = ring.interpolate({ inputRange: [0, 1], outputRange: [RING_LENGTH, 0] });
  const tailOffset = tail.interpolate({ inputRange: [0, 1], outputRange: [TAIL_LENGTH, 0] });
  const shimmerX = shimmer.interpolate({ inputRange: [0, 1], outputRange: [-120, 260] });

  // Keluar dua tahap supaya tidak ada "hantu" logo di atas layar app:
  // logo zoom + hilang dulu (0–35%), baru latar navy memudar (40–100%).
  const logoExitStyle = {
    opacity: exit.interpolate({ inputRange: [0, 0.35, 1], outputRange: [1, 0, 0] }),
    transform: [{ scale: exit.interpolate({ inputRange: [0, 0.35, 1], outputRange: [1, 1.18, 1.18] }) }],
  };
  const backdropExitStyle = { opacity: exit.interpolate({ inputRange: [0, 0.4, 1], outputRange: [1, 1, 0] }) };
  // Ujung garis bulat tetap menggambar titik walau panjangnya 0 — sembunyikan sampai mulai.
  const ringVisible = ring.interpolate({ inputRange: [0, 0.01, 1], outputRange: [0, 1, 1] });
  const tailVisible = tail.interpolate({ inputRange: [0, 0.02, 1], outputRange: [0, 1, 1] });

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, styles.root, backdropExitStyle]}
      pointerEvents={exiting.current ? 'none' : 'auto'}
      // Frame pertama sudah tergambar → splash native navy boleh diturunkan.
      onLayout={() => SplashScreen.hideAsync().catch(() => {})}
    >
      <StatusBar barStyle="light-content" />
      <Pressable style={StyleSheet.absoluteFill} onPress={onSkip} accessibilityLabel="Lewati animasi pembuka">
        {/* Cahaya latar: biru kiri-atas, emerald kanan-bawah — kedalaman tanpa mengganggu logo. */}
        <Animated.View
          style={[
            styles.glow,
            {
              width: width * 1.4,
              height: width * 1.4,
              left: -width * 0.55,
              top: -width * 0.6,
              opacity: glow,
              transform: [{ scale: glow.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }],
            },
          ]}
        >
          <RadialGlow color="#2563EB" opacity={0.42} />
        </Animated.View>
        <Animated.View
          style={[
            styles.glow,
            {
              width: width * 1.3,
              height: width * 1.3,
              right: -width * 0.6,
              bottom: -width * 0.55,
              opacity: glow,
              transform: [{ scale: glow.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1] }) }],
            },
          ]}
        >
          <RadialGlow color="#10B981" opacity={0.26} />
        </Animated.View>

        <View style={styles.center} pointerEvents="none">
          <Animated.View style={[styles.logoBlock, logoExitStyle]}>
            {/* Halo lembut di belakang simbol, menyala saat logo selesai dirakit. */}
            <Animated.View
              style={[
                styles.halo,
                {
                  width: symbolSize * 2.2,
                  height: symbolSize * 2.2,
                  marginTop: -symbolSize * 0.6,
                  opacity: halo.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 1, 0.75] }),
                  transform: [{ scale: halo.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }],
                },
              ]}
            >
              <RadialGlow color="#3D7BFF" opacity={0.35} />
            </Animated.View>

            <Animated.View
              style={{
                width: symbolSize,
                height: symbolSize,
                opacity: symbolIn.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] }),
                transform: [{ scale: symbolIn.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1] }) }],
              }}
            >
              {/* 1. Cincin heksagon "tergambar" mengikuti garisnya. */}
              <Svg style={StyleSheet.absoluteFill} viewBox="0 0 200 200">
                <Defs>
                  <LinearGradient id="splashRing" x1="20" y1="10" x2="180" y2="190" gradientUnits="userSpaceOnUse">
                    <Stop offset="0%" stopColor={RING_STOPS[0]} />
                    <Stop offset="55%" stopColor={RING_STOPS[1]} />
                    <Stop offset="100%" stopColor={RING_STOPS[2]} />
                  </LinearGradient>
                </Defs>
                <AnimatedPath
                  d={RING_PATH}
                  fill="none"
                  stroke="url(#splashRing)"
                  strokeWidth={13}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  strokeDasharray={[RING_LENGTH, RING_LENGTH]}
                  strokeDashoffset={ringOffset}
                  opacity={ringVisible}
                />
                {/* 3. Ekor Q memanjang dari tepi berlian. */}
                <AnimatedLine
                  x1={TAIL.x1}
                  y1={TAIL.y1}
                  x2={TAIL.x2}
                  y2={TAIL.y2}
                  stroke="url(#splashRing)"
                  strokeWidth={13}
                  strokeLinecap="round"
                  strokeDasharray={[TAIL_LENGTH, TAIL_LENGTH]}
                  strokeDashoffset={tailOffset}
                  opacity={tailVisible}
                />
              </Svg>

              {/* 2. Berlian berputar masuk ke posisinya (pivot = pusat simbol = pusat berlian). */}
              <Animated.View
                style={[
                  StyleSheet.absoluteFill,
                  {
                    opacity: diamond.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 1, 1] }),
                    transform: [
                      { scale: diamond },
                      { rotate: diamond.interpolate({ inputRange: [0, 1], outputRange: ['-90deg', '0deg'] }) },
                    ],
                  },
                ]}
              >
                <Svg style={StyleSheet.absoluteFill} viewBox="0 0 200 200">
                  <Defs>
                    <LinearGradient id="splashDiamond" x1="55" y1="55" x2="145" y2="145" gradientUnits="userSpaceOnUse">
                      <Stop offset="0%" stopColor={DIAMOND_STOPS[0]} />
                      <Stop offset="100%" stopColor={DIAMOND_STOPS[1]} />
                    </LinearGradient>
                  </Defs>
                  <Path d={DIAMOND_PATH} fill="url(#splashDiamond)" />
                </Svg>
              </Animated.View>

              {/* 4. Titik emerald "pop" + riak sinyal (motif scan). */}
              <Animated.View
                style={[
                  styles.ripple,
                  {
                    left: (DOT.cx - DOT.r) * k,
                    top: (DOT.cy - DOT.r) * k,
                    width: DOT.r * 2 * k,
                    height: DOT.r * 2 * k,
                    borderRadius: DOT.r * k,
                    opacity: ripple.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.7, 0] }),
                    transform: [{ scale: ripple.interpolate({ inputRange: [0, 1], outputRange: [1, 4] }) }],
                  },
                ]}
              />
              <Animated.View
                style={{
                  position: 'absolute',
                  left: (DOT.cx - DOT.r) * k,
                  top: (DOT.cy - DOT.r) * k,
                  width: DOT.r * 2 * k,
                  height: DOT.r * 2 * k,
                  borderRadius: DOT.r * k,
                  backgroundColor: EMERALD,
                  transform: [{ scale: dot }],
                }}
              />

              {/* 5. Kilau cahaya menyapu permukaan logo. */}
              <Svg style={StyleSheet.absoluteFill} viewBox="0 0 200 200">
                <Defs>
                  <ClipPath id="splashClip">
                    <Path d={RING_PATH} />
                    <Path d="M126,100 L184,158 L172,170 L114,112 Z" />
                  </ClipPath>
                  <LinearGradient id="splashShine" x1="0" y1="0" x2="1" y2="0">
                    <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0} />
                    <Stop offset="50%" stopColor="#FFFFFF" stopOpacity={0.55} />
                    <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
                  </LinearGradient>
                </Defs>
                <G clipPath="url(#splashClip)">
                  <G transform="rotate(25 100 100)">
                    <AnimatedRect x={shimmerX} y={-60} width={46} height={320} fill="url(#splashShine)" />
                  </G>
                </G>
              </Svg>
            </Animated.View>

            {/* Wordmark menyala huruf demi huruf, sambil naik perlahan. */}
            <Animated.View
              style={{
                marginTop: symbolSize * 0.12,
                opacity: wordmark,
                transform: [{ translateY: wordmark.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
              }}
            >
              <Svg width={symbolSize * 1.7} height={symbolSize * 1.7 * (175.45 / 561.26)} viewBox={WORDMARK_VIEWBOX}>
                <G transform={WORDMARK_TRANSFORM} fill="#FFFFFF">
                  {WORDMARK_GLYPHS.map((glyph, index) => (
                    <AnimatedPath
                      key={glyph.x}
                      transform={`translate(${glyph.x},0)`}
                      d={glyph.d}
                      opacity={glyphs[index]}
                    />
                  ))}
                </G>
              </Svg>
            </Animated.View>

            <Animated.Text
              style={[
                styles.tagline,
                fontsLoaded && styles.taglineFont,
                {
                  opacity: tagline.interpolate({ inputRange: [0, 1], outputRange: [0, 0.62] }),
                  transform: [{ translateY: tagline.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
                },
              ]}
            >
              SMART POS UNTUK BISNIS ANDA
            </Animated.Text>
          </Animated.View>
        </View>

        {/* Kalau app belum siap setelah intro selesai, beri tanda halus sedang menyiapkan. */}
        {introDone && !ready ? <LoadingHairline /> : null}
      </Pressable>
    </Animated.View>
  );
}

function RadialGlow({ color, opacity }: { color: string; opacity: number }) {
  return (
    <Svg style={StyleSheet.absoluteFill} viewBox="0 0 100 100">
      <Defs>
        <RadialGradient id={`glow${color.slice(1)}`} cx="50" cy="50" r="50" gradientUnits="userSpaceOnUse">
          <Stop offset="0%" stopColor={color} stopOpacity={opacity} />
          <Stop offset="100%" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect x={0} y={0} width={100} height={100} fill={`url(#glow${color.slice(1)})`} />
    </Svg>
  );
}

function LoadingHairline() {
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(progress, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [progress]);
  return (
    <View style={styles.hairlineTrack} pointerEvents="none">
      <Animated.View
        style={[
          styles.hairlineBar,
          { transform: [{ translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [-28, 56] }) }] },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: NAVY, zIndex: 100, elevation: 100 },
  glow: { position: 'absolute' },
  center: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center' },
  logoBlock: { alignItems: 'center' },
  halo: { position: 'absolute', top: 0, alignSelf: 'center' },
  ripple: { position: 'absolute', borderWidth: 2, borderColor: EMERALD },
  tagline: {
    marginTop: 14,
    color: '#FFFFFF',
    fontSize: 11,
    letterSpacing: 3.2,
    fontWeight: '600',
  },
  taglineFont: { fontFamily: 'Inter_600SemiBold', fontWeight: undefined },
  hairlineTrack: {
    position: 'absolute',
    bottom: 72,
    alignSelf: 'center',
    width: 56,
    height: 2,
    borderRadius: 1,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  hairlineBar: { width: 28, height: 2, borderRadius: 1, backgroundColor: '#5B8CFF' },
});
