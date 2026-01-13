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

    // 🚫 Ignore admin routes
    if (originalRequest?.url?.includes("/admin")) {
      return Promise.reject(error);
    }

    // ================= BLOCKED USER =================
    if (status === 403 && data?.blocked) {
      window.dispatchEvent(
        new CustomEvent("USER_BLOCKED", {
          detail: data.reason || "Your account has been blocked",
        })
      );
      return Promise.reject(error);
    }

    // ================= TOKEN REFRESH =================
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await axios.post(
          `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/users/refresh`,
          {},
          { withCredentials: true }
        );
        return userAxios(originalRequest);
      } catch {
        window.dispatchEvent(new Event("USER_LOGOUT"));
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default userAxios;
