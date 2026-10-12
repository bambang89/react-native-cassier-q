import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import * as accessApi from '@/api/accessApi';
import type { AdminStore, MenuAccessMatrix } from '@/api/accessApi';
import { apiErrorMessage } from '@/api/errors';
import { loadActiveStore, setActiveStore } from '@/api/storeContext';
import type { ActiveStore } from '@/api/storeContext';
import { logout, logoutAll, sessionExpired } from './authSlice';

type LoadStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

interface AccessState {
  /** Toko yang sedang dibantu SUPERADMIN (null = belum memilih). */
  activeStore: ActiveStore | null;
  activeStoreLoaded: boolean;
  stores: AdminStore[];
  storesStatus: LoadStatus;
  /** null = belum dimuat / tanpa batasan; array = menu yang boleh tampil. */
  allowedMenus: string[] | null;
  matrix: MenuAccessMatrix | null;
  matrixStatus: LoadStatus;
  error: string | null;
}

const initialState: AccessState = {
  activeStore: null,
  activeStoreLoaded: false,
  stores: [],
  storesStatus: 'idle',
  allowedMenus: null,
  matrix: null,
  matrixStatus: 'idle',
  error: null,
};

export const restoreActiveStore = createAsyncThunk('access/restoreActiveStore', loadActiveStore);

export const chooseActiveStore = createAsyncThunk('access/chooseActiveStore', async (store: ActiveStore) => {
  await setActiveStore(store);
  return store;
});

export const fetchAdminStores = createAsyncThunk('access/fetchAdminStores', accessApi.fetchAdminStores);

export const fetchMyMenus = createAsyncThunk('access/fetchMyMenus', async () => {
  const result = await accessApi.fetchMyMenus();
  return result.restricted ? result.menus : null;
});

export const fetchMenuAccess = createAsyncThunk('access/fetchMenuAccess', accessApi.fetchMenuAccess);

export const saveMenuAccess = createAsyncThunk(
  'access/saveMenuAccess',
  async ({ roleCode, menus }: { roleCode: string; menus: string[] }, { rejectWithValue }) => {
    try {
      return await accessApi.updateMenuAccess(roleCode, menus);
    } catch (error) {
      return rejectWithValue(apiErrorMessage(error, 'Pengaturan menu gagal disimpan.'));
    }
  },
);

const resetOnSignOut = (state: AccessState) => {
  state.activeStore = null;
  state.allowedMenus = null;
  state.matrix = null;
  state.stores = [];
};

const accessSlice = createSlice({
  name: 'access',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(restoreActiveStore.fulfilled, (state, action) => {
        state.activeStore = action.payload;
        state.activeStoreLoaded = true;
      })
      .addCase(restoreActiveStore.rejected, (state) => {
        state.activeStoreLoaded = true;
      })
      .addCase(chooseActiveStore.fulfilled, (state, action) => {
        state.activeStore = action.payload;
        state.activeStoreLoaded = true;
      })
      .addCase(fetchAdminStores.pending, (state) => {
        state.storesStatus = 'loading';
        state.error = null;
      })
      .addCase(fetchAdminStores.fulfilled, (state, action) => {
        state.storesStatus = 'succeeded';
        state.stores = action.payload;
      })
      .addCase(fetchAdminStores.rejected, (state, action) => {
        state.storesStatus = 'failed';
        state.error = action.error.message ?? 'Daftar toko gagal dimuat';
      })
      .addCase(fetchMyMenus.fulfilled, (state, action) => {
        state.allowedMenus = action.payload;
      })
      .addCase(fetchMenuAccess.pending, (state) => {
        state.matrixStatus = 'loading';
      })
      .addCase(fetchMenuAccess.fulfilled, (state, action) => {
        state.matrixStatus = 'succeeded';
        state.matrix = action.payload;
      })
      .addCase(fetchMenuAccess.rejected, (state) => {
        state.matrixStatus = 'failed';
      })
      .addCase(saveMenuAccess.fulfilled, (state, action) => {
        state.matrix = action.payload;
      })
      .addCase(logout.fulfilled, resetOnSignOut)
      .addCase(logoutAll.fulfilled, resetOnSignOut)
      .addCase(sessionExpired, resetOnSignOut);
  },
});

export default accessSlice.reducer;
