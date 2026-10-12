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

export type MyMenuAccess = { restricted: boolean; menus: string[] };

export type MenuAccessMatrix = { menus: string[]; roles: Record<string, string[]> };

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

export async function updateMenuAccess(roleCode: string, menus: string[]): Promise<MenuAccessMatrix> {
  const { data } = await apiClient.put<MenuAccessMatrix>(`/store/menu-access/${roleCode}`, { menus });
  return data;
}
