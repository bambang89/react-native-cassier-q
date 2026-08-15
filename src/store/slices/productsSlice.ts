import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import * as productsApi from '../../api/productsApi';
import type { FetchProductsParams } from '../../api/productsApi';
import type { Product } from '../../types/models';

type ProductsState = {
  items: Product[];
  search: string;
  page: number;
  totalPages: number;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
};

const initialState: ProductsState = {
  items: [],
  search: '',
  page: 0,
  totalPages: 0,
  status: 'idle',
  error: null,
};

export const fetchProducts = createAsyncThunk(
  'products/fetchAll',
  async (params: FetchProductsParams = {}) => productsApi.fetchProducts(params),
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
      });
  },
});

export const { setSearch } = productsSlice.actions;
export default productsSlice.reducer;
