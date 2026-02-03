import userAxios from "../../api/user/userAxios";

export const fetchWishlistApi = async () => {
    const { data } = await userAxios.get("/user/wishlist");
    return data;
};

export const toggleWishlistApi = async (productId, variantId) => {
    const { data } = await userAxios.post("/user/wishlist/toggle", {
        productId,
        variantId
    });
    return data;
};

export const clearWishlistApi = async () => {
    const { data } = await userAxios.delete("/user/wishlist/clear");
    return data;
};