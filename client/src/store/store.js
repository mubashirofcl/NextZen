import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./admin/authSlice";
import userAuthReducer from "./user/authSlice";
import adminUserMgmtReducer from "./admin/adminUserMgmtSlice"; 

const store = configureStore({
    reducer: {
        adminAuth: authReducer,
        userAuth: userAuthReducer,
        adminUserMgmt: adminUserMgmtReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false,
        }),
});

export default store;