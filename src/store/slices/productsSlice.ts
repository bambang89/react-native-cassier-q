import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import * as productsApi from '@/api/productsApi';
import type { FetchProductsParams, ProductPayload, ProductPhotoFile, RestockPayload } from '@/api/productsApi';
import type { Product } from '@/types/models';

type ProductsState = {
  items: Product[];
  search: string;
  page: number;
  totalPages: number;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  mutationStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  mutationError: string | null;
};

const initialState: ProductsState = {
  items: [],
  search: '',
  page: 0,
  totalPages: 0,
  status: 'idle',
  error: null,
  mutationStatus: 'idle',
  mutationError: null,
};

export const fetchProducts = createAsyncThunk(
  'products/fetchAll',
  async (params: FetchProductsParams = {}) => productsApi.fetchProducts(params),
);

export const fetchProductByBarcode = createAsyncThunk(
  'products/fetchByBarcode',
  async (barcode: string) => productsApi.fetchProductByBarcode(barcode),
);

export const createProduct = createAsyncThunk('products/create', async (payload: ProductPayload) =>
  productsApi.createProduct(payload),
);

export const updateProduct = createAsyncThunk(
  'products/update',
  async ({ id, payload }: { id: string; payload: ProductPayload }) => productsApi.updateProduct(id, payload),
);

export const uploadProductPhoto = createAsyncThunk(
  'products/uploadPhoto',
  async ({ id, file }: { id: string; file: ProductPhotoFile }) => productsApi.uploadProductPhoto(id, file),
);

export const deleteProduct = createAsyncThunk('products/delete', async (id: string) => {
  await productsApi.deleteProduct(id);
  return id;
});

export const restockProduct = createAsyncThunk(
  'products/restock',
  async ({ id, payload }: { id: string; payload: RestockPayload }) => productsApi.restockProduct(id, payload),
);

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setSearch(state, action: { payload: string }) {
      state.search = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const isNextPage = action.meta.arg.page && action.meta.arg.page > 0;
        state.items = isNextPage ? [...state.items, ...action.payload.content] : action.payload.content;
        state.page = action.payload.page;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Gagal memuat produk';
      })
      .addCase(createProduct.pending, (state) => {
        state.mutationStatus = 'loading';
        state.mutationError = null;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded';
        state.items.unshift(action.payload);
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.mutationStatus = 'failed';
        state.mutationError = action.error.message ?? 'Produk tidak bisa disimpan';
      })
      .addCase(updateProduct.pending, (state) => {
        state.mutationStatus = 'loading';
        state.mutationError = null;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded';
        const index = state.items.findIndex((item) => item.id === action.payload.id);
        if (index >= 0) state.items[index] = action.payload;
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.mutationStatus = 'failed';
        state.mutationError = action.error.message ?? 'Produk tidak bisa disimpan';
      })
      .addCase(uploadProductPhoto.fulfilled, (state, action) => {
        const index = state.items.findIndex((item) => item.id === action.payload.id);
        if (index >= 0) state.items[index] = action.payload;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item.id !== action.payload);
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.mutationError = action.error.message ?? 'Produk tidak bisa dinonaktifkan';
      })
      .addCase(restockProduct.fulfilled, (state, action) => {
        const index = state.items.findIndex((item) => item.id === action.payload.productId);
        if (index >= 0) state.items[index].stockQuantity = action.payload.quantityBaseUnit;
      })
      .addCase(restockProduct.rejected, (state, action) => {
        state.mutationError = action.error.message ?? 'Restock gagal';
      });
  },
});

export const { setSearch } = productsSlice.actions;
export default productsSlice.reducer;
