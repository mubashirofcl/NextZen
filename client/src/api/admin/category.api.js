import adminAxios from "../../api/admin/adminAxios";

/* ================= FETCH ================= */

export const fetchAdminCategories = async ({
  page,
  search,
  status,
  type,
  parentId,
}) => {
  const { data } = await adminAxios.get("/admin/categories", {
    params: {
      page,
      search,
      status,
      type,
      parentId,
    },
  });

  return data;
};

export const fetchAdminSubCategories = async (params) => {
  const { data } = await adminAxios.get("/admin/categories/sub", { params });
  return data;
};

/* ================= CREATE ================= */

export const createAdminCategory = async (payload) => {
  const { data } = await adminAxios.post("/admin/categories", payload);
  return data;
};

/* ================= UPDATE ================= */

export const updateAdminCategory = async ({ id, ...payload }) => {
  if (!id) {
    throw new Error("Category ID is required for update");
  }

  const { data } = await adminAxios.patch(
    `/admin/categories/${id}`,
    payload
  );

  return data;
};

/* ================= SOFT DELETE ================= */

export const deleteAdminCategory = async (id) => {
  if (!id) {
    throw new Error("Category ID is required for delete");
  }

  const { data } = await adminAxios.delete(
    `/admin/categories/${id}`
  );

  return data;
};
