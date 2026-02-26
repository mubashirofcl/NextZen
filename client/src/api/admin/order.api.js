import adminAxios from "./adminAxios";

export const getAdminOrders = async (filters) => {
    const response = await adminAxios.get("/admin/orders", { params: filters });
    return response.data;
};

export const getAdminOrderDetails = async (orderId) => {
    const response = await adminAxios.get(`/admin/orders/${orderId}`);
    return response.data;
};

export const updateOrderStatus = async ({ orderId, ...payload }) => {
    const response = await adminAxios.patch(`/admin/orders/status/${orderId}`, payload);
    return response.data;
};

export const handleReturnAction = async ({ orderId, ...payload }) => {
    const response = await adminAxios.post(`/admin/orders/return-action`, payload);
    return response.data;
};