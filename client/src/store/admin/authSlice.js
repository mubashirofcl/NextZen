import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getAdminMe, adminLogout } from "../../api/admin/admin.api";

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

export const logoutAdmin = createAsyncThunk(
  "adminAuth/logout",
  async (_, { dispatch }) => {
    await adminLogout();
    dispatch(clearAdmin());
  }
);

const adminAuthSlice = createSlice({
  name: "adminAuth",
  initialState: {
    admin: null,
    loading: true,
    error: null,
  },
  reducers: {
    clearAdmin: (state) => {
      state.admin = null;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdmin.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAdmin.fulfilled, (state, action) => {
        state.admin = action.payload;
        state.loading = false;
      })
      .addCase(fetchAdmin.rejected, (state) => {
        state.admin = null;
        state.loading = false;
      });
  },
});

export const { clearAdmin } = adminAuthSlice.actions;
export default adminAuthSlice.reducer;
