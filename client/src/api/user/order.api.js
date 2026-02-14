import userAxios from "../baseAxios";

export const placeCodOrderApi = async (orderPayload) => {
    const { data } = await userAxios.post("/users/orders/place-cod", orderPayload);
    return data;
};

export const fetchUserOrdersApi = async () => {
    const { data } = await userAxios.get("/users/orders");
    return data;
};

export const fetchOrderDetailApi = async (orderId) => {
    const { data } = await userAxios.get(`/users/orders/${orderId}`);
    return data;
};

export const cancelOrderItemApi = async ({ orderId, itemId, reason }) => {
    const { data } = await userAxios.patch(`/users/orders/${orderId}/items/${itemId}/cancel`, { reason });
    return data;
};

export const cancelFullOrderApi = async ({ orderId, reason }) => {
    const { data } = await userAxios.patch(`/users/orders/${orderId}/cancel-all`, { reason });
    return data;
};

export const returnOrderItemApi = async ({ orderId, itemId, reason }) => {
    const { data } = await userAxios.patch(`/users/orders/${orderId}/items/${itemId}/return`, { reason });
    return data;
};