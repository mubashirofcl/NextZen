import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrderDetail } from '../../hooks/user/useOrder'; 
import { 
    ArrowLeft, MapPin, Loader2, CreditCard, Box, 
    ShieldCheck, Truck, Calendar, Clock, 
    FileText, Info, RotateCcw, XCircle, ChevronRight, RefreshCcw, AlertTriangle
} from 'lucide-react';
import OrderActionModal from '../../components/user/OrderActionModal';
import { generateInvoice } from '../../utils/invoiceGenerator';

const OrderDetailPage = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const { data: order, isLoading } = useOrderDetail(orderId);
    
    const [actionModal, setActionModal] = useState({ isOpen: false, type: '', itemId: '', itemName: '' });

    const glassStyle = "bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[2rem] shadow-2xl";
    const accentText = "text-[#7a6af6]";

    if (isLoading) return (
        <div className="min-h-96 flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-[#7a6af6]" size={32} />
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20">Syncing Manifest...</p>
        </div>
    );
    
    if (!order) return <div className="py-20 text-center text-white/20 uppercase font-black tracking-widest">Manifest Not Found</div>;

    const steps = ['Placed', 'Confirmed', 'Shipped', 'Out for Delivery', 'Delivered'];
    const currentStatus = order.status?.charAt(0).toUpperCase() + order.status?.slice(1);
    const currentStepIndex = steps.indexOf(currentStatus) !== -1 ? steps.indexOf(currentStatus) : 0;

    /**
     * INDUSTRIAL LOGIC: 
     * We only show the global "Cancel Entire Order" button if the order is still in 
     * a cancellable state (pending/confirmed) AND there is more than one active item. 
     * Single-item cancellations are handled directly on the item card.
     */
    const canCancelFullOrder = ['pending', 'confirmed'].includes(order.status) && (order.items?.length > 1);

    const openModal = (type, item = null) => {
        setActionModal({ 
            isOpen: true, 
            type, 
            itemId: item ? item._id : 'ALL', 
            itemName: item ? item.productId?.name : 'FULL ORDER' 
        });
    };

    const getItemStatusBadge = (status) => {
        switch (status) {
            case 'cancelled': return 'text-red-400 border-red-400/20 bg-red-400/5';
            case 'return_requested': return 'text-amber-400 border-amber-400/20 bg-amber-400/5';
            case 'returned': return 'text-blue-400 border-blue-400/20 bg-blue-400/5';
            case 'delivered': return 'text-green-400 border-green-400/20 bg-green-400/5';
            default: return 'text-white/40 border-white/10 bg-white/5';
        }
    };

    const getRefundBadgeStyle = (status) => {
        switch (status) {
            case 'refund_pending': return 'text-blue-400 border-blue-400/20 bg-blue-400/5 animate-pulse';
            case 'refund_completed': return 'text-green-400 border-green-400/20 bg-green-400/5';
            case 'refund_failed': return 'text-red-400 border-red-400/20 bg-red-400/5';
            default: return 'hidden';
        }
    };

    return (
        <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            
            {/* --- TOP BAR: IDENTITY & GLOBAL ACTIONS --- */}
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between pb-8 border-b border-white/5">
                <div className="space-y-4">
                    <button onClick={() => navigate('/profile/orders')} className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.3em] text-white/30 hover:text-[#7a6af6] transition-all group">
                        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back to History
                    </button>
                    <div className="flex flex-wrap items-center gap-6">
                        <h1 className="text-4xl font-black uppercase italic tracking-tighter text-white leading-none">
                            Manifest <span className="text-white/20">#{order.orderNumber?.split('-')[1] || order._id.slice(-6).toUpperCase()}</span>
                        </h1>
                        <div className="flex items-center gap-3">
                            <span className={`px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${getItemStatusBadge(order.status)}`}>
                                {order.status}
                            </span>
                            
                            {/* --- GLOBAL CANCEL BUTTON (HIDDEN IF SINGLE ITEM) --- */}
                            {canCancelFullOrder && (
                                <button 
                                    onClick={() => openModal('cancel_all')}
                                    className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-red-500/30 bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/10 active:scale-95"
                                >
                                    <AlertTriangle size={12} /> Cancel Entire Order
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-8">
                    <div className="text-right hidden sm:block">
                        <p className="text-[10px] font-black uppercase text-white/20 tracking-widest mb-1">Order Date</p>
                        <p className="text-xs font-bold text-white uppercase">{new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    </div>
                    {order.status !== 'delivered' && order.status !== 'cancelled' && (
                        <div className="bg-[#7a6af6]/10 p-4 rounded-2xl border border-[#7a6af6]/20 flex items-center gap-4">
                            <Clock className="text-[#7a6af6] animate-pulse" size={18} />
                            <div>
                                <p className="text-[9px] font-black text-[#7a6af6] uppercase tracking-widest">Est. Arrival</p>
                                <p className="text-xs font-bold text-white uppercase">Expected within 5 days</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                <div className="xl:col-span-8 space-y-8">
                    
                    {/* 01. TIMELINE */}
                    <div className={`${glassStyle} p-10`}>
                        <h2 className="text-[10px] font-black uppercase text-[#7a6af6] italic tracking-[0.3em] mb-12 flex items-center gap-2"><Truck size={14} /> 01 // Delivery Timeline</h2>
                        {order.status === 'cancelled' ? (
                            <div className="py-6 border-2 border-dashed border-red-500/20 rounded-3xl flex flex-col items-center justify-center gap-2 text-red-500">
                                <XCircle size={24} />
                                <p className="text-[10px] font-black uppercase tracking-widest">This order was cancelled</p>
                            </div>
                        ) : (
                            <div className="relative flex justify-between px-2 sm:px-10">
                                <div className="absolute top-[17px] left-10 right-10 h-[2px] bg-white/5 z-0" />
                                <div className="absolute top-[17px] left-10 right-10 h-[2px] bg-[#7a6af6]/30 z-0 transition-all duration-1000" style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }} />
                                {steps.map((step, i) => (
                                    <div key={step} className="relative z-10 flex flex-col items-center gap-4">
                                        <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all duration-700 ${i <= currentStepIndex ? 'bg-[#7a6af6] border-[#7a6af6] shadow-[0_0_20px_rgba(122,106,246,0.4)]' : 'bg-zinc-900 border-white/10'}`}>
                                            {i <= currentStepIndex ? <ShieldCheck size={16} className="text-white" /> : <div className="w-2 h-2 rounded-full bg-white/10" />}
                                        </div>
                                        <span className={`hidden sm:block text-[8px] font-black uppercase tracking-tighter ${i <= currentStepIndex ? 'text-white' : 'text-white/20'}`}>{step}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 02. ASSET MANIFEST (ITEMS) */}
                    <div className="space-y-4">
                        <h2 className="text-[10px] font-black uppercase text-[#7a6af6] italic tracking-[0.3em] px-2 flex items-center gap-2"><Box size={14} /> 02 // Items in your package</h2>
                        <div className="space-y-4">
                            {order.items?.map((item, idx) => {
                                const isCancelled = item.status === 'cancelled';
                                const isReturnInitiated = ['return_requested', 'returned'].includes(item.status);
                                const canCancel = ['pending', 'confirmed'].includes(order.status) && item.status === 'placed';
                                const canReturn = order.status === 'delivered' && item.status === 'delivered';

                                return (
                                    <div key={idx} className={`${glassStyle} p-6 flex flex-col sm:flex-row items-center gap-8 group relative overflow-hidden`}>
                                        <div className="w-24 h-28 rounded-2xl overflow-hidden bg-black border border-white/10 flex-shrink-0 relative">
                                            <img src={item.variantId?.images?.[0]} className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-110 ${isCancelled || isReturnInitiated ? 'opacity-20 grayscale' : ''}`} alt="" />
                                            {isCancelled && <div className="absolute inset-0 flex items-center justify-center"><XCircle className="text-red-500" size={32} /></div>}
                                            {isReturnInitiated && <div className="absolute inset-0 flex items-center justify-center"><RefreshCcw className="text-amber-500 animate-spin-slow" size={32} /></div>}
                                        </div>

                                        <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-6 w-full">
                                            <div className="space-y-3">
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <h4 className="text-base font-black uppercase italic text-white leading-none">{item.productId?.name}</h4>
                                                    <span className={`px-2.5 py-0.5 rounded text-[7px] font-black uppercase border tracking-widest ${getItemStatusBadge(item.status)}`}>{item.status.replace('_', ' ')}</span>
                                                    
                                                    {item.refundStatus !== 'none' && (
                                                        <span className={`px-2.5 py-0.5 rounded text-[7px] font-black uppercase border tracking-widest ${getRefundBadgeStyle(item.refundStatus)}`}>
                                                            <CreditCard size={8} className="inline mr-1" /> Refund {item.refundStatus.split('_')[1]}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex gap-4 text-[10px] text-white/30 font-bold uppercase tracking-widest leading-none">
                                                    <span>SIZE: {item.size}</span>
                                                    <span>QTY: {item.quantity}</span>
                                                </div>
                                                {(item.reason || isReturnInitiated) && (
                                                    <div className={`mt-2 p-3 rounded-xl border ${isReturnInitiated ? 'bg-amber-500/5 border-amber-500/10' : 'bg-red-500/5 border-red-500/10'} space-y-1`}>
                                                        <p className={`text-[9px] font-black uppercase tracking-widest ${isReturnInitiated ? 'text-amber-500' : 'text-red-500'}`}>Request Details</p>
                                                        <p className="text-[10px] text-white/60 font-medium uppercase leading-tight italic">Reason: {item.reason || "Not provided"}</p>
                                                        {item.actionDate && <p className="text-[8px] text-white/20 font-black uppercase">Processed: {new Date(item.actionDate).toLocaleString()}</p>}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex flex-col items-center sm:items-end gap-4">
                                                <p className={`text-2xl font-black italic tracking-tighter ${isCancelled ? 'text-white/10 line-through' : 'text-white'}`}>₹{(item.price * item.quantity).toLocaleString()}</p>
                                                <div className="flex gap-2">
                                                    {canCancel && (
                                                        <button onClick={() => openModal('cancel', item)} className="flex items-center gap-2 px-4 py-2 text-[9px] font-black uppercase bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all rounded-xl"><XCircle size={14} /> Cancel Item</button>
                                                    )}
                                                    {canReturn && (
                                                        <button onClick={() => openModal('return', item)} className="flex items-center gap-2 px-4 py-2 text-[9px] font-black uppercase bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-white transition-all rounded-xl"><RotateCcw size={14} /> Return Item</button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* 03. DESTINATION & PAYMENT */}
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className={`${glassStyle} p-8 space-y-4`}>
                            <h3 className="text-[10px] font-black uppercase text-[#7a6af6] italic tracking-[0.3em] flex items-center gap-2"><MapPin size={14} /> 03 // Shipping Address</h3>
                            <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl">
                                <p className="text-sm font-black uppercase italic text-white mb-1">{order.addressId?.fullName}</p>
                                <p className="text-[10px] text-white/40 uppercase font-bold leading-relaxed tracking-wider">{order.addressId?.addressLine}, {order.addressId?.city}<br />{order.addressId?.state} — {order.addressId?.pincode}</p>
                            </div>
                        </div>
                        <div className={`${glassStyle} p-8 space-y-4`}>
                            <h3 className="text-[10px] font-black uppercase text-[#7a6af6] italic tracking-[0.3em] flex items-center gap-2"><CreditCard size={14} /> 04 // Payment Details</h3>
                            <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl">
                                <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1 italic">Payment Method</p>
                                <p className={`text-xs font-black uppercase italic text-white`}>{order.paymentMethod === 'cashOnDelivery' ? 'Cash on Delivery' : 'Online Payment'}</p>
                                <div className="mt-3 flex items-center gap-2 text-[8px] font-black text-white/20 uppercase"><ShieldCheck size={12} className="text-green-500/50" /> Verified Secure Transaction</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- RIGHT COLUMN: SETTLEMENT --- */}
                <aside className="xl:col-span-4 space-y-8">
                    <div className="bg-white text-black p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden xl:sticky xl:top-8">
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1.5px, transparent 1px)', backgroundSize: '20px 20px' }} />
                        <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-black/20 border-b pb-6 mb-8 italic text-center">Settlement Manifest</h3>
                        <div className="space-y-5 text-[11px] font-bold uppercase tracking-tight text-black/40">
                            <div className="flex justify-between"><span>Original Price</span><span className="text-black font-black">₹{order.totalMarketPrice?.toLocaleString()}</span></div>
                            <div className="flex justify-between text-green-600"><span>Applied Savings</span><span className="font-black italic">- ₹{order.totalDiscount?.toLocaleString()}</span></div>
                            <div className="flex justify-between border-b border-dashed border-black/10 pb-6"><span>Delivery Charge</span><span className="text-black font-black italic">{order.deliveryCharge > 0 ? `₹${order.deliveryCharge}` : 'FREE'}</span></div>
                            
                            {order.items.some(i => i.refundAmount > 0) && (
                                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl space-y-2">
                                    <div className="flex justify-between text-blue-600">
                                        <span className="font-black text-[9px] tracking-widest uppercase">Refund Total</span>
                                        <span className="font-black italic">₹{order.items.reduce((acc, i) => acc + i.refundAmount, 0).toLocaleString()}</span>
                                    </div>
                                </div>
                            )}

                            <div className="pt-2 flex flex-col items-end">
                                <span className="text-[10px] font-black uppercase italic text-[#7a6af6] tracking-[0.3em] mb-1">Total Payable</span>
                                <span className="text-6xl font-black italic tracking-tighter leading-none">₹{order.totalAmount?.toLocaleString()}</span>
                            </div>
                        </div>
                        {order.status === 'delivered' && (
                            <button onClick={() => generateInvoice(order)} className="w-full mt-10 py-5 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] flex items-center justify-center gap-3 hover:bg-[#7a6af6] transition-all duration-500 shadow-xl"><FileText size={16} /> Download Invoice</button>
                        )}
                    </div>

                    <div className="p-6 border border-white/5 rounded-3xl flex items-center gap-4 bg-white/[0.02]">
                        <div className="w-10 h-10 rounded-full bg-[#7a6af6]/10 flex items-center justify-center text-[#7a6af6]">
                            <Info size={18} />
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-[10px] font-black uppercase text-white/80 italic">Customer Care</p>
                            <p className="text-[9px] font-bold text-white/20 uppercase tracking-tight">Need help? Our team is here to assist with any order queries.</p>
                        </div>
                    </div>
                </aside>
            </div>
            <OrderActionModal config={actionModal} onClose={() => setActionModal({ ...actionModal, isOpen: false })} orderId={order._id} />
        </div>
    );
};

export default OrderDetailPage;