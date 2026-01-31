import React, { useState, useEffect } from "react";
import { Plus, Edit3, Award, Search, BanIcon, CheckCircle2, Globe, Hash, List } from "lucide-react";

import AdminSidebar from "../../components/admin/AdminSidebar";
import DataTable from "../../tables/admin/DataTable";
import BrandModal from "../../components/admin/BrandModal";

import { useAdminBrands } from "../../hooks/admin/useAdminBrands";
import {
    useCreateBrand,
    useUpdateBrand,
    useToggleBrandStatus,
} from "../../hooks/admin/useAdminBrandMutations";

import { adminToast } from "../../utils/adminToast";

const BrandManagement = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [page, setPage] = useState(1);

    const [brandModal, setBrandModal] = useState(false);
    const [selectedBrand, setSelectedBrand] = useState(null);
    const [mode, setMode] = useState("add");

    const { data, isLoading } = useAdminBrands({
        page,
        search: debouncedSearch,
    });

    const createBrand = useCreateBrand();
    const updateBrand = useUpdateBrand();
    const toggleStatus = useToggleBrandStatus();

    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(searchTerm), 400);
        return () => clearTimeout(t);
    }, [searchTerm]);

    const brands = data?.items ?? [];
    const pagination = {
        page: data?.currentPage ?? 1,
        pages: data?.totalPages ?? 1,
        total: data?.totalItems ?? 0,
    };

    const handleToggleStatus = (brand) => {
        adminToast.confirm(
            brand.isActive ? "Deactivate Brand?" : "Activate Brand?",
            "This may affect visibility of linked products in the storefront.",
            async () => {
                try {
                    await toggleStatus.mutateAsync(brand._id);
                    adminToast.success("Status Updated");
                } catch {
                    adminToast.warn("Update Failed");
                }
            }
        );
    };

    return (
        <div className="min-h-screen flex bg-[#f1f5f9] p-2 gap-2 font-sans relative">
            <AdminSidebar />

            <main className="flex-1 flex flex-col gap-2 overflow-hidden h-[calc(100vh-16px)]">

                {/* --- HEADER --- */}
                <header className="bg-white border border-slate-200 rounded-[16px] px-6 py-3 flex justify-between items-center shadow-md shadow-slate-200/50 shrink-0">
                    <div className="flex flex-col">
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
                            Admin / <span className="text-[#7a6af6]">Partners</span>
                        </div>
                        <h1 className="text-[12px] font-black text-[#0F172A] uppercase tracking-tight">
                            Brand Registry
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative group">
                            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#7a6af6] transition-colors" />
                            <input
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                                placeholder="Search brands..."
                                className="pl-9 pr-4 py-2 bg-slate-50 border-2 border-slate-100 rounded-xl text-[10px] font-bold text-[#0F172A] w-56 outline-none focus:bg-white focus:border-[#7a6af6] focus:ring-4 focus:ring-purple-50 transition-all shadow-inner"
                            />
                        </div>

                        <button
                            onClick={() => { setMode("add"); setSelectedBrand(null); setBrandModal(true); }}
                            className="bg-[#0F172A] text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-all shadow-lg active:scale-95"
                        >
                            <Plus size={12} strokeWidth={3} /> Add Brand
                        </button>
                    </div>
                </header>

                {/* --- TABLE SECTION --- */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    <div className="bg-white rounded-[20px] shadow-xl shadow-slate-200/40 border border-slate-200 overflow-hidden ring-4 ring-slate-50/50">

                        <div className="px-6 py-3 border-b border-slate-50 flex justify-between items-center bg-slate-50/20">
                            <div className="flex items-center gap-2">
                                <List size={14} className="text-[#7a6af6]" />
                                <h2 className="text-[9px] font-black uppercase tracking-widest text-[#0F172A]">Partner Matrix</h2>
                            </div>
                            <Award size={14} className="text-slate-300" />
                        </div>

                        <DataTable
                            columns={["Brand Identity", "Status", "Actions"]}
                            data={brands}
                            loading={isLoading}
                            pagination={pagination}
                            onPageChange={setPage}
                            renderRow={(brand) => (
                                <tr key={brand._id} className="group hover:bg-slate-50 transition-all duration-200">

                                    {/* BRAND IDENTITY CELL */}
                                    <td className="px-6 py-3">
                                        <div className="flex items-center gap-4">
                                            <div className="w-11 h-11 rounded-xl border-2 border-white shadow-lg overflow-hidden bg-white flex items-center justify-center group-hover:scale-105 transition-transform duration-300 ring-1 ring-slate-100">
                                                {brand.logo ? (
                                                    <img src={brand.logo} alt={brand.name} className="w-full h-full object-contain p-1.5" />
                                                ) : (
                                                    <Award className="text-slate-200" size={20} />
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-black text-[#0F172A] uppercase leading-none mb-1 group-hover:text-[#7a6af6] transition-colors">{brand.name}</p>
                                                <div className="flex items-center gap-2">
                                                    <p className="flex items-center gap-1 text-[8px] text-slate-400 font-bold uppercase tracking-tight">
                                                        <Hash size={8} /> {brand._id.slice(-6)}
                                                    </p>
                                                    {brand.website && (
                                                        <p className="flex items-center gap-1 text-[8px] text-blue-500 font-black uppercase tracking-tighter">
                                                            <Globe size={8} /> Linked
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    {/* STATUS CELL */}
                                    <td className="px-6 py-3">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-lg text-[8px] font-black uppercase border tracking-tight shadow-sm ${brand.isActive
                                            ? "bg-green-50 text-green-600 border-green-100"
                                            : "bg-red-50 text-red-600 border-red-100"
                                            }`}>
                                            <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${brand.isActive ? "bg-green-500" : "bg-red-500"}`} />
                                            {brand.isActive ? "Authorized" : "Blocked"}
                                        </span>
                                    </td>

                                    {/* ACTIONS CELL */}
                                    <td className="px-6 py-3">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={() => { setMode("edit"); setSelectedBrand(brand); setBrandModal(true); }}
                                                className="p-2 bg-white border border-slate-50 text-slate-300 hover:text-[#7a6af6] hover:border-[#7a6af6] hover:shadow-md rounded-xl transition-all active:scale-90 shadow-sm"
                                                title="Edit"
                                            >
                                                <Edit3 size={15} strokeWidth={2.5} />
                                            </button>

                                            <button
                                                onClick={() => handleToggleStatus(brand)}
                                                className={`p-2 border rounded-xl transition-all active:scale-90 shadow-sm ${brand.isActive
                                                    ? 'bg-white border-slate-50 text-slate-300 hover:text-red-500 hover:border-red-500 hover:shadow-red-50'
                                                    : 'bg-green-50 border-green-100 text-green-600 hover:bg-green-200'
                                                    }`}
                                            >
                                                {brand.isActive ? <BanIcon size={15} strokeWidth={2.5} /> : <CheckCircle2 size={15} strokeWidth={2.5} />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        />
                    </div>
                </div>

                <BrandModal
                    isOpen={brandModal}
                    mode={mode}
                    initialData={selectedBrand}
                    onClose={() => setBrandModal(false)}
                    onSubmit={async (payload) => {
                        if (mode === "add") {
                            return await createBrand.mutateAsync(payload);
                        } else {
                            return await updateBrand.mutateAsync({ id: selectedBrand._id, ...payload });
                        }
                    }}
                />
            </main>
        </div>
    );
};

export default BrandManagement;