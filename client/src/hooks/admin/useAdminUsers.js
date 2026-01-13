import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchAllUsers,
  blockUser,
  unblockUser,
} from "../../api/admin/userManagement.api";

/* ===================== QUERY ===================== */

export const useAdminUsers = ({ page, search, status }) => {
  return useQuery({
    queryKey: ["admin-users", { page, search, status }],
    queryFn: () =>
      fetchAllUsers({
        page,
        search,
        status,
      }),
    keepPreviousData: true,
  });
};

/* ===================== MUTATIONS ===================== */

export const useBlockUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, reason }) => blockUser(userId, reason),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin-users"],
      });
    },
  });
};

export const useUnblockUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId) => unblockUser(userId),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin-users"],
      });
    },
  });
};
