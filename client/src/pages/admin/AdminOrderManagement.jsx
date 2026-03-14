import React, { useState, useDeferredValue } from "react";
import { useNavigate } from "react-router-dom";
import {
    Search, Eye, ShoppingBag, Truck, XCircle, Clock,
    FileText, CreditCard, ChevronLeft, ChevronRight, AlertOctagon,
    X
} from "lucide-react";

import AdminSidebar from "../../components/admin/AdminSidebar";
import DataTable from "../../tables/admin/DataTable";
import { useAdminOrders } from "../../hooks/admin/useAdminOrders";

const AdminOrderManagement = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [page, setPage] = useState(1);

    const deferredSearch = useDeferredValue(searchTerm);

    const { data, isLoading: loading } = useAdminOrders({
        page,
        limit: 6,
        search: deferredSearch,
        status: statusFilter
    });

    const orders = data?.orders ?? [];
    const pagination = {
        page: data?.currentPage ?? 1,
        pages: Math.max(1, data?.totalPages ?? 1),
        total: data?.totalOrders ?? 0,
    };

    const getStatusStyles = (status) => {
        const s = status?.toLowerCase();
        switch (s) {
            case 'delivered': return "bg-green-50 text-green-600 border-green-100";
            case 'shipped': return "bg-blue-50 text-blue-600 border-blue-100";
            case 'out_for_delivery': return "bg-purple-50 text-purple-600 border-purple-100";
            case 'pending': return "bg-orange-50 text-orange-600 border-orange-100";
            case 'cancelled': return "bg-slate-100 text-slate-400 border-slate-200";
            case 'payment_failed': return "bg-red-50 text-red-600 border-red-100 animate-pulse";
            case 'return_requested': return "bg-amber-50 text-amber-600 border-amber-100";
            default: return "bg-slate-50 text-slate-500 border-slate-100";
        }
    };

    return (
        <div className="min-h-screen flex bg-[#f8fafc] p-3 gap-3 items-start font-sans">
            <AdminSidebar />

            <main className="flex-1 flex flex-col gap-3 h-[calc(100vh-24px)] overflow-hidden">

                <header className="bg-white border border-slate-200 rounded-[20px] px-6 py-4 flex justify-between items-center shadow-sm shrink-0">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                        Admin / <span className="text-[#0F172A] font-black">Order Management</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative group">
                            <Search
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#7a6af6] transition-colors"
                                size={14}
                            />
                            <input
                                type="text"
                                placeholder="Search ID or Email..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setPage(1);
                                }}
                                className="pl-9 pr-10 py-2 bg-slate-100 focus:bg-white rounded-xl text-xs w-64 outline-none transition-all border border-transparent focus:border-slate-200"
                            />

                            {searchTerm && (
                                <button
                                    onClick={() => {
                                        setSearchTerm("");
                                        setPage(1);
                                    }}
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded-full hover:bg-slate-200/50"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                            className="bg-white border border-slate-200 text-[#0F172A] px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none transition-all shadow-sm cursor-pointer hover:border-[#7a6af6]"
                        >
                            <option value="all">All Orders</option>
                            <option value="pending">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="returns">Returns (Req/App/Ref)</option>
                            <option value="payment_failed">Payment Failed</option>
                        </select>
                    </div>
                </header>

                <div className="flex-1 flex flex-col gap-3 overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 shrink-0">
                        <StatsCard title="Total Found" value={pagination.total} icon={<ShoppingBag size={18} />} color="blue" />

                        <StatsCard title="In Transit (Page)" value={orders.filter(o => o.status === 'shipped').length} icon={<Truck size={18} />} color="blue" />
                        <StatsCard title="Processing (Page)" value={orders.filter(o => o.status === 'pending').length} icon={<Clock size={18} />} color="orange" />
                        <StatsCard title="Issues (Page)" value={orders.filter(o => o.status === 'payment_failed').length} icon={<AlertOctagon size={18} />} color="red" />
                    </div>

                    <div className="flex-1 bg-white rounded-[24px] shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <DataTable
                                columns={["Order Details", "Customer", "Payment Status", "Shipping Status", "Order Date", "Action"]}
                                data={orders}
                                loading={loading}
                                pagination={null}
                                renderRow={(order) => {
                                    const isFullyCancelled = order.status === 'cancelled';

                                    const isCOD = ['COD', 'cashOnDelivery'].includes(order.paymentMethod);
                                    const displayPaymentStatus = (isCOD && isFullyCancelled) ? "Cancelled" : order.paymentStatus;

                                    return (
                                        <tr key={order._id} className="group hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-none">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-[#7a6af6] transition-colors">
                                                        <FileText size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-black text-[#0F172A] uppercase leading-none mb-1">
                                                            #{order.orderNumber?.split('-')[1] || order._id.slice(-6).toUpperCase()}
                                                        </p>
                                                        <p className="text-[8px] text-slate-400 font-black tracking-widest uppercase italic">ID: {order._id.slice(-8)}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <p className="text-xs font-black text-[#0F172A] uppercase italic leading-none mb-1">{order.userId?.name || "Deleted User"}</p>
                                                    <p className="text-[10px] text-slate-400 lowercase truncate max-w-[140px] font-medium">{order.userId?.email || "N/A"}</p>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <p className="text-xs font-black text-[#0F172A]">₹{order.totalAmount?.toLocaleString()}</p>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded border ${displayPaymentStatus === 'Paid' ? 'bg-green-50 text-green-600 border-green-100' :
                                                                displayPaymentStatus === 'Cancelled' ? 'bg-slate-50 text-slate-400 border-slate-200' :
                                                                    'bg-orange-50 text-orange-600 border-orange-100'
                                                            }`}>
                                                            {displayPaymentStatus}
                                                        </span>
                                                        <span className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter">
                                                            {isCOD ? 'COD' : (order.paymentMethod === 'wallet' ? 'Wallet' : 'Online')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusStyles(order.status)}`}>
                                                    <div className="w-1 h-1 rounded-full bg-current mr-2" />
                                                    {order.status === 'payment_failed' ? 'FAILED' : order.status?.replace(/_/g, ' ')}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">

                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                                                        {new Date(order.createdAt || order.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </p>
                                                    <p className="text-[8px] text-slate-300 font-bold uppercase">
                                                        {new Date(order.createdAt || order.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => navigate(`/admin/orders/${order._id}`)}
                                                    className="p-2 text-slate-300 hover:text-[#7a6af6] hover:bg-[#7a6af6]/10 rounded-xl transition-all shadow-sm active:scale-90"
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
                                Showing {orders.length} of {pagination.total} orders
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
    if (totalPages <= 1) return null;

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

    return (
        <div className="flex items-center gap-2">
            <button
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-500 hover:bg-[#0F172A] hover:text-white transition-all disabled:opacity-50"
            >
                <ChevronLeft size={14} />
            </button>

            {getPageNumbers().map((p, i) => (
                <button
                    key={p === '...' ? `dots-${i}` : p}
                    onClick={() => typeof p === 'number' && onPageChange(p)}
                    disabled={p === '...'}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-[10px] font-bold transition-all ${p === currentPage
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
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-500 hover:bg-[#0F172A] hover:text-white transition-all disabled:opacity-50"
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

export default AdminOrderManagement;