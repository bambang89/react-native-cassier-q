import { apiClient } from './client';
import type { Employee } from '@/types/models';

export interface CreateEmployeePayload {
  name: string;
  username: string;
  email?: string;
  phone?: string;
  password: string;
  /** KEPALA_TOKO | PRODUCT | GUDANG | KASIR */
  roleCode: string;
}

export interface UpdateEmployeePayload {
  name: string;
  email?: string;
  phone?: string;
  roleCode: string;
}

export async function fetchEmployees(): Promise<Employee[]> {
  const { data } = await apiClient.get<Employee[]>('/employees');
  return data;
}

export async function fetchEmployee(id: string): Promise<Employee> {
  const { data } = await apiClient.get<Employee>(`/employees/${id}`);
  return data;
}

/** Username & password TIDAK bisa diubah lewat update — hanya saat dibuat pertama kali. */
export async function createEmployee(payload: CreateEmployeePayload): Promise<Employee> {
  const { data } = await apiClient.post<Employee>('/employees', payload);
  return data;
}

export async function updateEmployee(id: string, payload: UpdateEmployeePayload): Promise<Employee> {
  const { data } = await apiClient.put<Employee>(`/employees/${id}`, payload);
  return data;
}

/** Akun tidak bisa login lagi & sesi aktif langsung dicabut. */
export async function deactivateEmployee(id: string): Promise<Employee> {
  const { data } = await apiClient.post<Employee>(`/employees/${id}/deactivate`);
  return data;
}

export async function reactivateEmployee(id: string): Promise<Employee> {
  const { data } = await apiClient.post<Employee>(`/employees/${id}/reactivate`);
  return data;
}
