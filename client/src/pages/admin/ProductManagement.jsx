import React, { useState, useDeferredValue } from "react";
import { Search, Plus, Filter, Edit3, Box, Download, ShieldAlert, Layout, Layers, Ban, CheckCircle, Percent, Tag, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

import AdminSidebar from "../../components/admin/AdminSidebar";
import DataTable from "../../tables/admin/DataTable";
import { adminToast } from "../../utils/adminToast";
import { useAdminProducts, useUpdateProduct } from "../../hooks/admin/useAdminProducts";

const ProductManagement = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const deferredSearch = useDeferredValue(searchTerm);

    const { data, isLoading: loading } = useAdminProducts({
        page,
        search: deferredSearch,
    });

    const products = data?.products ?? [];
    const pagination = {
        page: data?.currentPage ?? 1,
        pages: data?.totalPages ?? 1,
        total: data?.totalProducts ?? 0,
    };

    const updateMutation = useUpdateProduct();

    const handleToggleStatus = async (product) => {
        const currentlyActive = product.isActive;
        adminToast.confirm(
            currentlyActive ? "Restrict Product?" : "Restore Access?",
            currentlyActive ? "This will hide the product from the storefront." : "This will restore visibility.",
            async () => {
                try {
                    await updateMutation.mutateAsync({ id: product._id, isActive: !currentlyActive });
                    adminToast.success(currentlyActive ? "Product Restricted" : "Access Restored");
                } catch { adminToast.error("Update Failed"); }
            }
        );
    };

    return (
        <div className="min-h-screen flex bg-[#f8fafc] p-3 gap-3 items-start font-sans">
            <AdminSidebar />

            <main className="flex-1 flex flex-col gap-3 h-[calc(100vh-24px)] overflow-hidden">
                <header className="bg-white border border-slate-200 rounded-[20px] px-6 py-4 flex justify-between items-center shadow-sm shrink-0">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                        Admin / <span className="text-[#0F172A] font-black">Inventory</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input
                                type="text"
                                placeholder="Search inventory..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                                className="pl-9 pr-8 py-2 bg-slate-200/50 focus:bg-white rounded-xl text-xs w-64 outline-none transition-all"
                            />
                        </div>
                        <button className="bg-[#0F172A] text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-all shadow-lg active:scale-95" onClick={() => navigate('/admin/products/add')}>
                            <Plus size={14} strokeWidth={3} /> Add Product
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <StatsCard title="Total SKU" value={pagination.total} icon={<Box size={18} />} color="blue" />
                        <StatsCard title="Attention" value={products.filter(p => (p.totalStock || 0) < 10).length} icon={<ShieldAlert size={18} />} color="orange" />
                        <StatsCard title="Restricted" value={products.filter(p => !p.isActive).length} icon={<Ban size={18} />} color="red" />
                    </div>

                    <div className="bg-white rounded-[24px] shadow-sm border border-slate-200 overflow-hidden">
                        <DataTable
                            columns={["Product Identifier", "Category", "Variants", "Pricing Console", "Inventory Status", "Access Status", "Actions"]}
                            data={products}
                            loading={loading}
                            pagination={pagination}
                            onPageChange={setPage}
                            renderRow={(product) => {
                                // 🟢 CRITICAL LOGIC FIX: 
                                // Check for ALL possible field names returned by our different repo versions
                                const activeDiscount = Number(product.discountValue || product.resolvedDiscountValue || product.appliedDiscount || 0);
                                const hasOffer = activeDiscount > 0;

                                return (
                                    <tr key={product._id} className={`group hover:bg-slate-50/30 transition-colors border-b border-slate-50 last:border-0 ${!product.isActive ? 'bg-red-50/5' : ''}`}>
                                        <td className="px-6 py-4">
                                            <div className={`flex items-center gap-3 ${!product.isActive ? 'opacity-40 grayscale' : ''}`}>
                                                <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden relative">
                                                    {product.thumbnail ? <img src={product.thumbnail} className="w-full h-full object-cover" alt="" /> : <Box size={20} className="m-auto mt-3 text-slate-300" />}
                                                    {/* SMALL OVERLAY ICON FOR OFFERED PRODUCTS */}
                                                    {hasOffer && (
                                                        <div className="absolute top-0 right-0 bg-[#7a6af6] p-0.5 rounded-bl-lg border-b border-l border-white/20">
                                                            <Zap size={8} className="text-white fill-white" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-[#0F172A] uppercase leading-none mb-1">{product.name}</p>
                                                    <p className="text-[9px] text-slate-400 font-medium tracking-widest uppercase truncate max-w-[120px]">SKU: {product._id.slice(-6).toUpperCase()}</p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                                                {product.categoryName || product.category?.name || "General"}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Layers size={14} className="text-slate-300" />
                                                <span className="text-xs font-black text-[#0F172A]">{product.variantCount || 0}</span>
                                            </div>
                                        </td>

                                        {/* PRICING CONSOLE - ENHANCED VISIBILITY */}
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <span className={`font-black text-xs ${hasOffer ? 'text-[#7a6af6]' : 'text-[#0F172A]'}`}>
                                                        ₹{product.minSalePrice?.toLocaleString("en-IN")}
                                                    </span>
                                                    
                                                    {/* THE OFFER BADGE */}
                                                    {hasOffer && (
                                                        <div className="inline-flex items-center px-2 py-0.5 bg-[#7a6af6] text-white rounded-md shadow-lg shadow-indigo-200 animate-in zoom-in duration-300">
                                                            <Percent size={8} className="mr-1 stroke-[4]" />
                                                            <span className="text-[9px] font-black">{activeDiscount}%</span>
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                {hasOffer ? (
                                                    <p className="text-[7px] text-slate-400 font-bold uppercase tracking-widest line-through italic opacity-60">
                                                        MRP: ₹{product.minOriginalPrice?.toLocaleString("en-IN")}
                                                    </p>
                                                ) : (
                                                    <p className="text-[7px] text-slate-300 font-bold uppercase tracking-widest italic">
                                                        Standard Rate
                                                    </p>
                                                )}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <div className="flex items-center justify-between mb-1.5 min-w-[90px]">
                                                    <span className={`text-[10px] font-black ${(product.totalStock || 0) === 0 ? 'text-red-500' : (product.totalStock || 0) < 10 ? 'text-orange-500' : 'text-[#0F172A]'}`}>
                                                        {product.totalStock || 0} Units
                                                    </span>
                                                    <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${(product.totalStock || 0) === 0 ? 'bg-red-50 text-red-500' : (product.totalStock || 0) < 10 ? 'bg-orange-50 text-orange-500' : 'bg-slate-50 text-slate-400'}`}>
                                                        {(product.totalStock || 0) === 0 ? 'Out' : (product.totalStock || 0) < 10 ? 'Low' : 'OK'}
                                                    </span>
                                                </div>
                                                <div className="w-24 h-1 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full transition-all duration-500 ${(product.totalStock || 0) === 0 ? 'bg-red-400' : (product.totalStock || 0) < 10 ? 'bg-orange-400' : 'bg-green-400'}`} style={{ width: `${Math.min(((product.totalStock || 0) / 50) * 100, 100)}%` }} />
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter border ${product.isActive ? "bg-green-50 text-green-600 border-green-100" : "bg-red-50 text-red-600 border-red-100"}`}>
                                                <div className={`w-1 h-1 rounded-full mr-1.5 ${product.isActive ? "bg-green-500" : "bg-red-500"}`} />
                                                {product.isActive ? "Live Access" : "Restricted"}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => navigate(`/admin/products/edit/${product._id}`)} className="p-2 text-slate-300 hover:text-[#7a6af6] hover:bg-purple-50 rounded-xl transition-all"><Edit3 size={18} strokeWidth={2.5} /></button>
                                                <button onClick={() => handleToggleStatus(product)} className={`p-2 rounded-xl transition-all ${product.isActive ? 'text-slate-300 hover:text-red-500' : 'text-green-600'}`}>{product.isActive ? <Ban size={18} strokeWidth={2.5} /> : <CheckCircle size={18} strokeWidth={2.5} />}</button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            }}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
};

const StatsCard = ({ title, value, icon, color }) => {
    const colors = { blue: "bg-blue-50 text-blue-600", orange: "bg-orange-50 text-orange-600", red: "bg-red-50 text-red-600" };
    return (
        <div className="bg-white rounded-[20px] p-4 border border-slate-100 shadow-sm transition-all hover:shadow-md flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}>{icon}</div>
            <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{title}</p>
                <p className="text-lg font-black text-[#0F172A] leading-none">{value}</p>
            </div>
        </div>
    );
};

export default ProductManagement;