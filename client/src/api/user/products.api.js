import userAxios from "../baseAxios";

export const fetchProducts = async (params) => {
    const formattedParams = { ...params };

    if (Array.isArray(formattedParams.brand) && formattedParams.brand.length > 0) {
        formattedParams.brand = formattedParams.brand.join(",");
    }

    if (Array.isArray(formattedParams.size) && formattedParams.size.length > 0) {
        formattedParams.size = formattedParams.size.join(",");
    }

    Object.keys(formattedParams).forEach(key => {
        if (formattedParams[key] === "" || formattedParams[key] === null || formattedParams[key] === undefined) {
            delete formattedParams[key];
        }
    });

    const { data } = await userAxios.get("/products", {
        params: formattedParams,
    });
    return data;
};

export const fetchProductById = async (id) => {
    const { data } = await userAxios.get(`/products/${id}`);
    return data;
};

export const fetchRecommendedProducts = async (subcategoryId, currentProductId) => {
    const { data } = await userAxios.get(`/products/recommended/${subcategoryId}/${currentProductId}`);
    return data;
};