export const LOW_STOCK_THRESHOLD = 5;

export const CASH_PRESETS = [50000, 100000, 150000, 200000];

export const PPN_RATE = 0.11;

/** Sentinel value untuk opsi "tanpa pelanggan" di Select pemilihan pelanggan saat checkout. */
export const NO_CUSTOMER = '__none__';

export function greetingForNow(): string {
  const hour = new Date().getHours();
  if (hour < 11) return 'Selamat pagi';
  if (hour < 15) return 'Selamat siang';
  if (hour < 19) return 'Selamat sore';
  return 'Selamat malam';
}

export function todayLabel(): string {
  return new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export function sessionTimeLabel(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }).replace(':', '.');
}

export function formatRupiah(value: number): string {
  return `Rp ${Math.round(value).toLocaleString('id-ID')}`;
}

/**
 * Likely cash amounts a buyer hands over for `total`: the next round-ups to
 * Rp5.000, Rp10.000, Rp20.000, Rp50.000 and Rp100.000, without duplicates
 * and never equal to the exact amount (that is the "Uang Pas" chip).
 */
export function cashSuggestions(total: number, limit = 4): number[] {
  const steps = [5000, 10000, 20000, 50000, 100000];
  const values = steps
    .map((step) => Math.ceil(total / step) * step)
    .filter((value) => value > total);
  return [...new Set(values)].slice(0, limit);
}
