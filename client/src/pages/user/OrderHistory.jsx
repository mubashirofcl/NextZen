import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '../../hooks/user/useOrder';
import { Package, Clock, Loader2, ChevronRight, Box, AlertTriangle, XCircle } from 'lucide-react';

const OrderHistory = () => {
    const navigate = useNavigate();
    const { data: orders, isLoading } = useOrders();

    const orderList = Array.isArray(orders) ? orders : [];

    const getStatusStyle = (status) => {
        const s = status?.toLowerCase();
        switch (s) {
            case 'delivered': return 'text-green-400 border-green-400/20 bg-green-400/5';
            case 'pending': return 'text-amber-400 border-amber-400/20 bg-amber-400/5';
            case 'shipped': return 'text-[#7a6af6] border-[#7a6af6]/20 bg-[#7a6af6]/5';
            case 'cancelled': return 'text-red-400 border-red-400/20 bg-red-400/5';
            default: return 'text-white/40 border-white/10 bg-white/5';
        }
    };

    if (isLoading) return (
        <div className="h-96 flex items-center justify-center bg-white/[0.03] backdrop-blur-xl rounded-[2rem] border border-white/10">
            <Loader2 className="animate-spin text-[#7a6af6]" size={32} />
        </div>
    );

    return (
        <div className="flex flex-col h-[calc(100vh-200px)] animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Header Section */}
            <div className="bg-gradient-to-br from-white/[0.12] to-transparent backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 shadow-2xl mb-6 shrink-0">
                <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">Order Archive</h3>
                <p className="text-[9px] text-[#7a6af6] font-black uppercase tracking-[0.4em] mt-1">
                    Deployment History // Status: Active
                </p>
            </div>

            {/* Scrollable Area */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                {orderList.length === 0 ? (
                    <div className="bg-white/[0.03] backdrop-blur-xl rounded-[2rem] p-20 text-center border border-white/10 border-dashed">
                        <Package className="mx-auto text-white/10 mb-4" size={48} />
                        <h2 className="text-[10px] font-black uppercase text-white/20 tracking-[0.5em]">Archive Empty</h2>
                        <button
                            onClick={() => navigate('/shop')}
                            className="mt-8 px-10 py-4 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#7a6af6] transition-all"
                        >
                            Initiate First Drop
                        </button>
                    </div>
                ) : (
                    orderList.map((order) => {
                        // Logic to check if there are individual item cancellations
                        const cancelledItemsCount = order.items?.filter(item => item.status === 'cancelled').length || 0;
                        const isPartiallyCancelled = cancelledItemsCount > 0 && cancelledItemsCount < order.items?.length;

                        return (
                            <div
                                key={order._id}
                                onClick={() => navigate(`/profile/orders/${order._id}`)}
                                className="group bg-gradient-to-br from-white/[0.08] to-transparent backdrop-blur-xl p-6 rounded-[2rem] border border-white/5 hover:border-[#7a6af6]/50 transition-all duration-500 cursor-pointer flex items-center justify-between shadow-xl"
                            >
                                <div className="flex items-center gap-6">
                                    {/* Thumbnail Stack */}
                                    <div className="hidden sm:flex -space-x-4">
                                        {order.items?.slice(0, 3).map((item, i) => (
                                            <div key={i} className={`relative w-14 h-16 rounded-xl border border-white/10 bg-zinc-900 overflow-hidden shadow-2xl z-[${5 - i}]`}>
                                                <img
                                                    src={item.variantId?.images?.[0] || item.productId?.thumbnail}
                                                    className={`w-full h-full object-cover ${item.status === 'cancelled' ? 'opacity-20 grayscale' : ''}`}
                                                    alt="Product"
                                                />
                                                {item.status === 'cancelled' && (
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <XCircle size={14} className="text-red-500/60" />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {order.items?.length > 3 && (
                                            <div className="w-14 h-16 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md flex items-center justify-center text-[10px] font-black text-white/40 z-[1]">
                                                +{order.items.length - 3}
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <span className={`px-3 py-1 rounded-lg border text-[8px] font-black uppercase tracking-widest ${getStatusStyle(order.status)}`}>
                                                {order.status}
                                            </span>

                                            {/* Partial Cancellation Badge */}
                                            {isPartiallyCancelled && (
                                                <span className="flex items-center gap-1 px-2 py-1 rounded-lg border border-red-500/20 bg-red-500/5 text-red-500 text-[7px] font-black uppercase tracking-widest">
                                                    <AlertTriangle size={8} /> Partial Cancel
                                                </span>
                                            )}

                                            <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">
                                                #{order._id.slice(-8).toUpperCase()}
                                            </span>
                                        </div>

                                        <h4 className="text-sm font-black uppercase tracking-tight italic text-white flex items-center gap-2">
                                            <Box size={14} className="text-[#7a6af6]" />
                                            {order.items?.length - cancelledItemsCount} Active Units
                                        </h4>

                                        <p className="text-[9px] text-white/40 font-bold uppercase flex items-center gap-2 tracking-widest">
                                            <Clock size={12} className="text-[#7a6af6]/50" />
                                            {new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </p>
                                    </div>
                                </div>

                                <div className="text-right space-y-1">
                                    <p className="text-[9px] font-black text-white/20 uppercase tracking-tighter">Settlement</p>
                                    <p className="text-2xl font-black italic text-white tracking-tighter">
                                        ₹{order.totalAmount?.toLocaleString()}
                                    </p>
                                    <div className="flex items-center justify-end gap-1 text-[9px] font-black text-[#7a6af6] uppercase group-hover:gap-3 transition-all duration-500 mt-2">
                                        View Details <ChevronRight size={12} />
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.02); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(122, 106, 246, 0.2); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(122, 106, 246, 0.5); }
            `}</style>
        </div>
    );
};

export default OrderHistory;