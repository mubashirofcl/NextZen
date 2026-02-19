import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Edit3, Ticket, List, Search, Trash2, Calendar, Tag } from "lucide-react";

import AdminSidebar from "../../components/admin/AdminSidebar";
import DataTable from "../../tables/admin/DataTable";
import { useCoupons } from "../../hooks/admin/useCoupons";
import { adminToast } from "../../utils/adminToast";

const CouponManagement = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [page, setPage] = useState(1);

    // Using the unified hook we built earlier
    const { coupons, isLoading, deleteCoupon } = useCoupons();

    /* ------------------ SEARCH DEBOUNCE ------------------ */
    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(searchTerm), 400);
        return () => clearTimeout(t);
    }, [searchTerm]);

    /* ------------------ CLIENT-SIDE FILTERING ------------------ */
    const filteredCoupons = coupons.filter(c =>
        c.code.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        c.description?.toLowerCase().includes(debouncedSearch.toLowerCase())
    );

    const pagination = {
        page: page,
        pages: 1,
        total: filteredCoupons.length,
    };

    const handleDelete = (id) => {
        adminToast.confirm(
            "Purge Coupon?",
            "This will permanently remove the discount code from the vault.",
            async () => {
                try {
                    await deleteCoupon(id);
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
                {/* HEADER - MATCHING CATEGORY MANAGEMENT DESIGN */}
                <header className="bg-white/80 backdrop-blur-md border border-white rounded-[20px] px-6 py-3 flex justify-between items-center shadow-sm">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                        Admin / <span className="text-[#0F172A] font-black">Coupons</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input
                                type="text"
                                placeholder="Search coupons..."
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
                            onClick={() => navigate("/admin/coupons/add")}
                            className="bg-[#0F172A] text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-[#112552] transition-all shadow-lg active:scale-95"
                        >
                            <Plus size={14} strokeWidth={3} /> Add Coupon
                        </button>
                    </div>
                </header>

                {/* TABLE SECTION */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                    <div className="bg-white rounded-[20px] shadow-sm overflow-hidden">
                        <div className="p-5 border-b flex justify-between items-center">
                            <h2 className="text-xs font-black uppercase tracking-widest text-[#0F172A]">
                                Promotion Master List
                            </h2>
                            <List size={16} className="text-slate-400" />
                        </div>

                        <DataTable
                            columns={["Coupon Details", "Discount", "Validity", "Usage", "Actions"]}
                            data={filteredCoupons}
                            loading={isLoading}
                            pagination={pagination}
                            onPageChange={setPage}
                            emptyText="No active promotions in the vault"
                            renderRow={(coupon) => (
                                <tr key={coupon._id} className="group hover:bg-slate-50/30 transition-colors">

                                    {/* COLUMN 1: DETAILS */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200 group-hover:border-[#0F172A] transition-all text-[#7a6af6]">
                                                <Ticket size={18} strokeWidth={2.5} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-[#0F172A] uppercase italic">
                                                    {coupon.code}
                                                </p>
                                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight truncate max-w-[150px]">
                                                    {coupon.description || "Incentive campaign"}
                                                </p>
                                            </div>
                                        </div>
                                    </td>

                                    {/* COLUMN 2: DISCOUNT */}
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase border ${coupon.discountType === 'PERCENT'
                                                ? "bg-indigo-50 text-indigo-600 border-indigo-100"
                                                : "bg-emerald-50 text-emerald-600 border-emerald-100"
                                            }`}>
                                            {coupon.discountType === 'PERCENT' ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} FLAT`}
                                        </span>
                                    </td>

                                    {/* COLUMN 3: VALIDITY */}
                                    <td className="px-6 py-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600">
                                                <Calendar size={12} className="text-slate-400" />
                                                Exp: {new Date(coupon.endDate).toLocaleDateString('en-GB')}
                                            </div>
                                            <div className="text-[8px] font-black text-[#7a6af6] uppercase tracking-tighter bg-purple-50 px-1.5 py-0.5 rounded w-fit">
                                                Updated: {new Date(coupon.updatedAt).toLocaleDateString('en-GB')}
                                            </div>
                                        </div>
                                    </td>

                                    {/* COLUMN 4: USAGE */}
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex justify-between items-center w-24">
                                                <span className="text-[9px] font-black text-slate-400 uppercase">Usage</span>
                                                <span className="text-[10px] font-bold text-slate-700">{coupon.usedCount || 0}/{coupon.usageLimit}</span>
                                            </div>
                                            <div className="w-24 h-1 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-[#7a6af6] transition-all duration-1000"
                                                    style={{ width: `${Math.min(((coupon.usedCount || 0) / coupon.usageLimit) * 100, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>

                                    {/* COLUMN 5: ACTIONS - FIXED NAVIGATION */}
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => navigate(`/admin/coupons/edit/${coupon._id}`)}
                                                className="p-2 text-slate-300 hover:text-[#7a6af6] hover:bg-[#7a6af6]/5 rounded-xl transition-all"
                                                title="Edit Coupon"
                                            >
                                                <Edit3 size={18} strokeWidth={2.5} />
                                            </button>

                                            <button
                                                onClick={() => handleDelete(coupon._id)}
                                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                title="Delete Coupon"
                                            >
                                                <Trash2 size={18} strokeWidth={2.5} />
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

export default CouponManagement;