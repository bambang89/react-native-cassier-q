import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { CartItem, Product } from '@/types/models';

type CartState = {
  items: CartItem[];
};

const initialState: CartState = { items: [] };

export interface AddItemPayload {
  product: Product;
  /** Kalau tidak diisi, dianggap dijual dalam base unit produknya. */
  unit?: { unitId: string; unitName: string; conversionToBase: number };
}

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem(state, action: PayloadAction<AddItemPayload>) {
      const { product, unit } = action.payload;
      const existing = state.items.find((item) => item.product.id === product.id);
      if (existing) {
        // Produk yang sama sudah ada di keranjang — satuan yang dipilih pertama kali
        // yang dipakai (belum ada dukungan 1 produk dalam 2 satuan sekaligus di keranjang).
        existing.quantity += 1;
      } else {
        state.items.push({
          product,
          unitId: unit?.unitId ?? product.baseUnitId,
          unitName: unit?.unitName ?? product.baseUnitName,
          unitConversionToBase: unit?.conversionToBase ?? 1,
          quantity: 1,
        });
      }
    },
    incrementItem(state, action: PayloadAction<string>) {
      const item = state.items.find((i) => i.product.id === action.payload);
      if (item) item.quantity += 1;
    },
    decrementItem(state, action: PayloadAction<string>) {
      const item = state.items.find((i) => i.product.id === action.payload);
      if (!item) return;
      item.quantity -= 1;
      if (item.quantity <= 0) {
        state.items = state.items.filter((i) => i.product.id !== action.payload);
      }
    },
    removeItem(state, action: PayloadAction<string>) {
      state.items = state.items.filter((i) => i.product.id !== action.payload);
    },
    clearCart(state) {
      state.items = [];
    },
  },
});

export const { addItem, incrementItem, decrementItem, removeItem, clearCart } = cartSlice.actions;
export default cartSlice.reducer;

export const selectCartTotal = (state: { cart: CartState }) =>
  state.cart.items.reduce(
    (sum, item) => sum + item.product.sellingPrice * item.unitConversionToBase * item.quantity,
    0,
  );

export const selectCartCount = (state: { cart: CartState }) =>
  state.cart.items.reduce((sum, item) => sum + item.quantity, 0);
