import adminAxios from "./adminAxios";

/* ================= LIST ================= */
export const fetchAdminBrands = (params) => {
  return adminAxios.get("/admin/brands", { params });
};

/* ================= CREATE ================= */
export const createAdminBrand = (data) => {
  return adminAxios.post("/admin/brands", data);
};

export const updateAdminBrand = ({ id, ...data }) => {
  return adminAxios.patch(`/admin/brands/${id}`, data);
};

/* ================= TOGGLE STATUS ================= */
export const toggleAdminBrandStatus = (id) => {
  return adminAxios.patch(`/admin/brands/${id}/toggle`);
};

export const fetchAdminBrandsSelection = () => {
  return adminAxios.get("/admin/brands/selection");
};