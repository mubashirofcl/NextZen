import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrderDetail, useOrder } from '../../hooks/user/useOrder';
import { useQueryClient } from '@tanstack/react-query';
import {
    ArrowLeft, MapPin, Loader2, CreditCard, Box, ShieldCheck, Truck,
    XCircle, RotateCcw, AlertTriangle, CheckCircle2, FileText,
    ArrowDownLeft, RefreshCw
} from 'lucide-react';
import OrderActionModal from '../../components/user/OrderActionModal';
import { generateInvoice } from '../../utils/invoiceGenerator';
import userAxios from '../../api/baseAxios';
import { nxToast } from '../../utils/userToast';
import { loadRazorpayScript } from '../../utils/loadRazorpay';

const ReturnTracker = ({ status }) => {
    const steps = ['Return Requested', 'Return Approved', 'Returned'];
    let currentStepIndex = steps.indexOf(status);
    if (status === 'Return Authorized') currentStepIndex = 1;
    const stepLabels = ['Request Sent', 'Approved', 'Refunded'];
    if (status === 'Return Rejected') return (
        <div className="w-full mt-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center gap-2 text-red-400">
            <XCircle size={14} /> <span className="text-[10px] font-bold uppercase tracking-widest">Return Request Declined</span>
        </div>
    );
    return (
        <div className="w-full mb-2 px-2">
            <div className="relative flex justify-between items-center">
                <div className="absolute top-[6px] left-2 right-2 h-[2px] bg-white/10 z-0" />
                <div className="absolute top-[6px] left-2 h-[2px] bg-[#7a6af6] z-0 transition-all duration-700 ease-out" style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }} />
                {steps.map((step, i) => (
                    <div key={step} className="relative z-10 flex flex-col items-center gap-2">
                        <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all duration-500 ${i <= currentStepIndex ? 'bg-[#7a6af6] border-[#7a6af6] shadow-[0_0_10px_rgba(122,106,246,0.5)]' : 'bg-zinc-900 border-white/20'}`}>
                            {i <= currentStepIndex && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <span className={`text-[8px] font-black uppercase tracking-wider transition-colors duration-500 ${i <= currentStepIndex ? 'text-white' : 'text-white/20'}`}>{stepLabels[i]}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const OrderDetailPage = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { data: order, isLoading } = useOrderDetail(orderId);
    const { placeOrder } = useOrder();
    const [actionModal, setActionModal] = useState({ isOpen: false, type: '', itemId: '', itemName: '' });

    const financials = useMemo(() => {
        if (!order?.items) return { subtotal: 0, savings: 0, delivery: 0, refunded: 0, net: 0 };

        let refunded = 0;
        let net = 0;
        const isCOD = ['COD', 'cashOnDelivery'].includes(order.paymentMethod);

        order.items.forEach(item => {
            if (item.status === 'Returned') {
                refunded += (item.totalAmount || 0);
            } else if (item.status === 'Cancelled') {
                if (!isCOD && order.paymentStatus === 'Paid') refunded += (item.totalAmount || 0);
            } else {
                net += (item.totalAmount || 0);
            }
        });

        if (net > 0) net += (order.deliveryCharge || 0);

        return {
            subtotal: (order.subTotal || 0),
            savings: (order.totalDiscount || 0),
            delivery: (order.deliveryCharge || 0),
            refunded,
            net: net || order.totalAmount
        };
    }, [order]);

    const handleRetryPayment = async () => {
        try {
            if (!order?.razorpayOrderId) return nxToast.error("Order session expired.");
            const isLoaded = await loadRazorpayScript();
            if (!isLoaded) return nxToast.security("Payment gateway failed to load.");

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: order.totalAmount * 100,
                currency: "INR",
                name: "Next Zen Store",
                description: `Payment for Order #${order.orderNumber}`,
                order_id: order.razorpayOrderId,
                handler: async function (response) {
                    try {
                        const verifyRes = await userAxios.post("/user/payment/verify-payment", response);

                        if (verifyRes.data.success) {
                            const updateRes = await userAxios.patch(
                                `/users/orders/${order.razorpayOrderId}/complete-retry`,
                                { paymentInfo: response }
                            );

                            if (updateRes.data.success) {
                                // Invalidate cache to show fresh data without manual refresh
                                await queryClient.invalidateQueries({ queryKey: ["order", orderId] });
                                await queryClient.invalidateQueries({ queryKey: ["orders"] });

                                nxToast.success("Success", "Payment verified. Order is processing.");
                                navigate(`/checkout/success/${order._id}`, { replace: true });
                            }
                        }
                    } catch (err) {
                        nxToast.error("Sync Error", "Please refresh the page.");
                    }
                },
                theme: { color: "#7a6af6" },
                modal: { ondismiss: () => nxToast.security("Payment Aborted") }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (err) {
            console.error("Retry Error", err);
        }
    };

    const glassStyle = "bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[2rem] shadow-2xl";

    if (isLoading) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-[#7a6af6]" size={42} />
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20">Loading Manifest...</p>
        </div>
    );

    if (!order) return <div className="py-20 text-center text-white/20 uppercase font-black tracking-widest">Manifest Missing</div>;

    const displayStatus = order.status === 'pending' ? 'Processing' : order.status === 'payment_failed' ? 'Failed' : order.status;
    const steps = ['Processing', 'Confirmed', 'Shipped', 'Out for Delivery', 'Delivered'];
    const currentStepIndex = ((status) => {
        const s = status?.toLowerCase();
        if (s === 'processing' || s === 'pending' || s === 'placed') return 0;
        if (s === 'confirmed') return 1;
        if (s === 'shipped') return 2;
        if (s === 'out_for_delivery') return 3;
        if (s === 'delivered') return 4;
        return -1;
    })(displayStatus);

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
            case 'payment_failed': case 'failed': return 'text-red-500 border-red-500/20 bg-red-500/10';
            case 'return requested': return 'text-amber-400 border-amber-400/20 bg-amber-400/5';
            case 'delivered': return 'text-green-400 border-green-400/20 bg-green-400/5';
            case 'shipped': return 'text-[#7a6af6] border-[#7a6af6]/20 bg-[#7a6af6]/5';
            case 'processing': case 'pending': return 'text-blue-400 border-blue-400/20 bg-blue-400/5';
            default: return 'text-white/40 border-white/10 bg-white/5';
        }
    };

    return (
        <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between pb-8 border-b border-white/5">
                <div className="space-y-4">
                    <button onClick={() => navigate('/profile/orders')} className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.3em] text-white/30 hover:text-[#7a6af6] transition-all"><ArrowLeft size={14} /> Back to History</button>
                    <div className="flex flex-wrap items-center gap-6">
                        <h1 className="text-4xl font-black uppercase italic tracking-tighter text-white">Order <span className="text-white/20">#{order.orderNumber?.split('-')[1] || order._id.slice(-6).toUpperCase()}</span></h1>
                        <span className={`px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${getStatusTheme(displayStatus)}`}>{displayStatus?.replace(/_/g, ' ')}</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {['pending', 'processing', 'confirmed'].includes(order.status.toLowerCase()) && order.items?.some(i => i.status !== 'Cancelled') && (
                        <button onClick={() => openModal('cancel_all')} className="flex items-center gap-2 px-6 py-3 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-xl shadow-red-500/5">
                            <AlertTriangle size={14} /> Cancel Order
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                <div className="xl:col-span-8 space-y-8">
                    <div className={`${glassStyle} p-10`}>
                        <h2 className="text-[10px] font-black uppercase text-[#7a6af6] italic tracking-[0.3em] mb-12 flex items-center gap-2"><Truck size={14} /> Tracking Status</h2>
                        {order.status === 'payment_failed' ? (
                            <div className="py-10 border-2 border-dashed border-red-500/20 rounded-3xl flex flex-col items-center justify-center gap-2 text-red-500/40"><XCircle size={32} /><p className="text-[10px] font-black uppercase tracking-widest">Payment Incomplete</p></div>
                        ) : (
                            <div className="relative flex justify-between px-2 sm:px-10">
                                <div className="absolute top-[17px] left-10 right-10 h-[1px] bg-white/5 z-0" />
                                <div className="absolute top-[17px] left-10 h-[1px] bg-[#7a6af6] z-0 transition-all duration-1000" style={{ width: `${(currentStepIndex / 4) * 100}%` }} />
                                {steps.map((step, i) => (
                                    <div key={step} className="relative z-10 flex flex-col items-center gap-4">
                                        <div className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all duration-700 ${i <= currentStepIndex ? 'bg-[#7a6af6] border-[#7a6af6]' : 'bg-zinc-900 border-white/10'}`}>{i <= currentStepIndex ? <CheckCircle2 size={16} className="text-white" /> : <div className="w-1 h-1 rounded-full bg-white/10" />}</div>
                                        <span className={`text-[7px] font-black uppercase tracking-widest ${i <= currentStepIndex ? 'text-white' : 'text-white/20'}`}>{step}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-[10px] font-black uppercase text-[#7a6af6] italic tracking-[0.3em] px-2 flex items-center gap-2"><Box size={14} /> Manifest Items</h2>
                        {order.items?.map((item, idx) => {
                            const canCancelItem = ['pending', 'processing', 'confirmed'].includes(order.status.toLowerCase()) && item.status?.toLowerCase() === 'placed';
                            const canReturnItem = order.status.toLowerCase() === 'delivered' && item.status?.toLowerCase() === 'delivered';
                            return (
                                <div key={idx} className={`${glassStyle} p-6 flex flex-col sm:flex-row items-center gap-6 group`}>
                                    <div className="w-12 h-16 rounded-xl overflow-hidden bg-black border border-white/10 shrink-0 relative">
                                        <img src={item.variantId?.images?.[0] || item.productId?.thumbnail} className={`w-full h-full object-cover ${item.status === 'Cancelled' ? 'opacity-20 grayscale' : 'opacity-90'}`} alt="" />
                                        {item.status === 'Cancelled' && <XCircle size={14} className="absolute inset-0 m-auto text-red-500/50" />}
                                    </div>
                                    <div className="flex-1 w-full space-y-2">
                                        <div className="flex justify-between items-start">
                                            <div><h4 className="text-sm font-black uppercase italic text-white tracking-tight">{item.productId?.name}</h4><p className="text-[8px] font-black text-white/30 uppercase mt-1">Size: {item.size} | Qty: {item.quantity}</p></div>
                                            <p className={`text-lg font-black italic ${item.status === 'Cancelled' ? 'text-white/10 line-through' : 'text-white'}`}>₹{item.totalAmount.toLocaleString()}</p>
                                        </div>
                                        {['Return Requested', 'Return Approved', 'Returned', 'Return Rejected'].includes(item.status) && (
                                            <div className="mt-4 mb-2"><ReturnTracker status={item.status} /></div>
                                        )}
                                        <div className="flex items-center gap-4 mt-2">
                                            {!['Return Requested', 'Return Approved', 'Returned'].includes(item.status) && (
                                                <span className={`px-2 py-0.5 rounded text-[7px] font-black uppercase border tracking-widest ${getStatusTheme(item.status)}`}>{item.status?.replace(/_/g, ' ')}</span>
                                            )}
                                            {canCancelItem && (
                                                <button onClick={() => openModal('cancel', item)} className="text-[7px] font-black uppercase text-red-500 hover:text-red-400 flex items-center gap-1 transition-all"><XCircle size={10} /> Cancel Asset</button>
                                            )}
                                            {canReturnItem && (
                                                <button onClick={() => openModal('return', item)} className="text-[7px] font-black uppercase text-amber-500 hover:text-amber-400 flex items-center gap-1 transition-all"><RotateCcw size={10} /> Return Asset</button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className={`${glassStyle} p-8`}>
                        <h2 className="text-[10px] font-black uppercase text-[#7a6af6] italic tracking-[0.3em] mb-6 flex items-center gap-2"><MapPin size={14} /> Delivery Destination</h2>
                        <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                            <p className="text-xs font-black text-white uppercase italic mb-1">{order.addressId?.fullName}</p>
                            <p className="text-[10px] text-white/60 font-medium uppercase leading-relaxed tracking-wider">{order.addressId?.addressLine}, {order.addressId?.city}, {order.addressId?.state} — {order.addressId?.pincode}</p>
                        </div>
                    </div>
                </div>

                <aside className="xl:col-span-4 space-y-6">
                    <div className="bg-white text-black p-10 rounded-[2.5rem] shadow-2xl">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-black/20 border-b border-black/5 pb-6 mb-8 italic text-center">Settlement Summary</h3>
                        <div className="space-y-4 text-[11px] font-bold uppercase tracking-tight">
                            <div className="flex justify-between text-black/40"><span>Base Value</span><span>₹{(financials.subtotal).toLocaleString()}</span></div>
                            <div className="flex justify-between text-green-600"><span>Voucher Savings</span><span>- ₹{financials.savings.toLocaleString()}</span></div>
                            <div className="flex justify-between text-black/40"><span>Shipping</span><span>{financials.delivery > 0 ? `₹${financials.delivery}` : 'FREE'}</span></div>

                            {financials.refunded > 0 && (
                                <div className="py-3 px-4 bg-green-50 border border-green-200 rounded-xl flex justify-between items-center text-green-700">
                                    <span className="flex items-center gap-1.5"><ArrowDownLeft size={14} /> Total Refunded</span>
                                    <span className="font-black text-sm">₹{financials.refunded.toLocaleString()}</span>
                                </div>
                            )}

                            <div className="pt-6 mt-4 border-t border-black/5 flex flex-col items-end">
                                <span className="text-[10px] font-black uppercase italic text-[#7a6af6] tracking-[0.2em]">{financials.refunded > 0 ? 'Settled Total' : 'Net Total'}</span>
                                <span className="text-6xl font-black italic tracking-tighter leading-none mt-2">₹{financials.net.toLocaleString()}</span>
                            </div>
                        </div>

                        {order.status === 'payment_failed' && (
                            <button onClick={handleRetryPayment} className="w-full mt-10 py-5 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-3 hover:bg-black transition-all shadow-xl active:scale-95"><RefreshCw size={16} /> Complete Payment</button>
                        )}

                        {order.status.toLowerCase() === 'delivered' && (
                            <button onClick={() => generateInvoice(order)} className="w-full mt-10 py-5 bg-black text-white rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-3 hover:bg-[#7a6af6] transition-all shadow-xl active:scale-95">
                                <FileText size={16} /> Download Invoice
                            </button>
                        )}
                    </div>

                    <div className={`${glassStyle} p-8 flex justify-between items-center`}>
                        <div>
                            <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1 italic flex items-center gap-2"><CreditCard size={12} /> Payment Method</p>
                            <p className="text-xs font-black uppercase italic text-white">{order.paymentMethod === 'cashOnDelivery' ? 'Cash on Delivery' : 'Razorpay'}</p>
                            <p className={`text-[8px] font-black uppercase mt-1 ${order.paymentStatus === 'Paid' ? 'text-green-500' : 'text-amber-500'}`}>{order.paymentStatus}</p>
                        </div>
                        <div className={`p-2 rounded-xl bg-white/5 border border-white/10 ${order.paymentStatus === 'Paid' ? 'text-green-500' : 'text-amber-500'}`}>
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