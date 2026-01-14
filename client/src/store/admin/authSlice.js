import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getAdminMe, adminLogout } from "../../api/admin/admin.api";

// =======================
// Fetch admin session
// =======================
export const fetchAdmin = createAsyncThunk(
  "adminAuth/fetchAdmin",
  async (_, { rejectWithValue }) => {
    try {
      const res = await getAdminMe();
      return res.admin;
    } catch {
      return rejectWithValue("UNAUTHORIZED");
    }
  }
);

// =======================
// Logout admin
// =======================
export const logoutAdmin = createAsyncThunk(
  "adminAuth/logoutAdmin",
  async (_, { rejectWithValue }) => {
    try {
      await adminLogout();
      return true;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Logout failed");
    }
  }
);

// =======================
// Slice
// =======================
const adminAuthSlice = createSlice({
  name: "adminAuth",
  initialState: {
    admin: null,
    loading: true,
    isAuthenticated: false,
  },
  reducers: {
    clearAdmin: (state) => {
      state.admin = null;
      state.loading = false;
      state.isAuthenticated = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdmin.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAdmin.fulfilled, (state, action) => {
        state.admin = action.payload;
        state.isAuthenticated = true;
        state.loading = false;
      })
      .addCase(fetchAdmin.rejected, (state) => {
        state.admin = null;
        state.isAuthenticated = false;
        state.loading = false; // This gets you off the spinner
      })
      .addCase(logoutAdmin.fulfilled, (state) => {
        state.admin = null;
        state.isAuthenticated = false;
        state.loading = false;
      });
  },
});

export const { clearAdmin } = adminAuthSlice.actions;
export default adminAuthSlice.reducer;
