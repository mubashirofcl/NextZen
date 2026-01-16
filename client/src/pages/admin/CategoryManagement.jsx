import React, { useState, useEffect } from "react";
import { Plus, Edit3, Tag, Layers, List, Search, Ban, CheckCircle, Trash2 } from "lucide-react";

import AdminSidebar from "../../components/admin/AdminSidebar";
import DataTable from "../../tables/admin/DataTable";
import CategoryModal from "../../components/admin/CategoryModal";
import SubCategoryModal from "../../components/admin/SubCategoryModal";

import { useAdminCategories } from "../../hooks/admin/useAdminCategories";
import {
    useCreateCategory,
    useDeleteCategory,
    useUpdateCategory,
} from "../../hooks/admin/useAdminCategoryMutations";
import { adminToast } from "../../utils/adminToast";

const CategoryManagement = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [page, setPage] = useState(1);

    const [catModal, setCatModal] = useState(false);
    const [subModal, setSubModal] = useState(false);

    const [selectedCategory, setSelectedCategory] = useState(null);
    const [mode, setMode] = useState("add");

    const createCategory = useCreateCategory();
    const updateCategory = useUpdateCategory();

    /* ------------------ SEARCH DEBOUNCE ------------------ */
    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(searchTerm), 400);
        return () => clearTimeout(t);
    }, [searchTerm]);

    /* ------------------ FETCH LEVEL 1 ------------------ */
    const { data, isLoading } = useAdminCategories({
        page,
        search: debouncedSearch,
        level: 1,
    });

    const categories = data?.items ?? [];
    const pagination = {
        page: data?.currentPage ?? 1,
        pages: data?.totalPages ?? 1,
        total: data?.totalItems ?? 0,
    };

    /* ------------------ SUBMIT CATEGORY ------------------ */
    const submitCategory = async (payload) => {
        if (mode === "add") {
            await createCategory.mutateAsync(payload);
        } else {
            await updateCategory.mutateAsync(payload);
        }
    };

    const toggleCategoryStatus = (cat) => {
        const isDeactivating = cat.isActive;

        adminToast.confirm(
            isDeactivating ? "Deactivate Category?" : "Activate Category?",
            isDeactivating
                ? "This category will be hidden from customers."
                : "This category will be visible to customers.",
            async () => {
                try {
                    await updateCategory.mutateAsync({
                        id: cat._id,
                        isActive: !cat.isActive,
                    });

                    adminToast.success(
                        "Status Updated",
                        `Category is now ${!cat.isActive ? "Active" : "Disabled"}`
                    );
                } catch {
                    adminToast.error("Update Failed");
                }
            }
        );
    };

    const deleteMutation = useDeleteCategory();

    const handleDeleteCategory = async (id) => {
        try {
            await deleteMutation.mutateAsync(id);
            adminToast.success("Category Deleted", "Category moved to trash");
        } catch {
            adminToast.error("Delete Failed");
        }
    };



    return (
        <div className="min-h-screen flex bg-[#f8fafc] p-3 gap-3">
            <AdminSidebar />

            <main className="flex-1 flex flex-col gap-3 overflow-hidden">
                {/* HEADER - SYNCHRONIZED DESIGN */}
                <header className="bg-white/80 backdrop-blur-md border border-white rounded-[20px] px-6 py-3 flex justify-between items-center shadow-sm">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                        Admin / <span className="text-[#0F172A] font-black">Categories</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setPage(1);
                                }}
                                placeholder="Search catalog..."
                                className="pl-9 pr-8 py-2 bg-slate-100/50 focus:bg-white rounded-xl text-xs w-64 outline-none transition-all"
                            />
                        </div>

                        <button
                            onClick={() => {
                                setMode("add");
                                setSelectedCategory(null);
                                setCatModal(true);
                            }}
                            className="bg-[#0F172A] text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-[#112552] transition-all shadow-lg shadow-[#7a6af6]/20 active:scale-95"
                        >
                            <Plus size={14} strokeWidth={3} /> Add Category
                        </button>
                    </div>
                </header>

                {/* TABLE SECTION */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                    <div className="bg-white rounded-[20px] shadow-sm overflow-hidden">
                        <div className="p-5 border-b flex justify-between items-center">
                            <h2 className="text-xs font-black uppercase tracking-widest text-[#0F172A]">
                                Category Master List
                            </h2>
                            <List size={16} className="text-slate-400" />
                        </div>

                        <DataTable
                            columns={["Category Details", "Description", "Status", "Actions"]}
                            data={categories}
                            loading={isLoading}
                            pagination={pagination}
                            onPageChange={setPage}
                            emptyText="No categories assigned to the catalog"
                            renderRow={(cat) => (
                                <tr key={cat._id} className="group hover:bg-slate-50/30 transition-colors">
                                    {/* COLUMN 1: NAME + LOGO */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-[#0F172A] border border-slate-200 group-hover:border-[#0F172A] transition-all">
                                                <Tag size={18} strokeWidth={2.5} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-[#0F172A] uppercase tracking-tight leading-none mb-1">
                                                    {cat.name}
                                                </p>
                                                <p className="text-[9px] text-slate-400 font-medium tracking-widest uppercase">
                                                    ID: {cat._id.slice(-6)}
                                                </p>
                                            </div>
                                        </div>
                                    </td>

                                    {/* COLUMN 2: DESCRIPTION */}
                                    <td className="px-6 py-4">
                                        <p className="text-xs font-medium text-slate-500 italic leading-relaxed max-w-xs truncate">
                                            "{cat.description || "Description pending..."}"
                                        </p>
                                    </td>

                                    {/* COLUMN 3: STATUS */}
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter border ${cat.isActive
                                            ? "bg-green-50 text-green-600 border-green-100"
                                            : "bg-red-50 text-red-600 border-red-100"
                                            }`}>
                                            <div className={`w-1 h-1 rounded-full mr-1.5 ${cat.isActive ? "bg-green-500" : "bg-red-500"}`} />
                                            {cat.isActive ? "Active Segment" : "Disabled"}
                                        </span>
                                    </td>

                                    {/* COLUMN 4: ACTIONS */}
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => {
                                                    setMode("edit");
                                                    setSelectedCategory(cat);
                                                    setCatModal(true);
                                                }}
                                                className="p-2 text-slate-300 hover:text-[#7a6af6] hover:bg-[#7a6af6]/5 rounded-xl transition-all active:scale-90"
                                                title="Edit Segment"
                                            >
                                                <Edit3 size={18} strokeWidth={2.5} />
                                            </button>

                                            <td className="px-6 py-4 text-right">
                                                {cat.isActive ? (
                                                    /* DEACTIVATE */
                                                    <button
                                                        onClick={() => toggleCategoryStatus(cat)}
                                                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-90"
                                                        title="Deactivate Category"
                                                    >
                                                        <Ban size={18} strokeWidth={2.5} />
                                                    </button>
                                                ) : (
                                                    /* ACTIVATE */
                                                    <button
                                                        onClick={() => toggleCategoryStatus(cat)}
                                                        className="p-2 text-green-600 hover:bg-green-50 rounded-xl transition-all active:scale-90"
                                                        title="Activate Category"
                                                    >
                                                        <CheckCircle size={18} strokeWidth={2.5} />
                                                    </button>
                                                )}
                                            </td>
                                            <td>
                                                <button
                                                    onClick={() =>
                                                        adminToast.confirm(
                                                            "Delete Category?",
                                                            "This category will be removed from the catalog. You can restore it later.",
                                                            () => handleDeleteCategory(cat._id)
                                                        )
                                                    }
                                                    className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all active:scale-90"
                                                    title="Delete Category"
                                                >
                                                    <Trash2 size={18} strokeWidth={2.5} />
                                                </button>

                                            </td>

                                        </div>
                                    </td>
                                </tr>
                            )}
                        />
                    </div>
                </div>
            </main>

            {/* MODALS */}
            <CategoryModal
                isOpen={catModal}
                onClose={() => setCatModal(false)}
                mode={mode}
                initialData={selectedCategory}
                onSubmit={submitCategory}
                onOpenSub={(cat) => {
                    setSelectedCategory(cat);
                    setSubModal(true);
                }}
            />

            <SubCategoryModal
                isOpen={subModal}
                onClose={() => setSubModal(false)}
                parentCategory={selectedCategory}
            />
        </div>
    );
};

export default CategoryManagement;