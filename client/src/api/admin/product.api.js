import adminAxios from "./adminAxios";

/* ---------- PRODUCTS ---------- */

// CREATE product + variants
export const createProductAPI = (payload) => {
  return adminAxios.post("/admin/products", payload);
};

// GET product details (edit mode)
export const getProductDetailsAPI = (id) => {
  return adminAxios.get(`/admin/products/${id}`);
};

// UPDATE product (basic info)
export const updateProductAPI = ({ id, data }) => {
  return adminAxios.patch(`/admin/products/${id}`, data);
};

// DELETE (soft delete)
export const deleteProductAPI = (id) => {
  return adminAxios.delete(`/admin/products/${id}`);
};
