import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import * as settingsApi from '@/api/settingsApi';
import type { UpdateCheckoutSettingsPayload } from '@/api/settingsApi';
import { apiErrorMessage } from '@/api/errors';
import type { CheckoutSettings } from '@/types/models';

type CheckoutSettingsState = {
  settings: CheckoutSettings | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
};

const initialState: CheckoutSettingsState = { settings: null, status: 'idle' };

export const fetchCheckoutSettings = createAsyncThunk('checkoutSettings/fetch', settingsApi.fetchCheckoutSettings);

export const saveCheckoutSettings = createAsyncThunk(
  'checkoutSettings/save',
  async (payload: UpdateCheckoutSettingsPayload, { rejectWithValue }) => {
    try {
      return await settingsApi.updateCheckoutSettings(payload);
    } catch (error) {
      return rejectWithValue(apiErrorMessage(error, 'Pengaturan tidak bisa disimpan.'));
    }
  },
);

const checkoutSettingsSlice = createSlice({
  name: 'checkoutSettings',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCheckoutSettings.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchCheckoutSettings.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.settings = action.payload;
      })
      .addCase(fetchCheckoutSettings.rejected, (state) => {
        state.status = 'failed';
      })
      .addCase(saveCheckoutSettings.fulfilled, (state, action) => {
        state.settings = action.payload;
      });
  },
});

export default checkoutSettingsSlice.reducer;
