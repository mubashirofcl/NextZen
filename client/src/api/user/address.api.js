import userAxios from "../baseAxios";


export const fetchAddresses = () =>
  userAxios.get("/users/addresses");

export const createAddress = (data) =>
  userAxios.post("/users/addresses", data);

export const updateAddress = (id, data) =>
  userAxios.patch(`/users/addresses/${id}`, data);

export const deleteAddress = (id) =>
  userAxios.delete(`/users/addresses/${id}`);

export const setDefaultAddress = (id) =>
  userAxios.patch(`/users/addresses/${id}/default`);

