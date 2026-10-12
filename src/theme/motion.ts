import { Easing } from 'react-native';

// Satu sumber untuk durasi & kurva animasi supaya seluruh app terasa
// "satu tangan": cepat untuk umpan balik sentuh, sedikit lebih lambat
// untuk konten yang masuk ke layar.
export const motion = {
  duration: {
    fast: 160,
    base: 260,
    slow: 420,
  },
  easing: {
    // Keluar cepat lalu melambat — kesan halus saat elemen masuk.
    out: Easing.out(Easing.cubic),
    inOut: Easing.inOut(Easing.cubic),
  },
  spring: {
    // Tekan tombol/kartu: snappy, tanpa memantul berlebihan.
    press: { speed: 40, bounciness: 0 },
    // Indikator tab / sheet: sedikit pantulan biar terasa hidup.
    gentle: { speed: 14, bounciness: 6 },
  },
  // Jeda antar item untuk animasi berurutan (stagger) & batas atasnya, supaya
  // item ke-30 di daftar panjang tidak menunggu terlalu lama.
  staggerStep: 45,
  staggerMax: 8,
} as const;

export function staggerDelay(index: number, base = 0): number {
  return base + Math.min(index, motion.staggerMax) * motion.staggerStep;
}
