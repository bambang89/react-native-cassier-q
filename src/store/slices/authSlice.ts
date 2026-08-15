import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';

import * as authApi from '@/api/authApi';
import { loadPersistedApiEnvOverride } from '@/api/client';
import { loadTokens } from '@/api/tokenStorage';
import type { RegisterPayload } from '@/api/authApi';
import type { User } from '@/types/models';

type AsyncStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

type AuthState = {
  user: User | null;
  status: 'idle' | 'checking' | 'authenticating' | 'authenticated' | 'unauthenticated';
  error: string | null;
  /** Status untuk alur lupa/reset/ganti kata sandi — independen dari sesi login utama. */
  passwordAction: { status: AsyncStatus; error: string | null };
};

const initialState: AuthState = {
  user: null,
  status: 'idle',
  error: null,
  passwordAction: { status: 'idle', error: null },
};

export const bootstrapAuth = createAsyncThunk('auth/bootstrap', async () => {
  // Override environment API tersimpan (lihat setActiveApiEnv) harus kepasang
  // sebelum request pertama, termasuk /auth/me di bawah ini.
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

// /auth/register langsung membalas access+refresh token, jadi mendaftar =
// langsung masuk (tidak perlu login manual setelahnya).
export const register = createAsyncThunk('auth/register', async (payload: RegisterPayload) =>
  authApi.register(payload),
);

export const logout = createAsyncThunk('auth/logout', async () => {
  await authApi.logout();
});

export const forgotPassword = createAsyncThunk('auth/forgotPassword', async (username: string) => {
  await authApi.forgotPassword(username);
});

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async ({ token, newPassword }: { token: string; newPassword: string }) => {
    await authApi.resetPassword(token, newPassword);
  },
);

export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) => {
    await authApi.changePassword(currentPassword, newPassword);
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    sessionExpired(state) {
      state.user = null;
      state.status = 'unauthenticated';
    },
    resetPasswordActionState(state) {
      state.passwordAction = { status: 'idle', error: null };
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
      })
      .addCase(forgotPassword.pending, (state) => {
        state.passwordAction = { status: 'loading', error: null };
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.passwordAction = { status: 'succeeded', error: null };
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.passwordAction = { status: 'failed', error: action.error.message ?? 'Gagal mengirim token reset' };
      })
      .addCase(resetPassword.pending, (state) => {
        state.passwordAction = { status: 'loading', error: null };
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.passwordAction = { status: 'succeeded', error: null };
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.passwordAction = { status: 'failed', error: action.error.message ?? 'Gagal reset kata sandi' };
      })
      .addCase(changePassword.pending, (state) => {
        state.passwordAction = { status: 'loading', error: null };
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.passwordAction = { status: 'succeeded', error: null };
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.passwordAction = { status: 'failed', error: action.error.message ?? 'Gagal ganti kata sandi' };
      });
  },
});

export const { sessionExpired, resetPasswordActionState } = authSlice.actions;
export default authSlice.reducer;
