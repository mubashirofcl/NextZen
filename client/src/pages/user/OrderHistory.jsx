import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '../../hooks/user/useOrder';
import { Package, Clock, Loader2, ChevronRight, Box, AlertTriangle, XCircle, Search, ImageIcon, AlertOctagon } from 'lucide-react';

const OrderHistory = () => {
    const navigate = useNavigate();
    const { data: orders, isLoading } = useOrders();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const orderList = Array.isArray(orders) ? orders : [];

    const filteredOrders = orderList.filter((order) => {
        const matchesSearch =
            order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.items?.some(item => item.productId?.name?.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesStatus = statusFilter === "all" || order.status?.toLowerCase() === statusFilter.toLowerCase();
        return matchesSearch && matchesStatus;
    });

    const getStatusStyle = (status) => {
        const s = status?.toLowerCase();
        switch (s) {
            case 'delivered': return 'text-green-400 border-green-400/20 bg-green-400/5';
            case 'pending': return 'text-amber-400 border-amber-400/20 bg-amber-400/5';
            case 'shipped': return 'text-[#7a6af6] border-[#7a6af6]/20 bg-[#7a6af6]/5';
            case 'cancelled': return 'text-white/20 border-white/10 bg-white/5';
            case 'payment_failed': return 'text-red-400 border-red-400/20 bg-red-400/5 animate-pulse'; // 🟢 Added Failed Style
            default: return 'text-white/40 border-white/10 bg-white/5';
        }
    };

    const getFriendlyStatus = (status) => {
        const s = status?.toLowerCase();
        if (s === 'payment_failed') return 'Payment Incomplete'; // 🟢 User friendly term
        if (s === 'pending') return 'Processing';
        return status;
    };

    if (isLoading) return (
        <div className="h-96 flex items-center justify-center bg-white/[0.03] backdrop-blur-xl rounded-[2rem] border border-white/10">
            <Loader2 className="animate-spin text-[#7a6af6]" size={32} />
        </div>
    );

    return (
        <div className="flex flex-col h-[calc(100vh-200px)] animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* --- HEADER & FILTERS --- */}
            <div className="bg-gradient-to-br from-white/[0.12] to-transparent backdrop-blur-2xl border border-white/10 rounded-[3rem] p-8 shadow-2xl mb-8 shrink-0">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
                    <div>
                        <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">Your Orders</h3>
                        <p className="text-[10px] text-[#7a6af6] font-black uppercase tracking-[0.4em] mt-1">
                            Purchase History // Real-time Sync
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
                        <div className="relative group w-full sm:w-80">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#7a6af6] transition-colors" size={16} />
                            <input
                                type="text"
                                placeholder="SEARCH YOUR ITEMS..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-[10px] font-black uppercase tracking-widest text-white placeholder:text-white/10 focus:outline-none focus:border-[#7a6af6]/50 transition-all"
                            />
                        </div>

                        <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/5 w-full sm:w-auto overflow-x-auto no-scrollbar">
                            {['all', 'pending', 'delivered', 'cancelled', 'payment_failed'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${statusFilter === status
                                            ? 'bg-[#7a6af6] text-white shadow-[0_0_20px_rgba(122,106,246,0.3)]'
                                            : 'text-white/30 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    {status === 'payment_failed' ? 'Unsuccessful' : status}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- ORDER LIST --- */}
            <div className="flex-1 overflow-y-auto pr-4 space-y-5 custom-scrollbar">
                {filteredOrders.length === 0 ? (
                    <div className="bg-white/[0.02] backdrop-blur-md rounded-[3rem] p-24 text-center border border-white/5 border-dashed">
                        <Package className="mx-auto text-white/5 mb-6" size={64} />
                        <h2 className="text-[11px] font-black uppercase text-white/20 tracking-[0.6em]">
                            {searchTerm || statusFilter !== 'all' ? "No Matching Orders Found" : "Your History is Empty"}
                        </h2>
                    </div>
                ) : (
                    filteredOrders.map((order) => {
                        const cancelledItemsCount = order.items?.filter(item => item.status === 'cancelled').length || 0;
                        const isPartiallyCancelled = cancelledItemsCount > 0 && cancelledItemsCount < order.items?.length;
                        const isFailed = order.status === 'payment_failed';

                        return (
                            <div
                                key={order._id}
                                onClick={() => navigate(`/profile/orders/${order._id}`)}
                                className={`group bg-gradient-to-br from-white/[0.07] to-transparent backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/5 hover:border-[#7a6af6]/40 transition-all duration-500 cursor-pointer flex flex-col md:flex-row md:items-center justify-between shadow-2xl gap-6 ${isFailed ? 'border-red-500/20 shadow-red-500/5' : ''}`}
                            >
                                <div className="flex items-center gap-6">
                                    {/* Image Stack */}
                                    <div className="hidden lg:flex -space-x-4">
                                        {order.items?.slice(0, 3).map((item, i) => (
                                            <div
                                                key={i}
                                                className="relative w-12 h-16 rounded-xl border border-white/10 bg-zinc-900 overflow-hidden shadow-xl transition-transform group-hover:-translate-y-1"
                                                style={{ zIndex: 10 - i }}
                                            >
                                                <img
                                                    src={item.variantId?.images?.[0] || item.productId?.thumbnail}
                                                    className={`w-full h-full object-cover ${item.status === 'cancelled' || isFailed ? 'opacity-20 grayscale' : ''}`}
                                                    alt="Item"
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <span className={`px-3 py-1 rounded-full border text-[8px] font-black uppercase tracking-widest ${getStatusStyle(order.status)}`}>
                                                {getFriendlyStatus(order.status)}
                                            </span>
                                            {isPartiallyCancelled && (
                                                <span className="flex items-center gap-1.5 px-2 py-1 rounded-full border border-red-500/20 bg-red-500/5 text-red-500 text-[7px] font-black uppercase tracking-widest">
                                                    <AlertTriangle size={8} /> Partial Order
                                                </span>
                                            )}
                                            <span className="text-[9px] font-black text-white/10 uppercase tracking-widest">
                                                ORDER ID: {order._id.slice(-8).toUpperCase()}
                                            </span>
                                        </div>

                                        <h4 className="text-sm font-black uppercase tracking-tight italic text-white flex items-center gap-2">
                                            {isFailed ? <AlertOctagon size={14} className="text-red-500" /> : <Box size={14} className="text-[#7a6af6]" />}
                                            {order.items?.length - cancelledItemsCount} Items Ordered
                                        </h4>

                                        <p className="text-[9px] text-white/30 font-bold uppercase flex items-center gap-2 tracking-widest">
                                            <Clock size={12} className="text-[#7a6af6]/40" />
                                            {new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex md:flex-col items-end justify-between md:justify-center gap-1 border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                                    <div className="text-left md:text-right">
                                        <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Total Value</p>
                                        <p className={`text-2xl font-black italic tracking-tighter ${isFailed ? 'text-red-400' : 'text-[#7a6af6]'}`}>
                                            ₹{order.totalAmount?.toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1 text-[9px] font-black text-white/40 uppercase group-hover:text-white transition-all duration-300">
                                        {isFailed ? "Retry Payment" : "View Details"} <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(122, 106, 246, 0.1); border-radius: 20px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(122, 106, 246, 0.3); }
                .no-scrollbar::-webkit-scrollbar { display: none; }
            `}</style>
        </div>
    );
};

export default OrderHistory;