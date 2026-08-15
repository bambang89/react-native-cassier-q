import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import * as unitsApi from '@/api/unitsApi';
import type { UnitPayload } from '@/api/unitsApi';
import type { Unit } from '@/types/models';

type UnitsState = {
  items: Unit[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
};

const initialState: UnitsState = {
  items: [],
  status: 'idle',
  error: null,
};

export const fetchUnits = createAsyncThunk('units/fetchAll', unitsApi.fetchUnits);

export const createUnit = createAsyncThunk('units/create', async (payload: UnitPayload) =>
  unitsApi.createUnit(payload),
);

export const updateUnit = createAsyncThunk(
  'units/update',
  async ({ id, payload }: { id: string; payload: UnitPayload }) => unitsApi.updateUnit(id, payload),
);

export const deleteUnit = createAsyncThunk('units/delete', async (id: string) => {
  await unitsApi.deleteUnit(id);
  return id;
});

const unitsSlice = createSlice({
  name: 'units',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUnits.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchUnits.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchUnits.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Gagal memuat satuan';
      })
      .addCase(createUnit.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(updateUnit.fulfilled, (state, action) => {
        const index = state.items.findIndex((item) => item.id === action.payload.id);
        if (index >= 0) state.items[index] = action.payload;
      })
      .addCase(deleteUnit.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item.id !== action.payload);
      });
  },
});

export default unitsSlice.reducer;
