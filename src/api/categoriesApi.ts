import { apiClient } from './client';
import type { Category } from '@/types/models';

export async function fetchCategories(): Promise<Category[]> {
  const { data } = await apiClient.get<Category[]>('/categories');
  return data;
}

export interface CategoryPayload {
  categoryCode: string;
  categoryName: string;
  parentCategoryId?: string;
}

export async function createCategory(payload: CategoryPayload): Promise<Category> {
  const { data } = await apiClient.post<Category>('/categories', payload);
  return data;
}

export async function deleteCategory(id: string): Promise<void> {
  await apiClient.delete(`/categories/${id}`);
}
