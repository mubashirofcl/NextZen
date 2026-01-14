import baseAxios from "../baseAxios";

export const fetchAllUsers = async ({ page = 1, limit = 5, search = "", status = "" }) => {
    try {
        const response = await baseAxios.get('/admin/users', {
            params: { page, limit, search, status }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: "Failed to load users" };
    }
};

export const getUserStats = async () => {
    try {
        const response = await baseAxios.get('/admin/users/stats');
        return responsae.data;
    } catch (error) {
        throw error.response?.data || { message: "Failed to load statistics" };
    }
};


export const blockUser = async (userId, reason) => {
    try {
        const response = await baseAxios.patch(`/admin/users/${userId}/block`, { reason });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: "Block action failed" };
    }
};


export const unblockUser = async (userId) => {
    try {
        const response = await baseAxios.patch(`/admin/users/${userId}/unblock`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: "Unblock action failed" };
    }
};