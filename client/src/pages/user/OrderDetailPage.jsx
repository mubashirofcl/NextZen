import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrderDetail, useOrder } from '../../hooks/user/useOrder';
import { useQueryClient } from '@tanstack/react-query';
import {
    ArrowLeft, MapPin, Loader2, CreditCard, Box, ShieldCheck, Truck,
    XCircle, RotateCcw, AlertTriangle, CheckCircle2, FileText,
    ArrowDownLeft, RefreshCw, Wallet, Clock, Tag, Percent, X
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
            <XCircle size={14} /> <span className="text-[10px] font-bold uppercase tracking-widest">Return Declined</span>
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
    const [isRetrying, setIsRetrying] = useState(false);

    const fixNum = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

    const isPrepaid = ['razorpay', 'wallet'].includes(order?.paymentMethod);
    const hasPaid = ['Paid', 'Refunded'].includes(order?.paymentStatus);
    const isActualRefund = isPrepaid && hasPaid;

    const isReturnExpired = useMemo(() => {
        if (!order || order.status !== 'delivered') return false;

        const deliveryDate = new Date(order.updatedAt);
        const now = new Date();
        const diffTime = Math.abs(now - deliveryDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return diffDays > 7;
    }, [order]);

    const financials = useMemo(() => {
        if (!order) return { initialSubtotal: 0, delivery: 0, totalRefunded: 0, net: 0, savings: 0, couponSavings: 0 };

        const delivery = order.deliveryCharge || 0;
        const originalGrossSubtotal = fixNum(order.subTotal || 0);
        const couponSavings = fixNum(order.couponDiscount || 0);

        const isShippedOrBeyond = ['shipped', 'out_for_delivery', 'delivered', 'returned'].includes(order.status.toLowerCase());

        let calculatedRefundTotal = 0;
        let cancelledItemsCount = 0;

        order.items.forEach(item => {
            if (['Cancelled', 'Returned'].includes(item.status)) {
                let itemCouponShare = 0;
                if (couponSavings > 0 && originalGrossSubtotal > 0) {
                    itemCouponShare = fixNum((item.totalAmount / originalGrossSubtotal) * couponSavings);
                }
                const individualRefund = fixNum(item.totalAmount - itemCouponShare);
                calculatedRefundTotal = fixNum(calculatedRefundTotal + individualRefund);
                cancelledItemsCount++;
            }
        });

        const allCancelled = cancelledItemsCount === order.items.length;
        if (allCancelled && !isShippedOrBeyond) {
            calculatedRefundTotal = fixNum(calculatedRefundTotal + delivery);
        }

        return {
            initialSubtotal: originalGrossSubtotal,
            delivery: delivery,
            savings: order.totalDiscount || 0,
            couponSavings: couponSavings,
            totalRefunded: fixNum(calculatedRefundTotal),
            net: fixNum(order.totalAmount || 0),
        };
    }, [order]);

    const handleRetryPayment = async () => {
        try {
            setIsRetrying(true);
            if (!order?._id) return nxToast.error("Manifest missing.");

            const isLoaded = await loadRazorpayScript();
            if (!isLoaded) return nxToast.security("Gateway error.");


            const { data: sessionData } = await userAxios.post("/user/payment/create-order", {
                orderId: order._id,
                isRetry: true
            });

            if (!sessionData.success) {
                return nxToast.security("Procedure Blocked", sessionData.message);
            }

            if (sessionData.payableAmount && sessionData.payableAmount !== order.totalAmount) {
                nxToast.security("Policy Alert", "Promotion expired. Manifest adjusted to standard price.");
                queryClient.setQueryData(["order", orderId], (old) =>
                    old ? {
                        ...old,
                        totalAmount: sessionData.payableAmount,
                        couponCode: null,
                        couponDiscount: 0,
                        couponExpired: true
                    } : old
                );
            }

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: sessionData.order.amount,
                currency: "INR",
                name: "Next Zen Store",
                description: `Settling Manifest #${order.orderNumber?.split('-')[1]}`,
                order_id: sessionData.order.id,
                handler: async function (response) {
                    try {
                        const updateRes = await userAxios.patch(`/users/orders/${order._id}/complete-retry`, {
                            paymentInfo: response,
                            newRazorpayOrderId: sessionData.order.id
                        });

                        if (updateRes.data.success) {
                            nxToast.success("Manifest Secured");
                            await queryClient.invalidateQueries({ queryKey: ["order", orderId] });
                            navigate(`/checkout/success/${order._id}`, { replace: true });
                        }
                    } catch (err) {
                        nxToast.security("Sync Error", "Transaction verified but manifest update failed.");
                    }
                },
                prefill: {
                    name: order.addressId?.fullName || "",
                    email: order.userId?.email || ""
                },
                theme: { color: "#7a6af6" },
                modal: { ondismiss: () => nxToast.info("Checkout Interrupted") }
            };

            new window.Razorpay(options).open();
        } catch (err) {
            const errorMsg = err.response?.data?.message || "Verification Failed";
            nxToast.security("Warehouse Sync Error", errorMsg);
            await queryClient.invalidateQueries({ queryKey: ["order", orderId] });
        } finally {
            setIsRetrying(false);
        }
    };

    const glassStyle = "bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[2rem] shadow-2xl";

    if (isLoading) return <div className="min-h-[60vh] flex flex-col items-center justify-center"><Loader2 className="animate-spin text-[#7a6af6]" size={42} /></div>;
    if (!order) return <div className="py-20 text-center text-white/20 uppercase font-black">Manifest Missing</div>;

    const displayStatus = order.status === 'pending' ? 'Processing' : order.status === 'payment_failed' ? 'Failed' : order.status;
    const steps = ['Processing', 'Confirmed', 'Shipped', 'Out for Delivery', 'Delivered'];
    const currentStepIndex = (() => {
        const s = displayStatus.toLowerCase();
        if (s === 'processing' || s === 'pending' || s === 'placed') return 0;
        if (s === 'confirmed') return 1;
        if (s === 'shipped') return 2;
        if (s === 'out_for_delivery') return 3;
        if (s === 'delivered') return 4;
        return -1;
    })();

    const openModal = async (type, item = null) => {
        // 🟢 Added check for return expiration
        if (type === 'return' && isReturnExpired) {
            return nxToast.info(
                "Window Closed",
                "The 7-day return period for this manifest has expired."
            );
        }

        if (type === 'cancel' && item && order.couponCode) {
            try {
                const { data: couponRes } = await userAxios.get(`/user/coupons/check/${order.couponCode}`);
                if (couponRes.success && couponRes.coupon) {
                    const minAmt = couponRes.coupon.minPurchaseAmt;
                    const activeItems = order.items.filter(i => i.status !== 'Cancelled' && i._id !== item._id);
                    const remainingSubtotal = activeItems.reduce((acc, curr) => acc + curr.totalAmount, 0);

                    if (activeItems.length > 0 && remainingSubtotal < minAmt) {
                        return nxToast.security("Action Blocked", `Minimum order of ₹${minAmt} required for applied coupon.`);
                    }
                }
            } catch (error) { console.error(error); }
        }

        setActionModal({
            isOpen: true, type,
            itemId: item ? item._id : 'ALL',
            itemName: item ? item.productId?.name : 'ENTIRE ORDER'
        });
    };

    const getStatusTheme = (status) => {
        const s = status?.toLowerCase();
        if (s === 'cancelled' || s === 'returned') return 'text-red-400 border-red-400/20 bg-red-400/5';
        if (s === 'delivered') return 'text-green-400 border-green-400/20 bg-green-400/5';
        return 'text-[#7a6af6] border-[#7a6af6]/20 bg-[#7a6af6]/5';
    };

    return (
        <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between pb-8 border-b border-white/5">
                <div className="space-y-4">
                    <button onClick={() => navigate('/profile/orders')} className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.3em] text-white/30 hover:text-[#7a6af6] transition-all"><ArrowLeft size={14} /> History</button>
                    <div className="flex flex-wrap items-center gap-6">
                        <h1 className="text-4xl font-black uppercase italic tracking-tighter text-white">Order <span className="text-white/20">#{order.orderNumber?.split('-')[1] || order._id.slice(-6).toUpperCase()}</span></h1>
                        <span className={`px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${getStatusTheme(displayStatus)}`}>{displayStatus?.replace(/_/g, ' ')}</span>
                    </div>
                </div>
                {['pending', 'processing', 'confirmed'].includes(order.status.toLowerCase()) && order.items?.some(i => i.status !== 'Cancelled') && (
                    <button onClick={() => openModal('cancel_all')} className="px-6 py-3 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">Cancel Order</button>
                )}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                <div className="xl:col-span-8 space-y-8">
                    <div className={`${glassStyle} p-10`}>
                        <h2 className="text-[10px] font-black uppercase text-[#7a6af6] italic tracking-[0.3em] mb-12 flex items-center gap-2"><Truck size={14} /> Logistics</h2>
                        {order.status === 'payment_failed' ? (
                            <div className="py-10 border-2 border-dashed border-red-500/20 rounded-3xl flex flex-col items-center justify-center gap-2 text-red-400/40"><XCircle size={32} /><p className="text-[10px] font-black uppercase tracking-widest">Handshake Failed</p></div>
                        ) : (
                            <div className="relative flex justify-between px-2 sm:px-10">
                                <div className="absolute top-[17px] left-10 right-10 h-[1px] bg-white/5 z-0" />
                                <div className="absolute top-[17px] left-10 h-[1px] bg-[#7a6af6] z-0 transition-all duration-1000" style={{ width: `${currentStepIndex >= 0 ? (currentStepIndex / 4) * 100 : 0}%` }} />
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
                        <h2 className="text-[9px] font-black uppercase text-[#7a6af6] italic tracking-[0.3em] px-2 flex items-center gap-2"><Box size={14} /> Manifest Items</h2>
                        {order.items?.map((item, idx) => {
                            const currentCouponDiscount = financials.couponSavings;
                            const currentSubTotal = financials.initialSubtotal;
                            let itemCouponShare = 0;
                            if (currentCouponDiscount > 0 && currentSubTotal > 0) {
                                itemCouponShare = fixNum((item.totalAmount / currentSubTotal) * currentCouponDiscount);
                            }
                            const netItemPrice = fixNum(item.totalAmount - itemCouponShare);

                            return (
                                <div key={idx} className={`${glassStyle} p-6 flex flex-col sm:flex-row items-center gap-6 group relative overflow-hidden`}>
                                    <div className="w-16 h-20 rounded-xl overflow-hidden bg-black border border-white/10 shrink-0 relative">
                                        <img src={item.variantId?.images?.[0] || item.productId?.thumbnail} className={`w-full h-full object-cover ${['Cancelled', 'Returned'].includes(item.status) ? 'opacity-20 grayscale' : 'opacity-90'}`} alt="" />
                                    </div>
                                    <div className="flex-1 w-full space-y-2">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="text-sm font-black uppercase italic text-white tracking-tight">{item.productId?.name}</h4>
                                                <p className="text-[8px] font-black text-white/30 uppercase mt-1">Size: {item.size} | Qty: {item.quantity}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-lg font-black italic ${['Cancelled', 'Returned'].includes(item.status) ? 'text-white/10 line-through' : 'text-white'}`}>₹{item.totalAmount?.toLocaleString()}</p>
                                                {itemCouponShare > 0 && !['Cancelled', 'Returned'].includes(item.status) && (
                                                    <p className="text-[8px] font-bold text-indigo-400 uppercase italic">- ₹{itemCouponShare.toFixed(2)} Promo share</p>
                                                )}
                                                {(['Cancelled', 'Returned'].includes(item.status)) && (
                                                    <div className={`flex items-center gap-1 text-[7px] font-black uppercase mt-1 px-1.5 py-0.5 rounded border ${isActualRefund ? "text-green-400 bg-green-400/10 border-green-400/20" : "text-white/40 bg-white/5 border-white/10"}`}>
                                                        {isActualRefund ? <><Wallet size={8} /> Refunded: ₹{netItemPrice.toFixed(2)}</> : <><XCircle size={8} /> Voided: ₹{netItemPrice.toFixed(2)}</>}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {['Return Requested', 'Return Approved', 'Returned', 'Return Rejected'].includes(item.status) && <div className="mt-4 mb-2"><ReturnTracker status={item.status} /></div>}
                                        <div className="flex items-center gap-4 mt-2">
                                            {!['Return Requested', 'Return Approved', 'Returned'].includes(item.status) && (
                                                <span className={`px-2 py-0.5 rounded text-[7px] font-black uppercase border tracking-widest ${getStatusTheme(item.status)}`}>{item.status?.replace(/_/g, ' ')}</span>
                                            )}
                                            {['pending', 'processing', 'confirmed'].includes(order.status.toLowerCase()) && item.status?.toLowerCase() === 'placed' && (
                                                <button onClick={() => openModal('cancel', item)} className="text-[7px] font-black uppercase text-red-500 hover:text-red-400 flex items-center gap-1 transition-all"><XCircle size={10} /> Cancel</button>
                                            )}
                                            {/* 🟢 Return button with 7-day logic */}
                                            {order.status.toLowerCase() === 'delivered' && item.status?.toLowerCase() === 'delivered' && (
                                                <button
                                                    onClick={() => openModal('return', item)}
                                                    className={`text-[7px] font-black uppercase flex items-center gap-1 transition-all ${isReturnExpired ? 'text-white/20 grayscale cursor-not-allowed' : 'text-amber-500 hover:text-amber-400'}`}
                                                >
                                                    <RotateCcw size={10} /> {isReturnExpired ? "Return Window Closed" : "Return"}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className={`${glassStyle} p-8`}>
                        <h2 className="text-[10px] font-black uppercase text-[#7a6af6] italic tracking-[0.3em] mb-6 flex items-center gap-2"><MapPin size={14} /> Destination</h2>
                        <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                            <p className="text-xs font-black text-white uppercase italic mb-1">{order.addressId?.fullName}</p>
                            <p className="text-[10px] text-white/60 font-medium uppercase leading-relaxed tracking-wider">{order.addressId?.addressLine}, {order.addressId?.city}, {order.addressId?.state} — {order.addressId?.pincode}</p>
                        </div>
                    </div>
                </div>

                <aside className="xl:col-span-4 space-y-6">
                    <div className="bg-white text-black p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none"><ShieldCheck size={160} /></div>
                        <h3 className="text-[10px] font-black uppercase text-black/30 mb-8 border-b border-black/5 pb-4 italic text-center tracking-[0.5em]">Settlement</h3>

                        <div className="space-y-4 text-[11px] font-bold uppercase tracking-tight relative z-10">
                            <div className="flex justify-between text-black/40">
                                <span>Subtotal</span>
                                <span className="text-black font-black">₹{financials.initialSubtotal.toFixed(2)}</span>
                            </div>


                            {financials.couponSavings > 0 ? (
                                <div className="flex justify-between text-[11px] font-black text-indigo-600 uppercase italic">
                                    <span className="flex items-center gap-1"><Tag size={10} /> Coupon ({order.couponCode})</span>
                                    <span>- ₹{financials.couponSavings.toFixed(2)}</span>
                                </div>
                            ) : order.couponExpired ? (
                                <div className="flex justify-between text-[10px] font-bold text-red-500 uppercase italic bg-red-50 p-2 rounded-lg border border-red-100 animate-pulse">
                                    <span className="flex items-center gap-1"><AlertTriangle size={10} /> Promo Expired</span>
                                    <span className="text-[8px] opacity-50">Standard Rate Applied</span>
                                </div>
                            ) : null}

                            <div className="flex justify-between text-black/40 border-b border-black/5 pb-6">
                                <span>Logistics</span>
                                <span className="text-black font-black">{financials.delivery > 0 ? `₹${financials.delivery.toFixed(2)}` : 'FREE'}</span>
                            </div>

                            {financials.totalRefunded > 0 && (
                                <div className={`flex justify-between text-[9px] font-black uppercase p-3 rounded-xl border shadow-sm ${isActualRefund ? "text-green-600 bg-green-50 border-green-100" : "text-red-500 bg-red-50 border-red-100"}`}>
                                    <span className="flex items-center gap-1.5"><ArrowDownLeft size={12} strokeWidth={3} /> {isActualRefund ? 'Refund Issued' : 'Cancelled Value'}</span>
                                    <span className="tracking-tighter">- ₹{financials.totalRefunded.toFixed(2)}</span>
                                </div>
                            )}

                            <div className="pt-6 mt-4 border-t border-black/5 flex flex-col items-end">
                                <span className="text-[10px] font-black uppercase italic text-[#7a6af6] tracking-[0.2em]">Final Settlement</span>
                                <span className="text-6xl font-black italic tracking-tighter leading-none mt-2 text-[#0F172A]">
                                    ₹{financials.net.toFixed(2)}
                                </span>
                            </div>
                        </div>

                        {order.status === 'payment_failed' && (
                            <button
                                onClick={handleRetryPayment}
                                disabled={isRetrying}
                                className="w-full mt-10 py-5 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-3 hover:bg-black transition-all shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isRetrying ? <Loader2 className="animate-spin" size={16} /> : <><RefreshCw size={16} /> Complete Payment</>}
                            </button>
                        )}
                        {order.status.toLowerCase() === 'delivered' && (
                            <button onClick={() => generateInvoice(order)} className="w-full mt-10 py-5 bg-black text-white rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-3 hover:bg-[#7a6af6] transition-all shadow-xl active:scale-95"><FileText size={16} /> Get Invoice</button>
                        )}
                    </div>

                    <div className={`${glassStyle} p-8 flex justify-between items-center`}>
                        <div className="flex flex-col gap-1">
                            <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1 italic">Protocol</p>
                            <p className="text-xs font-black uppercase italic text-white">{order.paymentMethod === 'cashOnDelivery' ? 'Cash' : order.paymentMethod === 'wallet' ? 'Wallet' : 'Razorpay'}</p>
                            <p className={`text-[8px] font-black uppercase mt-1 ${hasPaid ? 'text-green-500' : 'text-amber-500'}`}>{order.paymentStatus}</p>
                        </div>
                        <div className={`p-2 rounded-xl bg-white/5 border border-white/10 ${hasPaid ? 'text-green-500' : 'text-amber-500'}`}>
                            {order.paymentMethod === 'wallet' ? <Wallet size={20} /> : <ShieldCheck size={20} />}
                        </div>
                    </div>
                </aside>
            </div>

            <OrderActionModal config={actionModal} onClose={() => setActionModal({ ...actionModal, isOpen: false })} orderId={order._id} />
        </div>
    );
};

export default OrderDetailPage;