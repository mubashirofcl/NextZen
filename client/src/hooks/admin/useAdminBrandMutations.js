import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    createAdminBrand,
    updateAdminBrand,
    toggleAdminBrandStatus,
} from "../../api/admin/brands.api";

/* ================= CREATE ================= */

export const useCreateBrand = () => {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: createAdminBrand,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin-brands"], exact: false });
        },
    });
};

/* ================= UPDATE ================= */

export const useUpdateBrand = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: updateAdminBrand,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin-brands-selection"] });
            qc.invalidateQueries({ queryKey: ["admin-brands"] });
        },
    });
};

/* ================= TOGGLE ACTIVE ================= */

export const useToggleBrandStatus = () => {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: (id) => toggleAdminBrandStatus(id),

        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin-brands-selection"] });
            qc.invalidateQueries({ queryKey: ["admin-brands"] });
        },
    });
};
