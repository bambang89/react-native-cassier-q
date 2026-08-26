import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import * as productsApi from '@/api/productsApi';
import type { ProductPhotoFile } from '@/api/productsApi';
import type { ProductPhoto } from '@/types/models';

type AsyncStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

type ProductPhotosState = {
  /** Di-cache per productId, sama seperti productUnitsSlice. */
  byProductId: Record<string, ProductPhoto[]>;
  statusByProductId: Record<string, AsyncStatus>;
  mutationStatus: AsyncStatus;
  mutationError: string | null;
};

const initialState: ProductPhotosState = {
  byProductId: {},
  statusByProductId: {},
  mutationStatus: 'idle',
  mutationError: null,
};

export const fetchProductPhotos = createAsyncThunk('productPhotos/fetchForProduct', async (productId: string) => {
  const items = await productsApi.fetchProductPhotos(productId);
  return { productId, items };
});

export const addProductPhoto = createAsyncThunk(
  'productPhotos/add',
  async ({ productId, file }: { productId: string; file: ProductPhotoFile }) => {
    const photo = await productsApi.addProductPhoto(productId, file);
    return { productId, photo };
  },
);

export const deleteProductPhoto = createAsyncThunk(
  'productPhotos/delete',
  async ({ productId, photoId }: { productId: string; photoId: string }) => {
    await productsApi.deleteProductPhoto(productId, photoId);
    return { productId, photoId };
  },
);

const productPhotosSlice = createSlice({
  name: 'productPhotos',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProductPhotos.pending, (state, action) => {
        state.statusByProductId[action.meta.arg] = 'loading';
      })
      .addCase(fetchProductPhotos.fulfilled, (state, action) => {
        state.statusByProductId[action.payload.productId] = 'succeeded';
        state.byProductId[action.payload.productId] = action.payload.items;
      })
      .addCase(fetchProductPhotos.rejected, (state, action) => {
        state.statusByProductId[action.meta.arg] = 'failed';
      })
      .addCase(addProductPhoto.pending, (state) => {
        state.mutationStatus = 'loading';
        state.mutationError = null;
      })
      .addCase(addProductPhoto.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded';
        const { productId, photo } = action.payload;
        state.byProductId[productId] = [...(state.byProductId[productId] ?? []), photo];
      })
      .addCase(addProductPhoto.rejected, (state, action) => {
        state.mutationStatus = 'failed';
        state.mutationError = action.error.message ?? 'Foto tidak bisa diupload';
      })
      .addCase(deleteProductPhoto.fulfilled, (state, action) => {
        const { productId, photoId } = action.payload;
        state.byProductId[productId] = (state.byProductId[productId] ?? []).filter((p) => p.id !== photoId);
      })
      .addCase(deleteProductPhoto.rejected, (state, action) => {
        state.mutationError = action.error.message ?? 'Foto tidak bisa dihapus';
      });
  },
});

export default productPhotosSlice.reducer;
