import adminAxios from "./adminAxios";

export const adminLogin = async (payload) => {
  const res = await adminAxios.post("/admin/login", payload);
  return res.data;
};

export const getAdminMe = async () => {
  const res = await adminAxios.get("/admin/me");
  return res.data; 
};

export const refreshAdminToken = async () => {
  const res = await adminAxios.post("/admin/refresh");
  return res.data;
};

export const adminLogout = async () => {
  const res = await adminAxios.post("/admin/logout");
  return res.data;
};

export const getSalesReport = (params) =>
  adminAxios.get("/admin/sales-report", { params });

export const getDashboardStats = async (params) => {
  const res = await adminAxios.get("/admin/dashboard-stats", { params });
  return res.data;
};