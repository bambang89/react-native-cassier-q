import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';

import * as authApi from '../../api/authApi';
import { loadPersistedApiEnvOverride } from '../../api/client';
import { loadTokens } from '../../api/tokenStorage';
import type { RegisterPayload } from '../../api/authApi';
import type { User } from '../../types/models';

type AuthState = {
  user: User | null;
  status: 'idle' | 'checking' | 'authenticating' | 'authenticated' | 'unauthenticated';
  error: string | null;
};

const initialState: AuthState = {
  user: null,
  status: 'idle',
  error: null,
};

export const bootstrapAuth = createAsyncThunk('auth/bootstrap', async () => {
  await loadPersistedApiEnvOverride();
  const tokens = await loadTokens();
  if (!tokens) return null;
  return authApi.fetchCurrentUser();
});

export const login = createAsyncThunk(
  'auth/login',
  async ({ username, password }: { username: string; password: string }) =>
    authApi.login(username, password),
);

export const register = createAsyncThunk('auth/register', async (payload: RegisterPayload) =>
  authApi.register(payload),
);

export const logout = createAsyncThunk('auth/logout', async () => {
  await authApi.logout();
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    sessionExpired(state) {
      state.user = null;
      state.status = 'unauthenticated';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(bootstrapAuth.pending, (state) => {
        state.status = 'checking';
      })
      .addCase(bootstrapAuth.fulfilled, (state, action: PayloadAction<User | null>) => {
        state.user = action.payload;
        state.status = action.payload ? 'authenticated' : 'unauthenticated';
      })
      .addCase(bootstrapAuth.rejected, (state) => {
        state.user = null;
        state.status = 'unauthenticated';
      })
      .addCase(login.pending, (state) => {
        state.status = 'authenticating';
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<User>) => {
        state.user = action.payload;
        state.status = 'authenticated';
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'unauthenticated';
        state.error = action.error.message ?? 'Login gagal';
      })
      .addCase(register.pending, (state) => {
        state.status = 'authenticating';
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action: PayloadAction<User>) => {
        state.user = action.payload;
        state.status = 'authenticated';
      })
      .addCase(register.rejected, (state, action) => {
        state.status = 'unauthenticated';
        state.error = action.error.message ?? 'Pendaftaran gagal';
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.status = 'unauthenticated';
      });
  },
});

export const { sessionExpired } = authSlice.actions;
export default authSlice.reducer;
