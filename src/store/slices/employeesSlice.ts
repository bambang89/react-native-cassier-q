import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import * as employeesApi from '@/api/employeesApi';
import type { CreateEmployeePayload, UpdateEmployeePayload } from '@/api/employeesApi';
import type { Employee } from '@/types/models';

type AsyncStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

type EmployeesState = {
  items: Employee[];
  status: AsyncStatus;
  error: string | null;
  mutationStatus: AsyncStatus;
  mutationError: string | null;
};

const initialState: EmployeesState = {
  items: [],
  status: 'idle',
  error: null,
  mutationStatus: 'idle',
  mutationError: null,
};

export const fetchEmployees = createAsyncThunk('employees/fetchAll', employeesApi.fetchEmployees);

export const createEmployee = createAsyncThunk('employees/create', async (payload: CreateEmployeePayload) =>
  employeesApi.createEmployee(payload),
);

export const updateEmployee = createAsyncThunk(
  'employees/update',
  async ({ id, payload }: { id: string; payload: UpdateEmployeePayload }) =>
    employeesApi.updateEmployee(id, payload),
);

export const deactivateEmployee = createAsyncThunk('employees/deactivate', async (id: string) =>
  employeesApi.deactivateEmployee(id),
);

export const reactivateEmployee = createAsyncThunk('employees/reactivate', async (id: string) =>
  employeesApi.reactivateEmployee(id),
);

const employeesSlice = createSlice({
  name: 'employees',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmployees.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Gagal memuat karyawan';
      })
      .addCase(createEmployee.pending, (state) => {
        state.mutationStatus = 'loading';
        state.mutationError = null;
      })
      .addCase(createEmployee.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded';
        state.items.push(action.payload);
      })
      .addCase(createEmployee.rejected, (state, action) => {
        state.mutationStatus = 'failed';
        state.mutationError = action.error.message ?? 'Karyawan tidak bisa ditambahkan (mungkin username sudah dipakai)';
      })
      .addCase(updateEmployee.fulfilled, (state, action) => {
        const index = state.items.findIndex((item) => item.employeeId === action.payload.employeeId);
        if (index >= 0) state.items[index] = action.payload;
      })
      .addCase(updateEmployee.rejected, (state, action) => {
        state.mutationStatus = 'failed';
        state.mutationError = action.error.message ?? 'Data karyawan tidak bisa disimpan';
      })
      .addCase(deactivateEmployee.fulfilled, (state, action) => {
        const index = state.items.findIndex((item) => item.employeeId === action.payload.employeeId);
        if (index >= 0) state.items[index] = action.payload;
      })
      .addCase(reactivateEmployee.fulfilled, (state, action) => {
        const index = state.items.findIndex((item) => item.employeeId === action.payload.employeeId);
        if (index >= 0) state.items[index] = action.payload;
      });
  },
});

export default employeesSlice.reducer;
