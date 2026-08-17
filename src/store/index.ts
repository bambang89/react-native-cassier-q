import { configureStore } from '@reduxjs/toolkit';

import authReducer from './slices/authSlice';
import cartReducer from './slices/cartSlice';
import productsReducer from './slices/productsSlice';
import productUnitsReducer from './slices/productUnitsSlice';
import categoriesReducer from './slices/categoriesSlice';
import unitsReducer from './slices/unitsSlice';
import cashierSessionReducer from './slices/cashierSessionSlice';
import ordersReducer from './slices/ordersSlice';
import reportsReducer from './slices/reportsSlice';
import storeProfileReducer from './slices/storeProfileSlice';
import customersReducer from './slices/customersSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    products: productsReducer,
    productUnits: productUnitsReducer,
    categories: categoriesReducer,
    units: unitsReducer,
    cashierSession: cashierSessionReducer,
    orders: ordersReducer,
    reports: reportsReducer,
    storeProfile: storeProfileReducer,
    customers: customersReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
