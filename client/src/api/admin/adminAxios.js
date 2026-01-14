import axios from "axios";

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve()));
  failedQueue = [];
};

const adminAxios = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
});

adminAxios.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const code = error.response?.data?.code;

    const skipRoutes = ["/admin/login", "/admin/refresh"];
    if (skipRoutes.some((r) => originalRequest.url.includes(r))) {
      return Promise.reject(error);
    }

    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        await adminAxios.post("/admin/refresh");
        return adminAxios(originalRequest);
      } catch (err) {
        window.dispatchEvent(new Event("ADMIN_LOGOUT"));
        return Promise.reject(err);
      }
    }


    if (status === 401 && ["NO_TOKEN", "INVALID_TOKEN", "SESSION_EXPIRED"].includes(code)) {
      window.dispatchEvent(new Event("ADMIN_LOGOUT"));
    }

    return Promise.reject(error);
  }
);

export default adminAxios;
