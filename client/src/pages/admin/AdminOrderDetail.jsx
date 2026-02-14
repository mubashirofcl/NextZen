import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    ChevronLeft, User, MapPin, 
    Loader2, ShieldCheck, Box, ExternalLink, ImageIcon,
    Truck, Check, X, AlertTriangle, RotateCcw, Wallet,
} from "lucide-react";
import AdminSidebar from "../../components/admin/AdminSidebar";
import { useAdminOrderDetails, useUpdateOrderStatus } from "../../hooks/admin/useAdminOrders";

const GlobalLoader = ({ message }) => (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-900/70 backdrop-blur-md">
        <div className="bg-white p-10 rounded-2xl shadow-2xl flex flex-col items-center border border-slate-100">
            <Loader2 className="text-[#7a6af6] animate-spin mb-4" size={40} />
            <p className="text-xs font-bold uppercase tracking-widest text-slate-800">{message}</p>
        </div>
    </div>
);

const ReturnProgress = ({ status }) => {
    if (!status) return null;
    const s = status.toLowerCase();
    if (s === 'return rejected') return null; 

    const steps = ['Return Requested', 'Return Approved', 'Returned'];
    let currentIdx = steps.findIndex(step => step.toLowerCase() === s);
    if (currentIdx === -1 && s === 'return authorized') currentIdx = 1;

    return (
        <div className="flex items-center w-full mb-4 px-1">
            {steps.map((step, idx) => {
                const isCompleted = currentIdx >= idx;
                const isLast = idx === steps.length - 1;
                return (
                    <div key={step} className="flex items-center flex-1 last:flex-none">
                        <div className={`relative z-10 w-5 h-5 rounded-full flex items-center justify-center border-[2px] transition-all ${
                            isCompleted ? 'bg-[#7a6af6] border-[#7a6af6] text-white' : 'bg-white border-slate-200 text-transparent'
                        }`}>
                            {isCompleted && <Check size={10} strokeWidth={4} />}
                        </div>
                        {!isLast && (
                            <div className={`flex-1 h-[2px] mx-1 transition-all ${currentIdx > idx ? 'bg-[#7a6af6]' : 'bg-slate-200'}`} />
                        )}
                    </div>
                );
            })}
            <span className="ml-3 text-[9px] font-bold uppercase text-[#7a6af6] tracking-widest">
                {s === 'returned' ? 'Completed' : s === 'return approved' ? 'Authorized' : 'Request Pending'}
            </span>
        </div>
    );
};

const AdminOrderDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { data: response, isLoading } = useAdminOrderDetails(id);
    const order = response?.data;
    const { mutate: updateManifest, isPending: isUpdating } = useUpdateOrderStatus();

    if (isLoading) return <GlobalLoader message="Loading Order Data..." />;

    const globalStatusRank = { "pending": 0, "confirmed": 1, "shipped": 2, "out_for_delivery": 3, "delivered": 4, "cancelled": 5 };
    const itemStatusRank = { "Placed": 0, "Shipped": 1, "Delivered": 2, "Cancelled": 3, "Return Requested": 4, "Return Approved": 5, "Return Rejected": 5, "Returned": 6 };

    const getAssetImage = (item) => item.variantId?.images?.[0] || item.productId?.thumbnail || item.productId?.images?.[0] || null;

    const getStatusStyle = (status) => {
        const s = status?.toLowerCase();
        switch (s) {
            case 'delivered': return 'bg-green-100 text-green-700 border-green-200';
            case 'out_for_delivery': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
            case 'shipped': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'confirmed': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
            case 'return_requested': return 'bg-amber-100 text-amber-700 border-amber-200 animate-pulse';
            case 'return rejected': return 'bg-red-50 text-red-600 border-red-200';
            case 'returned': return 'bg-zinc-100 text-zinc-600 border-zinc-200';
            default: return 'bg-orange-100 text-orange-700 border-orange-200';
        }
    };

    const handleViewProfile = () => {
        if (order?.userId?.email) {
            navigate(`/admin/customers?search=${encodeURIComponent(order.userId.email)}`);
        }
    };

    return (
        <div className="min-h-screen flex bg-[#f8fafc] p-3 gap-3 items-start font-sans text-slate-800">
            <AdminSidebar />
            
            {isUpdating && <GlobalLoader message="Updating Status..." />}

            <main className="flex-1 flex flex-col h-screen overflow-hidden p-6 gap-6">
                
                <header className="bg-white border border-slate-200 rounded-2xl px-6 py-4 flex justify-between items-center shadow-sm shrink-0">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="p-2 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">
                            <ChevronLeft size={20} className="text-slate-600" />
                        </button>
                        <div>
                            <h2 className="text-sm font-black uppercase tracking-wide text-slate-800">Order Inspector</h2>
                            <p className="text-xs font-bold text-[#7a6af6] tracking-wider mt-0.5">#{order?.orderNumber}</p>
                        </div>
                    </div>
                    <div className={`px-4 py-1.5 rounded-lg border text-[11px] font-black uppercase tracking-widest flex items-center gap-2 ${getStatusStyle(order?.status)}`}>
                        <ShieldCheck size={14} />
                        {order?.status === 'pending' ? 'Processing' : order?.status?.replace(/_/g, ' ')}
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                        <div className="xl:col-span-2 space-y-6">
                            
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                                    <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-slate-700">
                                        <Box size={16} /> Shipment Items
                                    </h3>
                                    <span className="text-[11px] font-bold text-slate-500 bg-white px-3 py-1 rounded-md border border-slate-200 shadow-sm">
                                        {order?.items?.length} Units
                                    </span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-white text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100">
                                            <tr>
                                                <th className="px-6 py-4">Product Info</th>
                                                <th className="px-6 py-4">Status & Return Protocol</th>
                                                <th className="px-6 py-4 text-center">Qty</th>
                                                <th className="px-6 py-4 text-right">Price</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {order?.items?.map((item, idx) => {
                                                const currentRank = itemStatusRank[item.status] || 0;
                                                const isReturnFlow = ['Return Requested', 'Return Approved', 'Returned'].includes(item.status);

                                                return (
                                                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                        
                                                        <td className="px-6 py-4 align-top">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-12 h-16 bg-slate-100 border border-slate-200 rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
                                                                    {getAssetImage(item) ? (
                                                                        <img src={getAssetImage(item)} className="w-full h-full object-cover" alt="" />
                                                                    ) : <ImageIcon size={18} className="text-slate-300"/>}
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-bold text-slate-800 uppercase leading-tight mb-1">{item.productId?.name}</p>
                                                                    <p className="text-[11px] font-medium text-slate-500 uppercase">Size: {item.size}</p>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        <td className="px-6 py-4 align-top">
                                                            {isReturnFlow && <ReturnProgress status={item.status} />}

                                                            {item.status === 'Return Requested' ? (
                                                                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 w-[260px]">
                                                                    <div className="flex items-start gap-2 mb-3">
                                                                        <AlertTriangle className="text-amber-500 mt-0.5" size={14} />
                                                                        <div>
                                                                            <p className="text-[10px] font-black text-amber-700 uppercase">Return Requested</p>
                                                                            <p className="text-[11px] text-slate-600 italic leading-snug mt-1">"{item.returnReason}"</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex gap-2">
                                                                        <button 
                                                                            onClick={() => updateManifest({ orderId: id, itemId: item._id, itemStatus: 'Return Approved' })} 
                                                                            className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-[10px] font-bold uppercase flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                                                                        >
                                                                            <Check size={12} /> Approve
                                                                        </button>
                                                                        <button 
                                                                            onClick={() => updateManifest({ orderId: id, itemId: item._id, itemStatus: 'Return Rejected' })} 
                                                                            className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-[10px] font-bold uppercase flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                                                                        >
                                                                            <X size={12} /> Reject
                                                                        </button>
                                                                    </div>
                                                                </div>

                                                            ) : ['Returned', 'Return Rejected', 'Cancelled'].includes(item.status) ? (
                                                                <div className={`w-[180px] px-4 py-2.5 rounded-xl flex items-center gap-2.5 border ${
                                                                    item.status === 'Cancelled' ? 'bg-red-50 border-red-100 text-red-600' :
                                                                    item.status === 'Return Rejected' ? 'bg-red-50 border-red-100 text-red-600' :
                                                                    'bg-zinc-100 border-zinc-200 text-zinc-500'
                                                                }`}>
                                                                    {item.status === 'Returned' ? <RotateCcw size={14} /> : <X size={14} />}
                                                                    <span className="text-[11px] font-bold uppercase">{item.status}</span>
                                                                </div>

                                                            ) : (
                                                                <select
                                                                    value={item.status}
                                                                    onChange={(e) => updateManifest({ orderId: id, itemId: item._id, itemStatus: e.target.value })}
                                                                    className={`w-[180px] border text-[11px] font-bold uppercase px-3 py-2.5 rounded-xl outline-none focus:ring-2 cursor-pointer transition-all ${
                                                                        item.status === 'Return Approved' 
                                                                            ? 'bg-green-50 border-green-200 text-green-700 focus:border-green-500 focus:ring-green-500/20' 
                                                                            : 'bg-white border-slate-200 text-slate-700 focus:border-[#7a6af6] focus:ring-[#7a6af6]/10'
                                                                    }`}
                                                                >
                                                                    {['Placed', 'Shipped', 'Delivered'].includes(item.status) && (
                                                                        <>
                                                                            <option value="Placed" disabled={currentRank > 0} className={currentRank > 0 ? "text-gray-300 bg-gray-50" : ""}>Ready</option>
                                                                            <option value="Shipped" disabled={currentRank > 1} className={currentRank > 1 ? "text-gray-300 bg-gray-50" : ""}>Shipped</option>
                                                                            <option value="Delivered" disabled={currentRank > 2} className={currentRank > 2 ? "text-gray-300 bg-gray-50" : ""}>Delivered</option>
                                                                            
                                                                            {/* HIDE CANCELLED OPTION IF DELIVERED */}
                                                                            {item.status !== 'Delivered' && (
                                                                                <option value="Cancelled" disabled={currentRank > 2}>Cancelled</option>
                                                                            )}
                                                                        </>
                                                                    )}

                                                                    {item.status === 'Return Approved' && (
                                                                        <>
                                                                            <option value="Return Approved" disabled>Return Authorized</option>
                                                                            <option value="Returned">Confirm Item Received</option>
                                                                        </>
                                                                    )}
                                                                </select>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 text-center align-top pt-6">
                                                            <span className="text-[11px] font-bold bg-slate-100 px-3 py-1.5 rounded-lg">{item.quantity}</span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right align-top pt-6">
                                                            <span className="text-sm font-bold text-slate-800">₹{item.totalAmount?.toLocaleString()}</span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex items-center justify-between">
                                <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 bg-[#7a6af6]/10 rounded-xl flex items-center justify-center text-[#7a6af6]">
                                        <Truck size={24} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Control</p>
                                        <h4 className="text-sm font-black text-slate-800 uppercase mt-0.5">Update Shipment Stage</h4>
                                    </div>
                                </div>
                                <select
                                    value={order?.status}
                                    // 🟢 FIX: Disable if Cancelled OR Returned
                                    disabled={['cancelled', 'returned'].includes(order?.status?.toLowerCase())}
                                    onChange={(e) => updateManifest({ orderId: id, globalStatus: e.target.value })}
                                    className="w-[240px] bg-white border-2 border-slate-200 text-slate-800 text-xs font-bold uppercase px-4 py-3 rounded-xl outline-none focus:border-[#7a6af6] transition-all cursor-pointer disabled:bg-slate-50 disabled:opacity-60"
                                >
                                    <option value="pending" disabled={globalStatusRank[order?.status] > 0} className={globalStatusRank[order?.status] > 0 ? "text-gray-300 bg-gray-50" : ""}>Processing</option>
                                    <option value="confirmed" disabled={globalStatusRank[order?.status] > 1} className={globalStatusRank[order?.status] > 1 ? "text-gray-300 bg-gray-50" : ""}>Confirmed</option>
                                    <option value="shipped" disabled={globalStatusRank[order?.status] > 2} className={globalStatusRank[order?.status] > 2 ? "text-gray-300 bg-gray-50" : ""}>Shipped</option>
                                    <option value="out_for_delivery" disabled={globalStatusRank[order?.status] > 3} className={globalStatusRank[order?.status] > 3 ? "text-gray-300 bg-gray-50" : ""}>Out For Delivery</option>
                                    <option value="delivered" disabled={globalStatusRank[order?.status] > 4} className={globalStatusRank[order?.status] > 4 ? "text-gray-300 bg-gray-50" : ""}>Delivered</option>
                                    
                                    {/* HIDE CANCELLED OPTION IF DELIVERED */}
                                    {order?.status !== 'delivered' && order?.status !== 'cancelled' && (
                                        <option value="cancelled" disabled={globalStatusRank[order?.status] > 4}>Cancel Order</option>
                                    )}
                                </select>
                            </div>

                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                                <div className="flex items-center gap-3 mb-5 border-b border-slate-100 pb-4">
                                    <Wallet size={20} className="text-[#7a6af6]" />
                                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Financial Settlement</h3>
                                </div>
                                <div className="grid grid-cols-3 gap-8">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Payment Method</p>
                                        <p className="text-sm font-black text-slate-800 uppercase">{order?.paymentMethod?.replace('cashOnDelivery', 'COD')}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Payment Status</p>
                                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase border ${order?.paymentStatus?.toLowerCase() === 'paid' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                            {order?.paymentStatus || 'Pending'}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Total Amount</p>
                                        <p className="text-lg font-black text-[#7a6af6]">₹{order?.totalAmount?.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>

                        </div>

                        <div className="space-y-6">
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                                <div className="flex items-center gap-3 mb-4 text-slate-400">
                                    <User size={16} />
                                    <h3 className="text-[10px] font-black uppercase tracking-widest">Customer</h3>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm font-black text-slate-800 uppercase">{order?.userId?.name}</p>
                                        <p className="text-xs font-medium text-slate-500 mt-0.5">{order?.userId?.email}</p>
                                    </div>
                                    <button 
                                        onClick={handleViewProfile}
                                        className="w-full py-2.5 border border-slate-200 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-2 text-slate-600"
                                    >
                                        <ExternalLink size={12} /> View Profile
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                                <div className="flex items-center gap-3 mb-4 text-slate-400">
                                    <MapPin size={16} />
                                    <h3 className="text-[10px] font-black uppercase tracking-widest">Shipping To</h3>
                                </div>
                                <div className="pl-3 border-l-2 border-slate-100">
                                    <p className="text-xs font-bold text-slate-800 uppercase mb-2">{order?.addressId?.fullName}</p>
                                    <p className="text-xs text-slate-500 font-medium leading-relaxed uppercase">
                                        {order?.addressId?.addressLine},<br />
                                        {order?.addressId?.city}, {order?.addressId?.state}<br />
                                        <span className="font-bold text-slate-700 mt-1 inline-block">PIN: {order?.addressId?.pincode}</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminOrderDetail;