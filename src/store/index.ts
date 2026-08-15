import { configureStore } from '@reduxjs/toolkit';

import authReducer from './slices/authSlice';
import cartReducer from './slices/cartSlice';
import productsReducer from './slices/productsSlice';
import categoriesReducer from './slices/categoriesSlice';
import cashierSessionReducer from './slices/cashierSessionSlice';
import ordersReducer from './slices/ordersSlice';
import reportsReducer from './slices/reportsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    products: productsReducer,
    categories: categoriesReducer,
    cashierSession: cashierSessionReducer,
    orders: ordersReducer,
    reports: reportsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
