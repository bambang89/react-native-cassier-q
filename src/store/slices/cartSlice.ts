import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { CartItem, Product } from '@/types/models';
import { baseTotals, linePricing } from '@/utils/priceTiers';

export type CartCustomerOrder = { id: string; orderNumber: string; customerName: string };

type CartState = {
  items: CartItem[];
  /** Pesanan (menu Pesanan) yang sedang dibayar lewat keranjang ini; ditandai lunas setelah checkout. */
  customerOrder: CartCustomerOrder | null;
};

const initialState: CartState = { items: [], customerOrder: null };

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
      state.customerOrder = null;
    },
    loadOrderIntoCart(state, action: PayloadAction<{ items: CartItem[]; order: CartCustomerOrder }>) {
      state.items = action.payload.items;
      state.customerOrder = action.payload.order;
    },
  },
});

export const { addItem, incrementItem, decrementItem, removeItem, clearCart, loadOrderIntoCart } = cartSlice.actions;
export default cartSlice.reducer;

/** Cart total with wholesale (grosir) steps applied per product. */
export const selectCartTotal = (state: { cart: CartState }) => {
  const totals = baseTotals(state.cart.items);
  return state.cart.items.reduce((sum, item) => sum + linePricing(item, totals).subtotal, 0);
};

export const selectCartCount = (state: { cart: CartState }) =>
  state.cart.items.reduce((sum, item) => sum + item.quantity, 0);
