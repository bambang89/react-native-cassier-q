import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import * as suppliersApi from '@/api/suppliersApi';
import type { SupplierPayload } from '@/api/suppliersApi';
import type { Supplier } from '@/types/models';

type AsyncStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

type SuppliersState = {
  items: Supplier[];
  status: AsyncStatus;
  error: string | null;
  mutationStatus: AsyncStatus;
  mutationError: string | null;
};

const initialState: SuppliersState = {
  items: [],
  status: 'idle',
  error: null,
  mutationStatus: 'idle',
  mutationError: null,
};

export const fetchSuppliers = createAsyncThunk('suppliers/fetchAll', suppliersApi.fetchSuppliers);

export const createSupplier = createAsyncThunk('suppliers/create', async (payload: SupplierPayload) =>
  suppliersApi.createSupplier(payload),
);

export const updateSupplier = createAsyncThunk(
  'suppliers/update',
  async ({ id, payload }: { id: string; payload: SupplierPayload }) => suppliersApi.updateSupplier(id, payload),
);

export const deactivateSupplier = createAsyncThunk('suppliers/deactivate', async (id: string) => {
  await suppliersApi.deactivateSupplier(id);
  return id;
});

const suppliersSlice = createSlice({
  name: 'suppliers',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSuppliers.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchSuppliers.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchSuppliers.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Gagal memuat pemasok';
      })
      .addCase(createSupplier.pending, (state) => {
        state.mutationStatus = 'loading';
        state.mutationError = null;
      })
      .addCase(createSupplier.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded';
        state.items.push(action.payload);
      })
      .addCase(createSupplier.rejected, (state, action) => {
        state.mutationStatus = 'failed';
        state.mutationError = action.error.message ?? 'Pemasok tidak bisa ditambahkan';
      })
      .addCase(updateSupplier.fulfilled, (state, action) => {
        const index = state.items.findIndex((item) => item.id === action.payload.id);
        if (index >= 0) state.items[index] = action.payload;
      })
      .addCase(updateSupplier.rejected, (state, action) => {
        state.mutationStatus = 'failed';
        state.mutationError = action.error.message ?? 'Pemasok tidak bisa disimpan';
      })
      .addCase(deactivateSupplier.fulfilled, (state, action) => {
        const item = state.items.find((s) => s.id === action.payload);
        if (item) item.active = false;
      });
  },
});

export default suppliersSlice.reducer;
