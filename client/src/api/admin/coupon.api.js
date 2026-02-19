import adminAxios from "./adminAxios";

export const getCouponsApi = async () => {
    const { data } = await adminAxios.get("/admin/coupons");
    return data;
};

export const getCouponByIdApi = async (id) => {
    const { data } = await adminAxios.get(`/admin/coupons/${id}`);
    return data;
};

export const createCouponApi = async (couponData) => {
    const { data } = await adminAxios.post("/admin/coupons", couponData);
    return data;
};

export const updateCouponApi = async ({ id, data }) => {
    const { data: response } = await adminAxios.patch(`/admin/coupons/${id}`, data);
    return response;
};
export const deleteCouponApi = async (couponId) => {
    const { data } = await adminAxios.delete(`/admin/coupons/${couponId}`);
    return data;
};

