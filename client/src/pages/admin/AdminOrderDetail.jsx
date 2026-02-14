import React, { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    ChevronLeft, User, MapPin, 
    Loader2, ShieldCheck, Box, ExternalLink,
    Truck, Check, AlertTriangle, Wallet,
    ArrowDownLeft, AlertCircle, LayoutDashboard, RotateCcw, MessageSquare
} from "lucide-react";
import AdminSidebar from "../../components/admin/AdminSidebar";
import { useAdminOrderDetails, useUpdateOrderStatus } from "../../hooks/admin/useAdminOrders";

const GlobalLoader = ({ message }) => (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-900/40 backdrop-blur-sm">
        <div className="bg-white px-8 py-6 rounded-xl shadow-xl flex flex-col items-center border border-slate-100">
            <Loader2 className="text-[#7a6af6] animate-spin mb-3" size={30} />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-800">{message}</p>
        </div>
    </div>
);

const AdminOrderDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { data: response, isLoading } = useAdminOrderDetails(id);
    const order = response?.data;
    const { mutate: updateOrderStatus, isPending: isUpdating } = useUpdateOrderStatus();

    const isCOD = order?.paymentMethod === 'cashOnDelivery' || order?.paymentMethod === 'COD';

    const globalStatusRank = { "pending": 1, "confirmed": 2, "shipped": 3, "out_for_delivery": 4, "delivered": 5, "cancelled": 6, "payment_failed": 0 };
    const itemStatusRank = { "Placed": 1, "Shipped": 2, "Delivered": 3, "Cancelled": 4, "Return Requested": 5, "Return Approved": 6, "Returned": 7 };

    const financials = useMemo(() => {
        if (!order?.items) return { net: 0, refunded: 0, total: 0 };
        let net = 0, refunded = 0;
        order.items.forEach(item => {
            if (item.status === 'Cancelled') {
                if (!isCOD && order.paymentStatus === 'Paid') refunded += (item.totalAmount || 0);
            } else if (item.status === 'Returned') {
                refunded += (item.totalAmount || 0);
            } else {
                net += (item.totalAmount || 0);
            }
        });
        const grossTotal = order.totalAmount || (net + refunded);
        if (order.status === 'payment_failed') return { net: 0, refunded: 0, total: grossTotal };
        return { net: net + (order.deliveryCharge || 0), refunded, total: grossTotal };
    }, [order, isCOD]);

    if (isLoading) return <GlobalLoader message="Accessing Order Terminal..." />;

    const getFriendlyStatus = (status) => {
        const s = status?.toLowerCase();
        if (s === 'pending') return 'Processing';
        if (s === 'payment_failed') return 'Failed';
        if (s === 'out_for_delivery') return 'Out for Delivery';
        return status?.replace(/_/g, ' ');
    };

    const getItemFinancialStatus = (item) => {
        const globalPayment = order?.paymentStatus?.toLowerCase() || 'pending';
        if (item.status === 'Returned') return { label: 'REFUNDED', color: 'text-green-600 bg-green-50 border-green-100' };
        if (item.status === 'Cancelled') {
            return isCOD && globalPayment !== 'paid' 
                ? { label: 'VOIDED', color: 'text-slate-400 bg-slate-100 border-slate-200' }
                : { label: 'REFUNDED', color: 'text-red-500 bg-red-100 border-red-200' };
        }
        if (globalPayment === 'paid') return { label: 'PAID', color: 'text-green-600 bg-green-50 border-green-100' };
        return { label: 'AWAITING', color: 'text-amber-600 bg-amber-50 border-amber-100' };
    };

    const handleViewProfile = () => {
        if (order?.userId?.email) navigate(`/admin/customers?search=${encodeURIComponent(order.userId.email)}`);
    };

    const currentGlobalRank = globalStatusRank[order?.status] || 0;

    return (
        <div className="min-h-screen flex bg-[#f1f5f9] p-3 gap-3 items-stretch font-sans text-slate-800 w-full overflow-hidden">
            <AdminSidebar />
            {isUpdating && <GlobalLoader message="Updating Stage..." />}

            <main className="flex-1 flex flex-col gap-4 overflow-hidden">
                <header className="bg-white border border-slate-200 rounded-2xl p-4 flex justify-between items-center shadow-sm">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="p-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition-all border border-slate-100">
                            <ChevronLeft size={18} className="text-slate-600" />
                        </button>
                        <div>
                            <h2 className="text-sm font-black uppercase tracking-tight text-slate-800 leading-none">Management Console</h2>
                            <p className="text-[9px] font-bold text-[#7a6af6] tracking-[0.2em] mt-2 uppercase">Order Protocol: {order?.orderNumber}</p>
                        </div>
                    </div>
                    <div className={`px-4 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ${order?.status === 'payment_failed' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                        {getFriendlyStatus(order?.status)}
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                        
                        <div className="lg:col-span-8 space-y-4">
                            {/* ITEM TABLE CONTAINER */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="px-6 py-3 bg-slate-50/50 border-b border-slate-100 flex items-center gap-2">
                                    <Box size={14} className="text-[#7a6af6]" />
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-700">Order manifest</h3>
                                </div>
                                <table className="w-full text-left">
                                    <thead className="text-[8px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50 bg-white">
                                        <tr>
                                            <th className="px-6 py-3">Asset Information</th>
                                            <th className="px-6 py-3">Fulfillment Stage</th>
                                            <th className="px-6 py-3 text-center">Qty</th>
                                            <th className="px-6 py-3 text-right">Settlement</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 bg-white">
                                        {order?.items?.map((item, idx) => {
                                            const currentItemRank = itemStatusRank[item.status] || 1;
                                            return (
                                                <tr key={idx} className="hover:bg-slate-50/30 transition-all">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-14 bg-slate-100 border border-slate-200 rounded-lg overflow-hidden shrink-0 shadow-sm">
                                                                <img src={item.variantId?.images?.[0] || item.productId?.thumbnail} className="w-full h-full object-cover" />
                                                            </div>
                                                            <div>
                                                                <p className="text-[11px] font-black text-slate-800 uppercase leading-tight mb-1">{item.productId?.name}</p>
                                                                <span className="px-2 py-0.5 bg-slate-100 rounded text-[8px] font-black text-slate-500 uppercase tracking-widest">Size: {item.size}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {item.status === 'Return Requested' ? (
                                                            <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-3 w-[260px] shadow-sm">
                                                                <div className="flex items-center gap-2 mb-2 text-amber-700">
                                                                    <RotateCcw size={12} strokeWidth={3} />
                                                                    <p className="text-[9px] font-black uppercase tracking-widest">Inbound Request</p>
                                                                </div>
                                                                <div className="flex items-start gap-2 p-2 bg-white rounded-lg border border-amber-100 mb-3">
                                                                    <MessageSquare size={10} className="mt-1 text-slate-400 shrink-0" />
                                                                    <p className="text-[9px] font-bold text-slate-600 leading-normal italic">"{item.returnReason || "No reason provided"}"</p>
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    <button onClick={() => updateOrderStatus({ orderId: id, itemId: item._id, itemStatus: 'Return Approved' })} className="flex-1 py-1.5 bg-green-500 text-white rounded-lg text-[8px] font-black uppercase hover:bg-green-600 transition-colors shadow-sm">Approve</button>
                                                                    <button onClick={() => updateOrderStatus({ orderId: id, itemId: item._id, itemStatus: 'Return Rejected' })} className="flex-1 py-1.5 bg-red-500 text-white rounded-lg text-[8px] font-black uppercase hover:bg-red-600 transition-colors shadow-sm">Reject</button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <select
                                                                value={item.status}
                                                                disabled={order.status === 'payment_failed' || item.status === 'Delivered' || item.status === 'Returned' || item.status === 'Cancelled'}
                                                                onChange={(e) => updateOrderStatus({ orderId: id, itemId: item._id, itemStatus: e.target.value })}
                                                                className="text-[9px] font-black uppercase tracking-widest bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg outline-none cursor-pointer hover:bg-white transition-all disabled:opacity-50"
                                                            >
                                                                <option value="Placed" disabled={currentItemRank > 1}>Confirmed {currentItemRank > 1 && "✓"}</option>
                                                                <option value="Shipped" disabled={currentItemRank > 2}>Dispatched {currentItemRank > 2 && "✓"}</option>
                                                                <option value="Delivered" disabled={currentItemRank > 3}>Delivered {currentItemRank > 3 && "✓"}</option>
                                                                <option value="Cancelled">Void Asset</option>
                                                                {item.status === 'Return Approved' && <option value="Returned">Authorize Refund</option>}
                                                            </select>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-center text-[10px] font-black text-slate-500">{item.quantity} Unit</td>
                                                    <td className="px-6 py-4 text-right">
                                                        <p className="text-[11px] font-black text-slate-800">₹{item.totalAmount?.toLocaleString()}</p>
                                                        <span className={`text-[7px] font-black px-1.5 py-0.5 rounded border uppercase mt-1 inline-block shadow-sm ${getItemFinancialStatus(item).color}`}>{getItemFinancialStatus(item).label}</span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* LOGISTICS CONTROLS - FULL WIDTH */}
                            <div className="space-y-4">
                                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 w-full">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600 border border-blue-100"><Truck size={16} /></div>
                                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-700 mt-0.5">Lifecycle Stage</h3>
                                    </div>
                                    <select
                                        value={order?.status}
                                        disabled={['cancelled', 'returned', 'payment_failed', 'delivered'].includes(order?.status?.toLowerCase())}
                                        onChange={(e) => updateOrderStatus({ orderId: id, globalStatus: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 text-[10px] font-black uppercase tracking-widest px-4 py-4 rounded-xl outline-none cursor-pointer hover:bg-white transition-all disabled:opacity-50 shadow-sm"
                                    >
                                        <option value="pending" disabled={currentGlobalRank > 1}>1. Processing {currentGlobalRank > 1 && "✓"}</option>
                                        <option value="confirmed" disabled={currentGlobalRank > 2}>2. Confirmed {currentGlobalRank > 2 && "✓"}</option>
                                        <option value="shipped" disabled={currentGlobalRank > 3}>3. Dispatched {currentGlobalRank > 3 && "✓"}</option>
                                        <option value="out_for_delivery" disabled={currentGlobalRank > 4}>4. In Transit {currentGlobalRank > 4 && "✓"}</option>
                                        <option value="delivered" disabled={currentGlobalRank > 5}>5. Completed {currentGlobalRank > 5 && "✓"}</option>
                                        <option value="cancelled" className="text-red-600 font-bold">Emergency Cancellation</option>
                                    </select>
                                </div>

                                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 w-full">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 border border-indigo-100"><MapPin size={16} /></div>
                                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-700 mt-0.5">Delivery Endpoint</h3>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 shadow-inner">
                                        <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight mb-1">{order?.addressId?.fullName}</p>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase leading-relaxed tracking-tighter">
                                            {order?.addressId?.addressLine}, {order?.addressId?.city}, {order?.addressId?.state} — {order?.addressId?.pincode}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT SIDEBAR INSIGHTS */}
                        <div className="lg:col-span-4 space-y-4">
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                                <div className="flex items-center gap-3 border-b border-slate-50 pb-3">
                                    <Wallet size={16} className="text-[#7a6af6]" />
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-800">Financial Summary</h3>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Protocol</p>
                                        <p className="text-[10px] font-black text-slate-700 uppercase tracking-tighter italic">{order?.paymentMethod === 'cashOnDelivery' ? 'Cash/COD' : 'Razorpay'}</p>
                                    </div>
                                    <div className="pt-2 space-y-3">
                                        <div className="flex justify-between text-[10px] font-bold uppercase text-slate-500 tracking-tight">
                                            <span>Subtotal</span>
                                            <span className="text-slate-800">₹{financials.total.toLocaleString()}</span>
                                        </div>
                                        {financials.refunded > 0 && (
                                            <div className="flex justify-between text-[9px] text-red-600 font-black uppercase bg-red-50 p-2 rounded-lg border border-red-100">
                                                <span className="flex items-center gap-1.5"><ArrowDownLeft size={12}/> Voids</span>
                                                <span className="tracking-tighter">- ₹{financials.refunded.toLocaleString()}</span>
                                            </div>
                                        )}
                                        <div className="pt-4 border-t border-dashed flex flex-col items-end">
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Net Realized Value</span>
                                            <span className="text-3xl font-black text-[#7a6af6] tracking-tighter italic leading-none">₹{financials.net.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                                <div className="flex items-center gap-3 border-b border-slate-50 pb-3 text-slate-400">
                                    <User size={16} />
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-800">Purchasing Agent</h3>
                                </div>
                                <div>
                                    <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight">{order?.userId?.name}</p>
                                    <p className="text-[9px] font-bold text-slate-400 truncate mt-1">{order?.userId?.email}</p>
                                </div>
                                <button onClick={handleViewProfile} className="w-full py-3 bg-white border border-slate-200 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] text-slate-600 hover:bg-slate-800 hover:text-white hover:border-slate-800 transition-all flex items-center justify-center gap-2 active:scale-95 shadow-sm group">
                                    <LayoutDashboard size={12} className="group-hover:rotate-12 transition-transform" /> Manage User
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminOrderDetail;