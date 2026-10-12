// Sengaja file terpisah tanpa import layar (beda dengan ./types.ts) supaya
// komponen UI seperti Header bisa memakainya tanpa import melingkar.

/** Urutan item di bottom tab bar HP — Kasir di tengah sebagai tombol utama. */
export const PHONE_TAB_BAR_ROUTES = ['Dashboard', 'Orders', 'POS', 'Products', 'Menu'] as const;

export type PhoneTabBarRoute = (typeof PHONE_TAB_BAR_ROUTES)[number];

export const PHONE_TAB_LABELS: Record<PhoneTabBarRoute, string> = {
  Dashboard: 'Beranda',
  Orders: 'Transaksi',
  POS: 'Kasir',
  Products: 'Produk',
  Menu: 'Menu',
};

export function isPhoneTabBarRoute(name: string): name is PhoneTabBarRoute {
  return (PHONE_TAB_BAR_ROUTES as readonly string[]).includes(name);
}
