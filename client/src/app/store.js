import { configureStore } from '@reduxjs/toolkit';
import authReducer    from '../features/auth/authSlice.js';
import paymentReducer from '../features/payment/paymentSlice.js';
import contentReducer from '../features/content/contentSlice.js';
import lmsReducer     from '../features/lms/lmsSlice.js';
import { baseApi }    from '../utils/api.js';

export const store = configureStore({
  reducer: {
    auth:                  authReducer,
    payment:               paymentReducer,
    content:               contentReducer,
    lms:                   lmsReducer,
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefault) => getDefault().concat(baseApi.middleware),
});
