import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrderDetail } from '../../hooks/user/useOrder';
import {
    ArrowLeft, MapPin, Loader2, CreditCard, Box,
    ShieldCheck, Truck, XCircle, RotateCcw, AlertTriangle,
    CheckCircle2, ImageIcon, Check,
    FileText
} from 'lucide-react'; // Ensure CheckCircle2 is imported
import OrderActionModal from '../../components/user/OrderActionModal';
import { generateInvoice } from '../../utils/invoiceGenerator';

// --- COMPONENT: RETURN TRACKER (Keep as is) ---
const ReturnTracker = ({ status }) => {
    const steps = ['Return Requested', 'Return Approved', 'Returned'];
    let currentStepIndex = steps.indexOf(status);
    if (status === 'Return Authorized') currentStepIndex = 1;

    const stepLabels = ['Requested', 'Approved', 'Returned'];

    if (status === 'Return Rejected') return (
        <div className="w-full mt-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center gap-2 text-red-400">
            <XCircle size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Return Request Rejected</span>
        </div>
    );

    return (
        <div className="w-full mb-2 px-2">
            <div className="relative flex justify-between items-center">
                <div className="absolute top-[6px] left-2 right-2 h-[2px] bg-white/10 z-0" />
                <div
                    className="absolute top-[6px] left-2 h-[2px] bg-[#7a6af6] z-0 transition-all duration-700 ease-out"
                    style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%`, right: `${100 - ((currentStepIndex / (steps.length - 1)) * 100)}%` ? 'auto' : '2px' }}
                />
                {steps.map((step, i) => {
                    const isCompleted = i <= currentStepIndex;
                    return (
                        <div key={step} className="relative z-10 flex flex-col items-center gap-2">
                            <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all duration-500 ${isCompleted ? 'bg-[#7a6af6] border-[#7a6af6] shadow-[0_0_10px_rgba(122,106,246,0.5)]' : 'bg-zinc-900 border-white/20'
                                }`}>
                                {isCompleted && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                            <span className={`text-[8px] font-black uppercase tracking-wider transition-colors duration-500 ${isCompleted ? 'text-white' : 'text-white/20'
                                }`}>
                                {stepLabels[i]}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const OrderDetailPage = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const { data: order, isLoading } = useOrderDetail(orderId);

    const [actionModal, setActionModal] = useState({
        isOpen: false, type: '', itemId: '', itemName: ''
    });

    const glassStyle = "bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[2rem] shadow-2xl";

    if (isLoading) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-[#7a6af6]" size={42} />
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20">Accessing Order...</p>
        </div>
    );

    if (!order) return <div className="py-20 text-center text-white/20 uppercase font-black tracking-widest">Order Not Found</div>;

    // --- 🟢 1. CALCULATE DISPLAY STATUS ---
    // This logic checks if ALL items share a specific state to override the global DB status
    const allItems = order.items || [];
    const areAllCancelled = allItems.length > 0 && allItems.every(i => i.status.toLowerCase() === 'cancelled');
    const areAllReturned = allItems.length > 0 && allItems.every(i => i.status.toLowerCase() === 'returned');

    let displayStatus = order.status;
    if (areAllCancelled) displayStatus = 'Cancelled';
    else if (areAllReturned) displayStatus = 'Returned';

    // --- MAIN ORDER LOGISTICS ---
    const steps = ['Processing', 'Confirmed', 'Shipped', 'Out for Delivery', 'Delivered'];

    const getActiveStepIndex = (status) => {
        const s = status?.toLowerCase();
        if (s === 'pending' || s === 'placed') return 0;
        if (s === 'confirmed') return 1;
        if (s === 'shipped') return 2;
        if (s === 'out_for_delivery') return 3;
        if (s === 'delivered' || s === 'returned') return 4; // Returned implies it was delivered first
        return -1;
    };

    const currentStepIndex = getActiveStepIndex(displayStatus); // Use displayStatus here
    const isOrderDelivered = displayStatus?.toLowerCase() === 'delivered';

    const activeItems = order.items?.filter(i => !['cancelled', 'returned', 'return rejected'].includes(i.status?.toLowerCase())) || [];
    const canCancelFullOrder = ['pending', 'confirmed'].includes(displayStatus?.toLowerCase()) && activeItems.length > 0;

    const openModal = (type, item = null) => {
        setActionModal({
            isOpen: true, type,
            itemId: item ? item._id : 'ALL',
            itemName: item ? item.productId?.name : 'ENTIRE ORDER'
        });
    };

    const getStatusTheme = (status) => {
        const s = status?.toLowerCase();
        switch (s) {
            case 'cancelled': return 'text-red-400 border-red-400/20 bg-red-400/5';
            case 'return requested': return 'text-amber-400 border-amber-400/20 bg-amber-400/5 animate-pulse';
            case 'return approved': return 'text-blue-400 border-blue-400/20 bg-blue-400/5';
            case 'returned': return 'text-zinc-400 border-white/10 bg-white/5';
            case 'delivered': return 'text-green-400 border-green-400/20 bg-green-400/5';
            case 'shipped': return 'text-[#7a6af6] border-[#7a6af6]/20 bg-[#7a6af6]/5';
            default: return 'text-white/40 border-white/10 bg-white/5';
        }
    };

    return (
        <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">

            {/* --- HEADER --- */}
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between pb-8 border-b border-white/5">
                <div className="space-y-4">
                    <button onClick={() => navigate('/profile/orders')} className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.3em] text-white/30 hover:text-[#7a6af6] transition-all group">
                        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back to History
                    </button>
                    <div className="flex flex-wrap items-center gap-6">
                        <h1 className="text-4xl font-black uppercase italic tracking-tighter text-white">
                            Order <span className="text-white/20">#{order.orderNumber?.split('-')[1] || order._id.slice(-6).toUpperCase()}</span>
                        </h1>
                        {/* 🟢 USES COMPUTED DISPLAY STATUS */}
                        <span className={`px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${getStatusTheme(displayStatus)}`}>
                            {displayStatus === 'pending' ? 'Processing' : displayStatus?.replace(/_/g, ' ')}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {canCancelFullOrder && (
                        <button onClick={() => openModal('cancel_all')} className="flex items-center gap-2 px-6 py-3 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">
                            <AlertTriangle size={14} /> Cancel Order
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                <div className="xl:col-span-8 space-y-8">

                    {/* 01. TIMELINE */}
                    <div className={`${glassStyle} p-10`}>
                        <h2 className="text-[10px] font-black uppercase text-[#7a6af6] italic tracking-[0.3em] mb-12 flex items-center gap-2"><Truck size={14} /> 01 // Delivery Progress</h2>

                        {/* 🟢 CONDITIONAL RENDERING FOR CANCELLED / RETURNED */}
                        {displayStatus?.toLowerCase() === 'cancelled' ? (
                            <div className="py-10 border-2 border-dashed border-red-500/20 rounded-3xl flex flex-col items-center justify-center gap-2 text-red-500/40">
                                <XCircle size={32} />
                                <p className="text-[10px] font-black uppercase tracking-widest">Order Cancelled</p>
                            </div>
                        ) : displayStatus?.toLowerCase() === 'returned' ? (
                            <div className="py-10 border-2 border-dashed border-zinc-500/20 bg-white/5 rounded-3xl flex flex-col items-center justify-center gap-2 text-zinc-400">

                                <RotateCcw size={32} />
                                <p className="text-[10px] font-black uppercase tracking-widest">Order Fully Returned</p>
                            </div>
                        ) : (
                            <div className="relative flex justify-between px-2 sm:px-10">
                                <div className="absolute top-[17px] left-10 right-10 h-[1px] bg-white/5 z-0" />
                                <div className="absolute top-[17px] left-10 h-[1px] bg-[#7a6af6] z-0 transition-all duration-1000"
                                    style={{ width: currentStepIndex >= 0 ? `${(currentStepIndex / (steps.length - 1)) * 100}%` : '0%' }} />
                                {steps.map((step, i) => (
                                    <div key={step} className="relative z-10 flex flex-col items-center gap-4">
                                        <div className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all duration-700 ${i <= currentStepIndex ? 'bg-[#7a6af6] border-[#7a6af6] shadow-[0_0_15px_rgba(122,106,246,0.3)]' : 'bg-zinc-900 border-white/10'}`}>
                                            {i <= currentStepIndex ? <CheckCircle2 size={16} className="text-white" /> : <div className="w-1 h-1 rounded-full bg-white/10" />}
                                        </div>
                                        <span className={`text-[7px] font-black uppercase tracking-widest ${i <= currentStepIndex ? 'text-white' : 'text-white/20'}`}>{step}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 02. ITEMS */}
                    <div className="space-y-4">
                        <h2 className="text-[10px] font-black uppercase text-[#7a6af6] italic tracking-[0.3em] px-2 flex items-center gap-2"><Box size={14} /> 02 // Items in this Order</h2>
                        {order.items?.map((item, idx) => {
                            const isCancelled = item.status?.toLowerCase() === 'cancelled';
                            const isReturnFlow = ['return requested', 'return approved', 'returned', 'return rejected'].includes(item.status?.toLowerCase());

                            const canCancelItem = ['pending', 'confirmed'].includes(displayStatus?.toLowerCase()) && item.status?.toLowerCase() === 'placed';
                            const canReturnItem = isOrderDelivered && item.status?.toLowerCase() === 'delivered';

                            return (
                                <div key={idx} className={`${glassStyle} p-6 flex flex-col sm:flex-row items-center gap-6 group`}>
                                    <div className="w-12 h-16 rounded-xl overflow-hidden bg-black border border-white/10 flex-shrink-0 relative">
                                        <img src={item.variantId?.images?.[0] || item.productId?.thumbnail} className={`w-full h-full object-cover ${isCancelled || isReturnFlow ? 'opacity-20 grayscale' : 'opacity-90'}`} alt="" />
                                        {(isCancelled || item.status === 'Returned') && <XCircle size={14} className="absolute inset-0 m-auto text-red-500/50" />}
                                    </div>

                                    <div className="flex-1 w-full space-y-2">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="text-sm font-black uppercase italic text-white tracking-tight">{item.productId?.name}</h4>
                                                <p className="text-[8px] font-black text-white/30 uppercase mt-1">Size: {item.size} // Qty: {item.quantity}</p>
                                            </div>
                                            <p className={`text-lg font-black italic ${isCancelled ? 'text-white/10 line-through' : 'text-white'}`}>₹{item.totalAmount.toLocaleString()}</p>
                                        </div>

                                        {isReturnFlow && (
                                            <div className="mt-4 mb-2">
                                                <h5 className="text-[8px] font-black uppercase tracking-[0.2em] text-white/30 flex items-center gap-1.5 mb-2 ml-1">
                                                    <RotateCcw size={10} /> Return Protocol
                                                </h5>
                                                <ReturnTracker status={item.status} />
                                            </div>
                                        )}

                                        <div className="flex items-center gap-4 mt-2">
                                            {!isReturnFlow && (
                                                <span className={`px-2 py-0.5 rounded text-[7px] font-black uppercase border tracking-widest ${getStatusTheme(item.status)}`}>
                                                    {item.status?.replace(/_/g, ' ')}
                                                </span>
                                            )}

                                            {canCancelItem && (
                                                <button onClick={() => openModal('cancel', item)} className="text-[7px] font-black uppercase text-red-500 hover:text-red-400 flex items-center gap-1 transition-all">
                                                    <XCircle size={10} /> Cancel Item
                                                </button>
                                            )}

                                            {canReturnItem && (
                                                <button onClick={() => openModal('return', item)} className="text-[7px] font-black uppercase text-amber-500 hover:text-amber-400 flex items-center gap-1 transition-all">
                                                    <RotateCcw size={10} /> Return Item
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* 03. ADDRESS */}
                    <div className={`${glassStyle} p-8`}>
                        <h2 className="text-[10px] font-black uppercase text-[#7a6af6] italic tracking-[0.3em] mb-6 flex items-center gap-2"><MapPin size={14} /> 03 // Shipping Address</h2>
                        <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                            <p className="text-xs font-black text-white uppercase italic mb-1">{order.addressId?.fullName}</p>
                            <p className="text-[10px] text-white/60 font-medium uppercase leading-relaxed tracking-wider">
                                {order.addressId?.addressLine}, {order.addressId?.city}, {order.addressId?.state} — {order.addressId?.pincode}
                            </p>
                        </div>
                    </div>
                </div>

                {/* --- RIGHT COLUMN --- */}
                <aside className="xl:col-span-4 space-y-6">
                    <div className="bg-white text-black p-10 rounded-[2.5rem] shadow-2xl">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-black/20 border-b border-black/5 pb-6 mb-8 italic text-center">Settlement</h3>
                        <div className="space-y-4 text-[11px] font-bold uppercase tracking-tight">
                            <div className="flex justify-between text-black/40"><span>Sub-Total</span><span>₹{(order.totalAmount + (order.totalDiscount || 0)).toLocaleString()}</span></div>
                            <div className="flex justify-between text-green-600"><span>Savings</span><span>- ₹{order.totalDiscount || 0}</span></div>
                            <div className="flex justify-between border-b border-black/5 pb-4 text-black/40"><span>Delivery</span><span>{order.deliveryCharge > 0 ? `₹${order.deliveryCharge}` : 'FREE'}</span></div>

                            <div className="pt-4 flex flex-col items-end">
                                <span className="text-[10px] font-black uppercase italic text-[#7a6af6] tracking-[0.2em]">Payable Amount</span>
                                <span className="text-6xl font-black italic tracking-tighter leading-none mt-2">₹{order.totalAmount.toLocaleString()}</span>
                            </div>
                        </div>

                        {displayStatus?.toLowerCase() === 'delivered' && (
                            <button onClick={() => generateInvoice(order)} className="w-full mt-10 py-5 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-[#7a6af6] transition-all shadow-xl active:scale-95">
                                <FileText size={16} /> Download Invoice
                            </button>
                        )}
                    </div>

                    <div className={`${glassStyle} p-8 flex justify-between items-center`}>
                        <div>
                            <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1 italic flex items-center gap-2"><CreditCard size={12} /> Payment Source</p>
                            <p className="text-xs font-black uppercase italic text-white">{order.paymentMethod === 'cashOnDelivery' ? 'Cash on Delivery' : 'Online Payment'}</p>
                        </div>
                        <div className={`p-2 rounded-xl bg-white/5 border border-white/10 ${order.paymentStatus?.toLowerCase() === 'paid' ? 'text-green-500' : 'text-amber-500'}`}>
                            <ShieldCheck size={20} />
                        </div>
                    </div>
                </aside>
            </div>

            <OrderActionModal
                config={actionModal}
                onClose={() => setActionModal({ ...actionModal, isOpen: false })}
                orderId={order._id}
            />
        </div>
    );
};

export default OrderDetailPage;