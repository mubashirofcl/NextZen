import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getUserMe } from "../../api/user/user.api";

export const fetchUser = createAsyncThunk(
    "userAuth/fetchUser",
    async (_, { rejectWithValue }) => {
        try {
            const res = await getUserMe();
            return res.data?.user || res.data;
        } catch (err) {
            return rejectWithValue("UNAUTHORIZED");
        }
    }
);

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

        setUser: (state, action) => {
            state.user = state.user
                ? { ...state.user, ...action.payload }
                : action.payload;

            state.isAuthenticated = true;
            state.loading = false;
        },
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

export const { clearUser, stopLoading, setUser } = userAuthSlice.actions;
export default userAuthSlice.reducer;
