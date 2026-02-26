import adminAxios from "./adminAxios";

export const createProductAPI = (payload) => {
  return adminAxios.post("/admin/products", payload);
};


export const getProductDetailsAPI = (id) => {
  return adminAxios.get(`/admin/products/${id}`);
};

export const updateProductAPI = ({ id, data }) => {
  return adminAxios.patch(`/admin/products/${id}`, data);
};

export const deleteProductAPI = (id) => {
  return adminAxios.delete(`/admin/products/${id}`);
};
