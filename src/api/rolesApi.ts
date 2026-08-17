import { apiClient } from './client';
import type { Role } from '@/types/models';

/** Daftar role yang bisa dipilih saat menambah karyawan. */
export async function fetchRoles(): Promise<Role[]> {
  const { data } = await apiClient.get<Role[]>('/roles');
  return data;
}
