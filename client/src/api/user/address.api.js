import userAxios from "../baseAxios";

// GET all addresses
export const fetchAddresses = () =>
  userAxios.get("/users/addresses");

// CREATE address
export const createAddress = (data) =>
  userAxios.post("/users/addresses", data);

// UPDATE address
export const updateAddress = (id, data) =>
  userAxios.patch(`/users/addresses/${id}`, data);

// DELETE address
export const deleteAddress = (id) =>
  userAxios.delete(`/users/addresses/${id}`);

// SET default address
export const setDefaultAddress = (id) =>
  userAxios.patch(`/users/addresses/${id}/default`);

