import React, { useState, useDeferredValue } from "react";
import { useNavigate } from "react-router-dom";
import { 
    Search, 
    RotateCcw, 
    AlertTriangle, 
    CheckCircle, 
    XCircle, 
    Eye,
    Filter,
    ChevronLeft,
    ChevronRight
} from "lucide-react";

import AdminSidebar from "../../components/admin/AdminSidebar";
import DataTable from "../../tables/admin/DataTable";
import { useAdminOrders } from "../../hooks/admin/useAdminOrders";

const AdminReturnRequests = () => {
    const navigate = useNavigate();
 
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    
    const deferredSearch = useDeferredValue(searchTerm);

    const { data, isLoading: loading } = useAdminOrders({ 
        page, 
        limit: 6, 
        status: 'returns',
        search: deferredSearch
    });

    const orders = data?.orders ?? [];
    const pagination = {
        page: data?.currentPage ?? 1,
        pages: data?.totalPages ?? 1,
        total: data?.totalOrders ?? 0,
    };

    const getReturnSummary = (order) => {
        return order.items.filter(i => 
            ['Return Requested', 'Return Approved', 'Returned', 'Return Rejected'].includes(i.status)
        );
    };

    const pendingCount = orders.filter(o => o.items.some(i => i.status === 'Return Requested')).length;
    const approvedCount = orders.filter(o => o.items.some(i => i.status === 'Return Approved')).length;
    const rejectedCount = orders.filter(o => o.items.some(i => i.status === 'Return Rejected')).length;

    return (
        <div className="min-h-screen flex bg-[#f8fafc] p-3 gap-3 items-start font-sans">
            <AdminSidebar />

            <main className="flex-1 flex flex-col gap-3 h-[calc(100vh-24px)] overflow-hidden">

                <header className="bg-white border border-slate-200 rounded-[20px] px-6 py-4 flex justify-between items-center shadow-sm shrink-0">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                        Terminal / <span className="text-[#0F172A] font-black">Return Protocols</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#7a6af6] transition-colors" size={14} />
                            <input
                                type="text"
                                placeholder="Search Order ID..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setPage(1);
                                }}
                                className="pl-9 pr-8 py-2 bg-slate-100 focus:bg-white rounded-xl text-xs w-64 outline-none transition-all border border-transparent focus:border-slate-200 shadow-inner focus:shadow-sm"
                            />
                        </div>
                        <div className="w-8 h-8 flex items-center justify-center bg-slate-50 border border-slate-200 rounded-xl text-slate-400 cursor-pointer hover:bg-[#0F172A] hover:text-white transition-all">
                            <Filter size={14} />
                        </div>
                    </div>
                </header>

                <div className="flex-1 flex flex-col gap-3 overflow-hidden">

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 shrink-0">
                        <StatsCard title="Total Requests" value={pagination.total} icon={<RotateCcw size={18} />} color="blue" />
                        <StatsCard title="Action Needed" value={pendingCount} icon={<AlertTriangle size={18} />} color="orange" />
                        <StatsCard title="Authorized" value={approvedCount} icon={<CheckCircle size={18} />} color="green" />
                        <StatsCard title="Rejected" value={rejectedCount} icon={<XCircle size={18} />} color="red" />
                    </div>

                    <div className="flex-1 bg-white rounded-[24px] shadow-sm border border-slate-200 overflow-hidden flex flex-col">

                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <DataTable
                                columns={["Manifest ID", "Customer Entity", "Return Summary", "Protocol Status", "Timestamp", "Trace"]}
                                data={orders}
                                loading={loading}
                                pagination={null} 
                                emptyText="No return protocols active."
                                renderRow={(order) => {
                                    const returnItems = getReturnSummary(order);
                                    const isPending = returnItems.some(i => i.status === 'Return Requested');

                                    return (
                                        <tr key={order._id} className="group hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-none">
                                            
                                            {/* ID */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-[#7a6af6] transition-colors">
                                                        <RotateCcw size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-black text-[#0F172A] uppercase leading-none mb-1">
                                                            #{order.orderNumber?.split('-')[1] || order._id.slice(-6).toUpperCase()}
                                                        </p>
                                                        <p className="text-[8px] text-slate-400 font-black tracking-widest uppercase italic">
                                                            UUID: {order._id.slice(-8)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <p className="text-xs font-black text-[#0F172A] uppercase italic leading-none mb-1">
                                                        {order.userId?.name || "Unknown Entity"}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 lowercase truncate max-w-[140px] font-medium">
                                                        {order.userId?.email}
                                                    </p>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1.5">
                                                    {returnItems.map((item, idx) => (
                                                        <div key={idx} className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-2 py-1 rounded-lg w-fit">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-[#7a6af6]" />
                                                            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tight">
                                                                {item.productId?.name?.substring(0, 15)}... (x{item.quantity})
                                                            </span>
                                                        </div>
                                                    ))}
                                                    {returnItems.length === 0 && (
                                                        <span className="text-[9px] text-slate-400 italic">No Items Found</span>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                {isPending ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wide bg-amber-50 text-amber-600 border border-amber-100 animate-pulse">
                                                        <AlertTriangle size={12} /> Action Required
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wide bg-slate-50 text-slate-500 border border-slate-200">
                                                        <CheckCircle size={12} /> Processed
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                                                        {new Date(order.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                                    </p>
                                                    <p className="text-[8px] text-slate-300 font-bold uppercase">
                                                        {new Date(order.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </td>

                                            {/* Action */}
                                            <td className="px-6 py-4 text-right">
                                                <button 
                                                    onClick={() => navigate(`/admin/orders/${order._id}`)}
                                                    className="p-2 text-slate-300 hover:text-white hover:bg-[#0F172A] rounded-xl transition-all shadow-sm active:scale-90"
                                                >
                                                    <Eye size={16} strokeWidth={2.5} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                }}
                            />
                        </div>

                        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                Showing {orders.length} of {pagination.total} requests
                            </p>
                            
                            <SmartPagination 
                                currentPage={pagination.page} 
                                totalPages={pagination.pages} 
                                onPageChange={setPage} 
                            />
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
};

const SmartPagination = ({ currentPage, totalPages, onPageChange }) => {
    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            if (currentPage <= 3) {
                pages.push(1, 2, 3, '...', totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1, '...', totalPages - 2, totalPages - 1, totalPages);
            } else {
                pages.push(1, '...', currentPage, '...', totalPages);
            }
        }
        return pages;
    };

    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center gap-2">
            <button 
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-500 hover:bg-[#0F172A] hover:text-white hover:border-[#0F172A] transition-all disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-slate-500"
            >
                <ChevronLeft size={14} />
            </button>

            {getPageNumbers().map((p, i) => (
                <button
                    key={i}
                    onClick={() => typeof p === 'number' && onPageChange(p)}
                    disabled={p === '...'}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-[10px] font-bold transition-all ${
                        p === currentPage 
                            ? 'bg-[#0F172A] text-white shadow-lg shadow-slate-200' 
                            : p === '...' 
                                ? 'bg-transparent text-slate-400 cursor-default' 
                                : 'bg-white border border-slate-200 text-slate-500 hover:border-[#0F172A] hover:text-[#0F172A]'
                    }`}
                >
                    {p}
                </button>
            ))}

            <button 
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-500 hover:bg-[#0F172A] hover:text-white hover:border-[#0F172A] transition-all disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-slate-500"
            >
                <ChevronRight size={14} />
            </button>
        </div>
    );
};

const StatsCard = ({ title, value, icon, color }) => {
    const colors = { 
        blue: "bg-blue-50 text-blue-600 border-blue-100", 
        orange: "bg-orange-50 text-orange-600 border-orange-100", 
        green: "bg-green-50 text-green-600 border-green-100", 
        red: "bg-red-50 text-red-600 border-red-100" 
    };
    return (
        <div className="bg-white rounded-[20px] p-5 border border-slate-200 shadow-sm transition-all hover:shadow-md flex items-center justify-between">
            <div className="space-y-1">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">{title}</p>
                <p className="text-2xl font-black text-[#0F172A] tracking-tighter">{value}</p>
            </div>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${colors[color]}`}>{icon}</div>
        </div>
    );
};

export default AdminReturnRequests;