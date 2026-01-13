import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getUserMe } from "../../api/user/user.api";

// =======================
// Fetch user session
// =======================
export const fetchUser = createAsyncThunk(
  "userAuth/fetchUser",
  async (_, { rejectWithValue }) => {
    try {
      const res = await getUserMe();
      return res.data?.user || res.data;
    } catch {
      return rejectWithValue("UNAUTHORIZED");
    }
  }
);

// =======================
// Slice
// =======================
const userAuthSlice = createSlice({
  name: "userAuth",
  initialState: {
    user: null,
    loading: true,
    isAuthenticated: false,
  },
  reducers: {
    clearUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.loading = false;
    },

    // Used after profile update / email change
    setUser: (state, action) => {
      state.user = state.user
        ? { ...state.user, ...action.payload }
        : action.payload;

      state.isAuthenticated = true;
      state.loading = false;
    },

    // Used when app decides auth check is complete
    stopLoading: (state) => {
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.loading = false;
      })
      .addCase(fetchUser.rejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.loading = false;
      });
  },
});

export const { clearUser, setUser, stopLoading } = userAuthSlice.actions;
export default userAuthSlice.reducer;
