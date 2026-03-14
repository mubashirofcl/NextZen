import { configureStore } from "@reduxjs/toolkit";
import adminAuthReducer from "./admin/authSlice";
import userAuthReducer from "./user/authSlice";

const store = configureStore({
  reducer: {
    adminAuth: adminAuthReducer,
    userAuth: userAuthReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});

export default store;
