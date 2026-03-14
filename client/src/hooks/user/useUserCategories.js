import { useQuery } from "@tanstack/react-query";
import userAxios from "../../api/user/userAxios";

export const useUserCategories = () => {
  return useQuery({
    queryKey: ["userCategories"],
    queryFn: async () => {
      const { data } = await userAxios.get("/categories", {
        params: { isActive: true }
      });
      return data;
    }
  });
};
