import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import * as cashierSessionsApi from '@/api/cashierSessionsApi';
import type { CashierSession } from '@/types/models';

type CashierSessionState = {
  current: CashierSession | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
};

const initialState: CashierSessionState = {
  current: null,
  status: 'idle',
  error: null,
};

export const fetchCurrentSession = createAsyncThunk(
  'cashierSession/fetchCurrent',
  cashierSessionsApi.fetchCurrentSession,
);

export const openSession = createAsyncThunk('cashierSession/open', async (openingCash: number) =>
  cashierSessionsApi.openSession(openingCash),
);

export const closeSession = createAsyncThunk(
  'cashierSession/close',
  async ({ id, actualCash, notes }: { id: string; actualCash: number; notes?: string }) =>
    cashierSessionsApi.closeSession(id, { actualCash, notes }),
);

const cashierSessionSlice = createSlice({
  name: 'cashierSession',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCurrentSession.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchCurrentSession.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.current = action.payload;
      })
      .addCase(fetchCurrentSession.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Gagal memuat sesi kasir';
      })
      .addCase(openSession.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.current = action.payload;
      })
      .addCase(closeSession.fulfilled, (state) => {
        state.status = 'succeeded';
        state.current = null;
      });
  },
});

export default cashierSessionSlice.reducer;
