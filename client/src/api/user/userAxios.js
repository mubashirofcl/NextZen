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

    if (status === 403 && data?.blocked) {
      
      localStorage.removeItem("user"); 
      localStorage.removeItem("cart"); // Optional: clear sensitive data
      
      // 2. Store message for the Login page to display
      sessionStorage.setItem(
        "BLOCKED_MESSAGE",
        data.reason || "Your access has been revoked."
      );

      // 3. Force hard redirect to Login
      // Using window.location ensures a full state reset
      window.location.href = "/login";
      
      return Promise.reject(error);
    }

    // ================= 🔄 TOKEN REFRESH LOGIC =================
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
        window.dispatchEvent(new Event("USER_LOGOUT")); // Custom event listener for logout
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default userAxios;