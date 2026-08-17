import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import * as customersApi from '@/api/customersApi';
import type { CustomerPayload } from '@/api/customersApi';
import type { Customer, LedgerEntry } from '@/types/models';

type AsyncStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

type CustomersState = {
  items: Customer[];
  status: AsyncStatus;
  error: string | null;
  mutationStatus: AsyncStatus;
  mutationError: string | null;
  /** Riwayat hutang/pembayaran, di-cache per customerId. */
  ledgerByCustomerId: Record<string, LedgerEntry[]>;
  ledgerStatusByCustomerId: Record<string, AsyncStatus>;
  paymentStatus: AsyncStatus;
  paymentError: string | null;
};

const initialState: CustomersState = {
  items: [],
  status: 'idle',
  error: null,
  mutationStatus: 'idle',
  mutationError: null,
  ledgerByCustomerId: {},
  ledgerStatusByCustomerId: {},
  paymentStatus: 'idle',
  paymentError: null,
};

export const fetchCustomers = createAsyncThunk('customers/fetchAll', customersApi.fetchCustomers);

export const createCustomer = createAsyncThunk('customers/create', async (payload: CustomerPayload) =>
  customersApi.createCustomer(payload),
);

export const updateCustomer = createAsyncThunk(
  'customers/update',
  async ({ id, payload }: { id: string; payload: CustomerPayload }) => customersApi.updateCustomer(id, payload),
);

export const fetchCustomerLedger = createAsyncThunk('customers/fetchLedger', async (customerId: string) => {
  const entries = await customersApi.fetchCustomerLedger(customerId);
  return { customerId, entries };
});

export const recordCustomerPayment = createAsyncThunk(
  'customers/recordPayment',
  async ({ customerId, amount, notes }: { customerId: string; amount: number; notes?: string }) => {
    const customer = await customersApi.recordCustomerPayment(customerId, amount, notes);
    return { customerId, customer };
  },
);

const customersSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomers.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Gagal memuat pelanggan';
      })
      .addCase(createCustomer.pending, (state) => {
        state.mutationStatus = 'loading';
        state.mutationError = null;
      })
      .addCase(createCustomer.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded';
        state.items.push(action.payload);
      })
      .addCase(createCustomer.rejected, (state, action) => {
        state.mutationStatus = 'failed';
        state.mutationError = action.error.message ?? 'Pelanggan tidak bisa didaftarkan';
      })
      .addCase(updateCustomer.pending, (state) => {
        state.mutationStatus = 'loading';
        state.mutationError = null;
      })
      .addCase(updateCustomer.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded';
        const index = state.items.findIndex((item) => item.id === action.payload.id);
        if (index >= 0) state.items[index] = action.payload;
      })
      .addCase(updateCustomer.rejected, (state, action) => {
        state.mutationStatus = 'failed';
        state.mutationError = action.error.message ?? 'Data pelanggan tidak bisa disimpan';
      })
      .addCase(fetchCustomerLedger.pending, (state, action) => {
        state.ledgerStatusByCustomerId[action.meta.arg] = 'loading';
      })
      .addCase(fetchCustomerLedger.fulfilled, (state, action) => {
        state.ledgerStatusByCustomerId[action.payload.customerId] = 'succeeded';
        state.ledgerByCustomerId[action.payload.customerId] = action.payload.entries;
      })
      .addCase(fetchCustomerLedger.rejected, (state, action) => {
        state.ledgerStatusByCustomerId[action.meta.arg] = 'failed';
      })
      .addCase(recordCustomerPayment.pending, (state) => {
        state.paymentStatus = 'loading';
        state.paymentError = null;
      })
      .addCase(recordCustomerPayment.fulfilled, (state, action) => {
        state.paymentStatus = 'succeeded';
        const { customerId, customer } = action.payload;
        const index = state.items.findIndex((item) => item.id === customerId);
        if (index >= 0) state.items[index] = customer;
        // Ledger belum dikembalikan API pembayaran ini — refetch manual dari komponen
        // (lihat CustomerDetailScreen) biar baris pembayaran baru langsung kelihatan.
      })
      .addCase(recordCustomerPayment.rejected, (state, action) => {
        state.paymentStatus = 'failed';
        state.paymentError = action.error.message ?? 'Pembayaran tidak bisa dicatat';
      });
  },
});

export default customersSlice.reducer;
