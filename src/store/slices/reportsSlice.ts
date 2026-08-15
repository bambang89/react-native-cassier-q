import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import * as reportsApi from '@/api/reportsApi';
import type { FetchSalesSummaryParams } from '@/api/reportsApi';
import type { SalesSummary } from '@/types/models';

type ReportsState = {
  summary: SalesSummary | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
};

const initialState: ReportsState = {
  summary: null,
  status: 'idle',
  error: null,
};

export const fetchSalesSummary = createAsyncThunk(
  'reports/fetchSummary',
  async (params: FetchSalesSummaryParams = {}) => reportsApi.fetchSalesSummary(params),
);

const reportsSlice = createSlice({
  name: 'reports',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSalesSummary.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchSalesSummary.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.summary = action.payload;
      })
      .addCase(fetchSalesSummary.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Gagal memuat laporan';
      });
  },
});

export default reportsSlice.reducer;
