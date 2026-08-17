import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import * as rolesApi from '@/api/rolesApi';
import type { Role } from '@/types/models';

type RolesState = {
  items: Role[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
};

const initialState: RolesState = {
  items: [],
  status: 'idle',
  error: null,
};

export const fetchRoles = createAsyncThunk('roles/fetchAll', rolesApi.fetchRoles);

const rolesSlice = createSlice({
  name: 'roles',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRoles.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchRoles.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchRoles.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Gagal memuat daftar role';
      });
  },
});

export default rolesSlice.reducer;
