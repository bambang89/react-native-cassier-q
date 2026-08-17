import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import * as purchaseOrdersApi from '@/api/purchaseOrdersApi';
import type {
  CreatePurchaseOrderPayload,
  FetchPurchaseOrdersParams,
  ReceiveItemPayload,
} from '@/api/purchaseOrdersApi';
import type { PurchaseOrder } from '@/types/models';

type AsyncStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

type PurchaseOrdersState = {
  items: PurchaseOrder[];
  page: number;
  totalPages: number;
  totalElements: number;
  status: AsyncStatus;
  error: string | null;
  current: PurchaseOrder | null;
  currentStatus: AsyncStatus;
  createStatus: AsyncStatus;
  createError: string | null;
  receiveStatus: AsyncStatus;
  receiveError: string | null;
  cancelStatus: AsyncStatus;
  cancelError: string | null;
};

const initialState: PurchaseOrdersState = {
  items: [],
  page: 0,
  totalPages: 0,
  totalElements: 0,
  status: 'idle',
  error: null,
  current: null,
  currentStatus: 'idle',
  createStatus: 'idle',
  createError: null,
  receiveStatus: 'idle',
  receiveError: null,
  cancelStatus: 'idle',
  cancelError: null,
};

export const fetchPurchaseOrders = createAsyncThunk(
  'purchaseOrders/fetchAll',
  async (params: FetchPurchaseOrdersParams = {}) => purchaseOrdersApi.fetchPurchaseOrders(params),
);

export const fetchPurchaseOrder = createAsyncThunk('purchaseOrders/fetchOne', async (id: string) =>
  purchaseOrdersApi.fetchPurchaseOrder(id),
);

export const createPurchaseOrder = createAsyncThunk(
  'purchaseOrders/create',
  async (payload: CreatePurchaseOrderPayload) => purchaseOrdersApi.createPurchaseOrder(payload),
);

export const receivePurchaseOrder = createAsyncThunk(
  'purchaseOrders/receive',
  async ({ id, items }: { id: string; items: ReceiveItemPayload[] }) =>
    purchaseOrdersApi.receivePurchaseOrder(id, items),
);

export const cancelPurchaseOrder = createAsyncThunk('purchaseOrders/cancel', async (id: string) =>
  purchaseOrdersApi.cancelPurchaseOrder(id),
);

const purchaseOrdersSlice = createSlice({
  name: 'purchaseOrders',
  initialState,
  reducers: {
    clearCurrentPurchaseOrder(state) {
      state.current = null;
      state.currentStatus = 'idle';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPurchaseOrders.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchPurchaseOrders.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const isNextPage = action.meta.arg.page && action.meta.arg.page > 0;
        state.items = isNextPage ? [...state.items, ...action.payload.content] : action.payload.content;
        state.page = action.payload.page;
        state.totalPages = action.payload.totalPages;
        state.totalElements = action.payload.totalElements;
      })
      .addCase(fetchPurchaseOrders.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Gagal memuat purchase order';
      })
      .addCase(fetchPurchaseOrder.pending, (state) => {
        state.currentStatus = 'loading';
      })
      .addCase(fetchPurchaseOrder.fulfilled, (state, action) => {
        state.currentStatus = 'succeeded';
        state.current = action.payload;
      })
      .addCase(fetchPurchaseOrder.rejected, (state) => {
        state.currentStatus = 'failed';
      })
      .addCase(createPurchaseOrder.pending, (state) => {
        state.createStatus = 'loading';
        state.createError = null;
      })
      .addCase(createPurchaseOrder.fulfilled, (state, action) => {
        state.createStatus = 'succeeded';
        state.items.unshift(action.payload);
        state.totalElements += 1;
        state.current = action.payload;
      })
      .addCase(createPurchaseOrder.rejected, (state, action) => {
        state.createStatus = 'failed';
        state.createError = action.error.message ?? 'Purchase order tidak bisa dibuat';
      })
      .addCase(receivePurchaseOrder.pending, (state) => {
        state.receiveStatus = 'loading';
        state.receiveError = null;
      })
      .addCase(receivePurchaseOrder.fulfilled, (state, action) => {
        state.receiveStatus = 'succeeded';
        state.current = action.payload;
        const index = state.items.findIndex((item) => item.id === action.payload.id);
        if (index >= 0) state.items[index] = action.payload;
      })
      .addCase(receivePurchaseOrder.rejected, (state, action) => {
        state.receiveStatus = 'failed';
        state.receiveError = action.error.message ?? 'Penerimaan barang gagal dicatat';
      })
      .addCase(cancelPurchaseOrder.pending, (state) => {
        state.cancelStatus = 'loading';
        state.cancelError = null;
      })
      .addCase(cancelPurchaseOrder.fulfilled, (state, action) => {
        state.cancelStatus = 'succeeded';
        state.current = action.payload;
        const index = state.items.findIndex((item) => item.id === action.payload.id);
        if (index >= 0) state.items[index] = action.payload;
      })
      .addCase(cancelPurchaseOrder.rejected, (state, action) => {
        state.cancelStatus = 'failed';
        state.cancelError = action.error.message ?? 'PO tidak bisa dibatalkan (mungkin sudah ada barang diterima)';
      });
  },
});

export const { clearCurrentPurchaseOrder } = purchaseOrdersSlice.actions;
export default purchaseOrdersSlice.reducer;
