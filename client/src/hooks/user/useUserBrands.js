import { useQuery } from "@tanstack/react-query";
import userAxios from "../../api/user/userAxios";

export const useUserBrands = () => {
  return useQuery({
    queryKey: ["userBrands"],
    queryFn: async () => {
      const { data } = await userAxios.get("/brands", {
        params: { isActive: true }
      });
      return data;
    }
  });
};
