import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import * as ordersApi from '@/api/ordersApi';
import type { CreateOrderPayload, FetchOrdersParams } from '@/api/ordersApi';
import type { CartItem, Order, Receipt } from '@/types/models';

type AsyncStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

type OrdersState = {
  items: Order[];
  page: number;
  totalPages: number;
  status: AsyncStatus;
  error: string | null;
  /** Order yang sedang dibuka di OrderDetailScreen. */
  current: Order | null;
  currentStatus: AsyncStatus;
  currentError: string | null;
  createStatus: AsyncStatus;
  createError: string | null;
  voidStatus: AsyncStatus;
  voidError: string | null;
  /** Data struk resmi (GET /orders/{id}/receipt) untuk ReceiptScreen. */
  receipt: Receipt | null;
  receiptStatus: AsyncStatus;
  receiptError: string | null;
};

const initialState: OrdersState = {
  items: [],
  page: 0,
  totalPages: 0,
  status: 'idle',
  error: null,
  current: null,
  currentStatus: 'idle',
  currentError: null,
  createStatus: 'idle',
  createError: null,
  voidStatus: 'idle',
  voidError: null,
  receipt: null,
  receiptStatus: 'idle',
  receiptError: null,
};

export const fetchOrders = createAsyncThunk('orders/fetchAll', async (params: FetchOrdersParams = {}) =>
  ordersApi.fetchOrders(params),
);

export const fetchOrder = createAsyncThunk('orders/fetchOne', async (id: string) => ordersApi.fetchOrder(id));

export const createOrder = createAsyncThunk(
  'orders/create',
  async ({ items, payload }: { items: CartItem[]; payload: CreateOrderPayload }) =>
    ordersApi.createOrder(items, payload),
);

export const voidOrder = createAsyncThunk(
  'orders/void',
  async ({ id, reason }: { id: string; reason: string }) => ordersApi.voidOrder(id, reason),
);

export const fetchReceipt = createAsyncThunk('orders/fetchReceipt', async (id: string) => ordersApi.fetchReceipt(id));

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    clearCurrentOrder(state) {
      state.current = null;
      state.currentStatus = 'idle';
      state.currentError = null;
    },
    clearReceipt(state) {
      state.receipt = null;
      state.receiptStatus = 'idle';
      state.receiptError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const isNextPage = action.meta.arg.page && action.meta.arg.page > 0;
        state.items = isNextPage ? [...state.items, ...action.payload.content] : action.payload.content;
        state.page = action.payload.page;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Gagal memuat transaksi';
      })
      .addCase(fetchOrder.pending, (state) => {
        state.currentStatus = 'loading';
        state.currentError = null;
      })
      .addCase(fetchOrder.fulfilled, (state, action) => {
        state.currentStatus = 'succeeded';
        state.current = action.payload;
      })
      .addCase(fetchOrder.rejected, (state, action) => {
        state.currentStatus = 'failed';
        state.currentError = action.error.message ?? 'Gagal memuat detail transaksi';
      })
      .addCase(createOrder.pending, (state) => {
        state.createStatus = 'loading';
        state.createError = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.createStatus = 'succeeded';
        state.items.unshift(action.payload);
        // Langsung isi `current` juga — ReceiptScreen dibuka tepat setelah
        // checkout dan butuh order ini tanpa nunggu fetch ulang.
        state.current = action.payload;
        state.currentStatus = 'succeeded';
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.createStatus = 'failed';
        state.createError = action.error.message ?? 'Transaksi gagal';
      })
      .addCase(voidOrder.pending, (state) => {
        state.voidStatus = 'loading';
        state.voidError = null;
      })
      .addCase(voidOrder.fulfilled, (state, action) => {
        state.voidStatus = 'succeeded';
        state.current = action.payload;
        const index = state.items.findIndex((item) => item.id === action.payload.id);
        if (index >= 0) state.items[index] = action.payload;
      })
      .addCase(voidOrder.rejected, (state, action) => {
        state.voidStatus = 'failed';
        state.voidError = action.error.message ?? 'Transaksi tidak bisa dibatalkan';
      })
      .addCase(fetchReceipt.pending, (state) => {
        state.receiptStatus = 'loading';
        state.receiptError = null;
      })
      .addCase(fetchReceipt.fulfilled, (state, action) => {
        state.receiptStatus = 'succeeded';
        state.receipt = action.payload;
      })
      .addCase(fetchReceipt.rejected, (state, action) => {
        state.receiptStatus = 'failed';
        state.receiptError = action.error.message ?? 'Gagal memuat struk';
      });
  },
});

export const { clearCurrentOrder, clearReceipt } = ordersSlice.actions;
export default ordersSlice.reducer;
