import adminAxios from "./adminAxios";

// Fetch paginated list of all manifests
export const getAdminOrders = async (filters) => {
    const response = await adminAxios.get("/admin/orders", { params: filters });
    return response.data;
};

// Fetch deep details for a specific manifest
export const getAdminOrderDetails = async (orderId) => {
    const response = await adminAxios.get(`/admin/orders/${orderId}`);
    return response.data;
};

// Unified update for Logistics, Items, and Refunds
export const updateOrderStatus = async ({ orderId, ...payload }) => {
    const response = await adminAxios.patch(`/admin/orders/status/${orderId}`, payload);
    return response.data;
};

// Specialized endpoint for Return Approvals (Approve/Reject/Complete)
export const handleReturnAction = async ({ orderId, ...payload }) => {
    const response = await adminAxios.post(`/admin/orders/return-action`, payload);
    return response.data;
};