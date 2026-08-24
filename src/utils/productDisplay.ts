import type { Product } from '@/types/models';

// Warna pastel bergantian buat latar thumbnail produk (kartu grid Kasir/Produk,
// baris keranjang) supaya konsisten walau produk belum punya foto — dipilih
// dari hash id produk biar produk yang sama selalu dapat warna yang sama di
// mana pun ditampilkan.
const THUMBNAIL_PALETTE = ['#EFE6DA', '#DCEFE3', '#F0E0C8', '#F3E3E3', '#E3E8F3', '#EAE3F3'];

export function paletteColorFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash + seed.charCodeAt(i)) % THUMBNAIL_PALETTE.length;
  return THUMBNAIL_PALETTE[hash];
}

export function emojiForProduct(product: Product): string {
  const name = product.productName.toLowerCase();
  if (name.includes('kopi') || name.includes('coffee') || name.includes('americano') || name.includes('espresso'))
    return '☕';
  if (name.includes('matcha') || name.includes('teh') || name.includes('tea')) return '🍵';
  if (name.includes('thai') || name.includes('boba') || name.includes('bubble')) return '🧋';
  if (name.includes('croissant') || name.includes('roti') || name.includes('bread')) return '🥐';
  if (name.includes('sandwich') || name.includes('sandwic')) return '🥪';
  if (name.includes('juice') || name.includes('jus')) return '🧃';

  const category = product.categoryName?.toLowerCase() ?? '';
  if (category.includes('minuman')) return '🥤';
  if (category.includes('makanan')) return '🍽️';
  if (category.includes('snack')) return '🍪';
  return '🛍️';
}
