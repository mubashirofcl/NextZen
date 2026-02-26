import adminAxios from "./adminAxios";


export const fetchAdminBrands = (params) => {
  return adminAxios.get("/admin/brands", { params });
};

export const createAdminBrand = (data) => {
  return adminAxios.post("/admin/brands", data);
};

export const updateAdminBrand = ({ id, ...data }) => {
  return adminAxios.patch(`/admin/brands/${id}`, data);
};

export const toggleAdminBrandStatus = (id) => {
  return adminAxios.patch(`/admin/brands/${id}/toggle`);
};

export const fetchAdminBrandsSelection = () => {
  return adminAxios.get("/admin/brands/selection");
};