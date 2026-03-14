import { useQuery } from "@tanstack/react-query";
import userAxios from "../../api/user/userAxios";

export const useUserSubCategories = (parentId) => {
    return useQuery({
        queryKey: ["userSubCategories", parentId],
        queryFn: async () => {
            const { data } = await userAxios.get("/categories/sub", {
                params: { parentId },
            });
            return data;
        },
        enabled: !!parentId,
    });
};
