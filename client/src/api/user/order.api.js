import userAxios from "../baseAxios";

export const placeCodOrderApi = async (orderPayload) => {
    const { data } = await userAxios.post("/users/orders/place-cod", orderPayload);
    return data;
};

export const getCheckoutManifestApi = async () => {
    const { data } = await userAxios.get("/users/cart/validate-checkout");
    return data;
};

export const cancelOrderItemApi = async (orderId, itemId, reason) => {
    const { data } = await userAxios.patch(`/users/orders/${orderId}/items/${itemId}/cancel`, { reason });
    return data;
};

export const cancelFullOrderApi = async (orderId, reason) => {
    const { data } = await userAxios.patch(`/users/orders/${orderId}/cancel-all`, { reason });
    return data;
};

export const returnOrderItemApi = async (orderId, itemId, reason) => {
    const { data } = await userAxios.patch(`/users/orders/${orderId}/items/${itemId}/return`, { reason });
    return data;
};