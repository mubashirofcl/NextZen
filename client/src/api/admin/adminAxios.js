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
  headers: { "Content-Type": "application/json" },
});

adminAxios.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const code = error.response?.data?.code;

    if (!error.response) return Promise.reject(error);
``
    if (status === 401 && code === "TOKEN_EXPIRED" && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => adminAxios(originalRequest));
      }

      isRefreshing = true;

      try {
        await adminAxios.post("/admin/refresh");
        processQueue(null);
        isRefreshing = false;
        return adminAxios(originalRequest);
      } catch (err) {
        processQueue(err);
        isRefreshing = false;
        return Promise.reject(err); 
      }
    }

    if (
      originalRequest.url.includes("/admin/login") ||
      originalRequest.url.includes("/admin/refresh")
    ) {
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default adminAxios;
