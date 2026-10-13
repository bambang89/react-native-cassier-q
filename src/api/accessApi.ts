import { apiClient } from './client';

export type AdminStore = {
  id: string;
  storeCode: string;
  storeName: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  status: string;
  parentStoreId: string | null;
};

/** `actions` = izin aksi di dalam menu, mis. "products.create" (semua aksi untuk Kepala Toko). */
export type MyMenuAccess = { restricted: boolean; menus: string[]; actions?: string[] };

export type ActionDef = { code: string; label: string };

export type MenuAccessMatrix = {
  menus: string[];
  roles: Record<string, string[]>;
  /** Menu → aksi yang bisa diatur; menu yang tidak ada di sini hanya bisa dilihat. */
  actions?: Record<string, ActionDef[]>;
  /** Role staf → aksi yang diizinkan. */
  roleActions?: Record<string, string[]>;
};

/** SUPERADMIN: semua toko di aplikasi. */
export async function fetchAdminStores(): Promise<AdminStore[]> {
  const { data } = await apiClient.get<AdminStore[]>('/admin/stores');
  return data;
}

/** Menu yang boleh tampil untuk user yang sedang login. */
export async function fetchMyMenus(): Promise<MyMenuAccess> {
  const { data } = await apiClient.get<MyMenuAccess>('/store/menu-access/me');
  return data;
}

/** KEPALA_TOKO/SUPERADMIN: matriks role staf → menu di toko ini. */
export async function fetchMenuAccess(): Promise<MenuAccessMatrix> {
  const { data } = await apiClient.get<MenuAccessMatrix>('/store/menu-access');
  return data;
}

export async function updateMenuAccess(roleCode: string, menus: string[], actions?: string[]): Promise<MenuAccessMatrix> {
  const { data } = await apiClient.put<MenuAccessMatrix>(`/store/menu-access/${roleCode}`, { menus, actions });
  return data;
}
