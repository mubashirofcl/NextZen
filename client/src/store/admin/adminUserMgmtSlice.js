import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as userMgmtAPI from "../../api/admin/userManagement.api";

export const fetchUsersList = createAsyncThunk(
    "adminUserMgmt/fetchUsers",
    async (params, { rejectWithValue }) => {
        try {
            return await userMgmtAPI.fetchAllUsers(params);
        } catch (err) {
            return rejectWithValue(err.message || "Failed to fetch users");
        }
    }
);

export const blockUserAction = createAsyncThunk(
    "adminUserMgmt/blockUser",
    async ({ userId, reason }, { rejectWithValue }) => {
        try {
            return await userMgmtAPI.blockUser(userId, reason);
        } catch (err) {
            return rejectWithValue(err.message || "Failed to block user");
        }
    }
);

export const unblockUserAction = createAsyncThunk(
    "adminUserMgmt/unblockUser",
    async (userId, { rejectWithValue }) => {
        try {
            return await userMgmtAPI.unblockUser(userId);
        } catch (err) {
            return rejectWithValue(err.message || "Failed to unblock user");
        }
    }
);


const adminUserMgmtSlice = createSlice({
    name: "adminUserMgmt",
    initialState: {
        users: [],
        pagination: {
            currentPage: 1,
            totalPages: 1,
            totalUsers: 0,
        },
        loading: false,
        error: null,
    },
    reducers: {
        updateUserInList: (state, action) => {
            state.users = state.users.map((user) =>
                user._id === action.payload._id ? action.payload : user
            );
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchUsersList.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchUsersList.fulfilled, (state, action) => {
                state.loading = false;
                state.users = action.payload.users || [];
                state.pagination = {
                    currentPage: action.payload.currentPage || 1,
                    totalPages: action.payload.totalPages || 1,
                    totalUsers: action.payload.totalUsers || 0
                };
            })
            .addCase(fetchUsersList.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(blockUserAction.fulfilled, (state, action) => {
                state.users = state.users.map((user) =>
                    user._id === action.payload.data._id ? action.payload.data : user
                );
            })
            .addCase(unblockUserAction.fulfilled, (state, action) => {
                state.users = state.users.map((user) =>
                    user._id === action.payload.data._id ? action.payload.data : user
                );
            });
    },
});

export const { updateUserInList } = adminUserMgmtSlice.actions;
export default adminUserMgmtSlice.reducer;