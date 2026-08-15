import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import * as storeApi from '@/api/storeApi';
import type { UpdateStoreProfilePayload } from '@/api/storeApi';
import type { StoreProfile } from '@/types/models';

type AsyncStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

type StoreProfileState = {
  profile: StoreProfile | null;
  status: AsyncStatus;
  error: string | null;
  updateStatus: AsyncStatus;
  updateError: string | null;
};

const initialState: StoreProfileState = {
  profile: null,
  status: 'idle',
  error: null,
  updateStatus: 'idle',
  updateError: null,
};

export const fetchStoreProfile = createAsyncThunk('storeProfile/fetch', storeApi.fetchStoreProfile);

export const updateStoreProfile = createAsyncThunk(
  'storeProfile/update',
  async (payload: UpdateStoreProfilePayload) => storeApi.updateStoreProfile(payload),
);

const storeProfileSlice = createSlice({
  name: 'storeProfile',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchStoreProfile.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchStoreProfile.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.profile = action.payload;
      })
      .addCase(fetchStoreProfile.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Gagal memuat profil toko';
      })
      .addCase(updateStoreProfile.pending, (state) => {
        state.updateStatus = 'loading';
        state.updateError = null;
      })
      .addCase(updateStoreProfile.fulfilled, (state, action) => {
        state.updateStatus = 'succeeded';
        state.profile = action.payload;
      })
      .addCase(updateStoreProfile.rejected, (state, action) => {
        state.updateStatus = 'failed';
        state.updateError = action.error.message ?? 'Profil toko tidak bisa disimpan';
      });
  },
});

export default storeProfileSlice.reducer;
