import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Tag, Search, List, Trash2, Box, Calendar, Edit3, Layers, Award } from "lucide-react"; // Added Award icon

import AdminSidebar from "../../components/admin/AdminSidebar";
import DataTable from "../../tables/admin/DataTable";
import { useOffers } from "../../hooks/admin/useOffers";
import { adminToast } from "../../utils/adminToast";

const OfferManagement = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [page, setPage] = useState(1);

    const { offers, isLoading, deleteOffer } = useOffers();

    /* ------------------ SEARCH DEBOUNCE ------------------ */
    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(searchTerm), 400);
        return () => clearTimeout(t);
    }, [searchTerm]);

    /* ------------------ CLIENT-SIDE FILTERING ------------------ */
    const filteredOffers = offers.filter(offer => 
        offer.title?.toLowerCase().includes(debouncedSearch.toLowerCase())
    );

    const pagination = {
        page: page,
        pages: 1, 
        total: filteredOffers.length,
    };

    const handleDelete = (id) => {
        adminToast.confirm(
            "Purge Offer Rule?",
            "This will permanently remove the rule. All linked items (Products, Brands, or Categories) will lose this discount.",
            async () => {
                try {
                    await deleteOffer(id);
                    adminToast.success("Offer Rule Purged");
                } catch {
                    adminToast.error("Purge Failed");
                }
            }
        );
    };

    return (
        <div className="min-h-screen flex bg-[#f8fafc] p-3 gap-3">
            <AdminSidebar />

            <main className="flex-1 flex flex-col gap-3 overflow-hidden">
                {/* HEADER */}
                <header className="bg-white/80 backdrop-blur-md border border-white rounded-[20px] px-6 py-3 flex justify-between items-center shadow-sm">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                        Admin / <span className="text-[#0F172A] font-black">Offer Forge</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input
                                type="text"
                                placeholder="Search rules..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setPage(1);
                                }}
                                className="pl-9 pr-8 py-2 bg-slate-200/50 focus:bg-white rounded-xl text-xs w-64 outline-none transition-all"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500"
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        <button
                            onClick={() => navigate("/admin/offers/add")}
                            className="bg-[#0F172A] text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-[#112552] transition-all shadow-lg active:scale-95"
                        >
                            <Plus size={14} strokeWidth={3} /> New Offer Rule
                        </button>
                    </div>
                </header>

                {/* TABLE SECTION */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                    <div className="bg-white rounded-[20px] shadow-sm overflow-hidden border border-slate-100">
                        <div className="p-5 border-b flex justify-between items-center bg-slate-50/50">
                            <h2 className="text-xs font-black uppercase tracking-widest text-[#0F172A]">
                                Active Discount Strategies
                            </h2>
                            <List size={16} className="text-slate-400" />
                        </div>

                        <DataTable
                            columns={["Strategy Name", "Target Scope", "Discount Value", "Timeline", "Actions"]}
                            data={filteredOffers}
                            loading={isLoading}
                            pagination={pagination}
                            onPageChange={setPage}
                            emptyText="No offer rules currently deployed"
                            renderRow={(offer) => (
                                <tr key={offer._id} className="group hover:bg-slate-50/50 transition-colors border-b last:border-0 border-slate-50">
                                    
                                    {/* COLUMN 1: STRATEGY */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-[#7a6af6] border border-slate-200">
                                                <Tag size={16} strokeWidth={2.5} />
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-black text-[#0F172A] uppercase tracking-tight">
                                                    {offer.title}
                                                </p>
                                                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">
                                                    REF: {offer._id.slice(-6)}
                                                </p>
                                            </div>
                                        </div>
                                    </td>

                                    {/* COLUMN 2: TARGET SCOPE */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className="p-1.5 rounded-lg bg-slate-100 text-slate-500">
                                                {offer.applyFor === 'PRODUCT' && <Box size={12} />}
                                                {offer.applyFor === 'CATEGORY' && <Layers size={12} />}
                                                {offer.applyFor === 'SUBCATEGORY' && <List size={12} />}
                                                {offer.applyFor === 'BRAND' && <Award size={12} />} {/* NEW: Brand Icon */}
                                            </span>
                                            <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider italic">
                                                {offer.applyFor}
                                            </span>
                                        </div>
                                    </td>

                                    {/* COLUMN 3: VALUE */}
                                    <td className="px-6 py-4">
                                        <div className="inline-flex items-center px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100">
                                            <span className="text-[10px] font-black">{offer.discountValue}%</span>
                                            <span className="text-[7px] font-bold uppercase ml-1 opacity-70 italic">OFF</span>
                                        </div>
                                    </td>

                                    {/* COLUMN 4: TIMELINE */}
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500">
                                                <Calendar size={11} className="text-slate-400" />
                                                Ends: {new Date(offer.endDate).toLocaleDateString('en-GB')}
                                            </div>
                                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full w-fit ${offer.isActive ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                                                {offer.isActive ? "Active" : "Paused"}
                                            </span>
                                        </div>
                                    </td>

                                    {/* COLUMN 5: ACTIONS */}
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={() => navigate(`/admin/offers/edit/${offer._id}`)}
                                                className="p-2 text-slate-400 hover:text-[#7a6af6] hover:bg-white rounded-lg shadow-sm border border-transparent hover:border-slate-100 transition-all"
                                            >
                                                <Edit3 size={15} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(offer._id)}
                                                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-white rounded-lg shadow-sm border border-transparent hover:border-slate-100 transition-all"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default OfferManagement;