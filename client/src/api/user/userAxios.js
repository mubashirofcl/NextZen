import axios from "axios";

const userAxios = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

userAxios.interceptors.response.use(
  (res) => res,
  async (error) => {
    const status = error.response?.status;
    const data = error.response?.data;
    const originalRequest = error.config;
    const isAdminRequest = originalRequest?.url?.includes("/admin");

    if (isAdminRequest) {
      return Promise.reject(error);
    }

    // ==================== 1. HANDLED BLOCKED USER ====================
    if (status === 403 && data?.blocked) {
      const { default: store } = await import("../../store/store");
      const { clearUser } = await import("../../store/user/authSlice");

      store.dispatch(clearUser());

      window.dispatchEvent(
        new CustomEvent("USER_BLOCKED", {
          detail: data.reason || "Your account has been blocked",
        })
      );

      return Promise.reject(error);
    }

    // ==================== 2. HANDLE TOKEN EXPIRED (SILENT REFRESH) ====================
    // If 401 and we haven't tried to refresh yet (_retry check)
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // We use standard axios here to avoid looping back into this interceptor
        await axios.post(
          `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/users/refresh`,
          {},
          { withCredentials: true }
        );

        // If refresh worked, cookies are updated. Retry the original request (e.g., profile update)
        return userAxios(originalRequest);
      } catch (refreshError) {
        // If refresh also fails (refresh token expired), THEN log out
        const { default: store } = await import("../../store/store");
        const { clearUser } = await import("../../store/user/authSlice");

        store.dispatch(clearUser());
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default userAxios;