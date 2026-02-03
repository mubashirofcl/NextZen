import userAxios from "../baseAxios";

export const fetchCart = async () => {
    const { data } = await userAxios.get("/user/cart");
    return data;
};

export const addItemToCart = async (payload) => {
    const { data } = await userAxios.post("/user/cart/add", payload);
    return data;
};

export const updateCartQuantityApi = async (itemId, action) => {
    const { data } = await userAxios.patch(`/user/cart/update/${itemId}`, { action });
    return data;
};

export const removeCartItemApi = async (itemId) => {
    const { data } = await userAxios.delete(`/user/cart/remove/${itemId}`);
    return data;
};

export const clearCartApi = async () => {
  const { data } = await userAxios.delete("/user/cart/clear");
  return data;
};
