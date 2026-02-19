import adminAxios from "./adminAxios";

export const getOffersApi = async () => {
    const { data } = await adminAxios.get("/admin/offers");
    return data;
};

export const getOfferByIdApi = async (id) => {
    const { data } = await adminAxios.get(`/admin/offers/${id}`);
    return data;
};

export const createOfferApi = async (payload) => {
    const { data } = await adminAxios.post("/admin/offers", payload);
    return data;
};

export const updateOfferApi = async ({ id, data }) => {
    const { data: response } = await adminAxios.patch(`/admin/offers/${id}`, data);
    return response;
};

export const deleteOfferApi = async (id) => {
    const { data } = await adminAxios.delete(`/admin/offers/${id}`);
    return data;
};