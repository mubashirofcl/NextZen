import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../hooks/user/useCart';
import { useAddress } from '../../hooks/user/useAddress';
import { useOrder } from '../../hooks/user/useOrder';
import { useWallet } from '../../hooks/user/useWallet';

import { updateAddress, createAddress } from '../../api/user/address.api'; 
import userAxios from '../../api/baseAxios';

import { useQueryClient, useQuery } from '@tanstack/react-query';
import {
    CheckCircle2, ArrowRight, Loader2, MapPin,
    CreditCard, ShieldCheck,
    Edit2, Wallet, Box, AlertCircle, Tag, X, Ticket, RefreshCw
} from 'lucide-react';
import Header from '../../components/user/Header';
import Footer from '../../components/user/Footer';
import { nxToast } from '../../utils/userToast';
import TOAST_MESSAGES from '../../utils/toastMessages';
import OrderConfirmModal from '../../components/user/OrderConfirmModal';
import AddressModal from '../../components/user/AddressModal';
import { loadRazorpayScript } from '../../utils/loadRazorpay';

const CheckoutPage = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { cart, isLoading: isCartLoading } = useCart();
    const { data: addressData, isLoading: isAddrLoading, refetch: refetchAddresses } = useAddress();
    const { placeOrder } = useOrder();
    const { data: wallet, isLoading: isWalletLoading } = useWallet();

    const [selectedAddress, setSelectedAddress] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('cashOnDelivery');
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
    const [addressToEdit, setAddressToEdit] = useState(null);
    const [frozenTotals, setFrozenTotals] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const [couponInput, setCouponInput] = useState("");
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [showCouponList, setShowCouponList] = useState(false);
    const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
    const [couponError, setCouponError] = useState("");

    const allItems = cart?.items || [];
    const brokenItems = allItems.filter(i => i.isCheckoutReady === false);
    const activeItems = allItems.filter(i => i.isCheckoutReady !== false);
    const hasInventoryConflict = brokenItems.length > 0;

    const { data: availableCoupons = [], isFetching: isSyncingCoupons } = useQuery({
        queryKey: ["available-coupons"],
        queryFn: async () => {
            const { data } = await userAxios.get("/users/coupons/available");
            return data.coupons || [];
        },
        refetchOnWindowFocus: true,
        staleTime: 1000 * 30,
    });

    useEffect(() => {
        const addresses = Array.isArray(addressData) ? addressData : [];

        if (addresses.length > 0) {
            if (!selectedAddress) {
                setSelectedAddress(addresses.find(a => a.isDefault) || addresses[0]);
            } else {
                const updatedVersion = addresses.find(a => a._id === selectedAddress._id);
                if (updatedVersion) {
                    setSelectedAddress(updatedVersion);
                }
            }
        }
    }, [addressData]);

    useEffect(() => {
        if (appliedCoupon && availableCoupons.length > 0) {
            const isStillValid = availableCoupons.some(c => c.code === appliedCoupon.code);
            if (!isStillValid) {
                setAppliedCoupon(null);
                nxToast.security(TOAST_MESSAGES.CHECKOUT.INVALID_COUPON.title, TOAST_MESSAGES.CHECKOUT.INVALID_COUPON.message);
            }
        }
    }, [availableCoupons, appliedCoupon]);

    const financials = useMemo(() => {
        if (!cart?.items) return { subtotal: 0, totalMRP: 0, deliveryCharge: 0, finalTotal: 0, totalDiscount: 0, couponDiscount: 0 };
        const subtotal = cart?.subtotal || 0;
        const totalMRP = cart?.totalMarketPrice || 0;
        const deliveryCharge = (subtotal > 0 && subtotal < 1999) ? 99 : 0;

        let couponDiscount = 0;
        if (appliedCoupon) {
            if (appliedCoupon.discountType === 'PERCENT') {
                couponDiscount = (subtotal * appliedCoupon.discountValue) / 100;
                if (appliedCoupon.maxDiscount && appliedCoupon.maxDiscount > 0) {
                    couponDiscount = Math.min(couponDiscount, appliedCoupon.maxDiscount);
                }
            } else {
                couponDiscount = appliedCoupon.discountValue;
            }
        }

        const finalTotal = Math.max(0, (subtotal + deliveryCharge) - couponDiscount);
        const totalDiscount = (totalMRP - subtotal) + couponDiscount;

        return { 
            subtotal, 
            totalMRP, 
            deliveryCharge, 
            finalTotal, 
            totalDiscount, 
            couponDiscount,
            subTotal: subtotal,
            totalAmount: finalTotal 
        };
    }, [cart, appliedCoupon]);

    const handleApplyCoupon = async (codeFromList = null) => {
        const targetCode = codeFromList || couponInput;
        setCouponError("");
        if (!targetCode.trim()) return setCouponError("Please enter a coupon code.");
        if (appliedCoupon) return setCouponError("Please remove the current coupon first.");

        try {
            setIsApplyingCoupon(true);
            const { data } = await userAxios.post("/users/coupons/validate", {
                code: targetCode.toUpperCase(),
                subtotal: financials.subtotal
            });
            if (data.success) {
                setAppliedCoupon(data.coupon);
                setCouponInput("");
                setShowCouponList(false);
                nxToast.success(TOAST_MESSAGES.CHECKOUT.COUPON_APPLIED.title, `${data.coupon.code} applied successfully!`);
            }
        } catch (err) {
            setCouponError(err.response?.data?.message || "Invalid or expired coupon code.");
        } finally {
            setIsApplyingCoupon(false);
        }
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setCouponInput("");
        setCouponError("");
        nxToast.success(TOAST_MESSAGES.CHECKOUT.COUPON_REMOVED.title, TOAST_MESSAGES.CHECKOUT.COUPON_REMOVED.message);
    };

    useEffect(() => {
        if (!isProcessing && !isCartLoading && (!cart?.items || cart.items.length === 0)) {
            navigate('/shop', { replace: true });
        }
    }, [cart, isCartLoading, navigate, isProcessing]);

    const clearCartUI = () => {
        queryClient.setQueryData(["cart"], { items: [], subtotal: 0, totalMarketPrice: 0 });
        queryClient.invalidateQueries({ queryKey: ["cart"] });
        queryClient.invalidateQueries({ queryKey: ["wallet"] });
    };

    const handleOnlinePayment = async (orderPayload) => {
        try {
            const isLoaded = await loadRazorpayScript();
            if (!isLoaded) return nxToast.security(TOAST_MESSAGES.SYSTEM.ACTION_FAILED.title, "Payment gateway offline");
            
            const { data } = await userAxios.post("/user/payment/create-order", {
                amount: financials.finalTotal,
                items: cart.items,
                totals: financials,
                orderId: `TMP_${Date.now()}`
            });
            if (!data.success) return nxToast.security(TOAST_MESSAGES.SYSTEM.ACTION_FAILED.title, "Payment initialization failed");

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: data.order.amount,
                currency: "INR",
                name: "NextZen Clothing",
                order_id: data.order.id,
                handler: async function (response) {
                    try {
                        const verifyRes = await userAxios.post("/user/payment/verify-payment", response);
                        if (verifyRes.data.success) {
                            setIsProcessing(true);
                            const finalRes = await placeOrder.mutateAsync({
                                ...orderPayload,
                                razorpayOrderId: data.order.id,
                                status: "pending",
                                paymentInfo: { id: response.razorpay_payment_id, status: "Paid", method: "razorpay" }
                            });
                            clearCartUI();
                            navigate(`/checkout/success/${finalRes.orderId}`, { replace: true });
                        }
                    } catch (err) {
                        nxToast.security(TOAST_MESSAGES.SYSTEM.ACTION_FAILED.title, "Payment synchronization error");
                        setIsProcessing(false);
                    }
                },
                modal: {
                    ondismiss: async function () {
                        try {
                            setIsProcessing(true);
                            const failRes = await placeOrder.mutateAsync({
                                ...orderPayload,
                                razorpayOrderId: data.order.id,
                                status: "payment_failed"
                            });
                            clearCartUI();
                            navigate(`/payment-failed/${failRes.orderId}`, { replace: true });
                        } catch (err) {
                            setIsProcessing(false);
                        }
                    }
                },
                theme: { color: "#0F172A" }
            };
            new window.Razorpay(options).open();
        } catch (error) {
            nxToast.security(TOAST_MESSAGES.SYSTEM.SERVER_ERROR.title, TOAST_MESSAGES.SYSTEM.SERVER_ERROR.message);
            setIsProcessing(false);
        }
    };

    const handleConfirmRequest = () => {
        if (hasInventoryConflict) return nxToast.security(TOAST_MESSAGES.PRODUCT.OUT_OF_STOCK.title, "Item availability conflict detected");
        if (!selectedAddress) return nxToast.security(TOAST_MESSAGES.SYSTEM.ACTION_FAILED.title, "Please select a delivery address");
        if (paymentMethod === 'wallet' && (wallet?.balance || 0) < financials.finalTotal) {
            return nxToast.security(TOAST_MESSAGES.SYSTEM.ACTION_FAILED.title, "Insufficient wallet balance");
        }
        setFrozenTotals({ ...financials });
        setIsConfirmModalOpen(true);
    };

    const handleFinalOrderPlacement = () => {
        if (activeItems.length === 0) return;
        setIsConfirmModalOpen(false);
        const orderPayload = {
            addressId: selectedAddress._id,
            items: activeItems.map(item => ({
                productId: item.productId._id,
                variantId: item.variantId._id,
                size: item.size,
                quantity: item.quantity,
                price: item.currentPrice,
                totalAmount: item.currentPrice * item.quantity
            })),
            paymentMethod,
            totals: frozenTotals, 
            couponCode: appliedCoupon?.code || null
        };

        if (paymentMethod === 'razorpay') handleOnlinePayment(orderPayload);
        else {
            setIsProcessing(true);
            placeOrder.mutate(orderPayload, {
                onSuccess: (data) => {
                    clearCartUI();
                    navigate(`/checkout/success/${data.orderId}`, { replace: true });
                }
            });
        }
    };

    // 🟢 New function to open modal for Adding
    const handleAddNewAddress = () => {
        setAddressToEdit(null);
        setIsAddressModalOpen(true);
    };

    const handleEditAddress = (e, addr) => {
        e.stopPropagation();
        setAddressToEdit(addr);
        setIsAddressModalOpen(true);
    };

    const handleAddressMutation = async (data) => {
        try {
            setIsProcessing(true);
            if (addressToEdit) {
                await updateAddress(addressToEdit._id, data);
                nxToast.success(TOAST_MESSAGES.PROFILE.ADDRESS_UPDATED.title, TOAST_MESSAGES.PROFILE.ADDRESS_UPDATED.message);
            } else {

                await createAddress(data);
                nxToast.success(TOAST_MESSAGES.PROFILE.ADDRESS_ADDED.title, TOAST_MESSAGES.PROFILE.ADDRESS_ADDED.message);
            }

            await queryClient.invalidateQueries({ queryKey: ["addresses"] });
            await refetchAddresses();

            setIsAddressModalOpen(false);
            setAddressToEdit(null);
        } catch (err) {
            nxToast.security(TOAST_MESSAGES.SYSTEM.ACTION_FAILED.title, err.response?.data?.message || "Failed to save address");
        } finally {
            setIsProcessing(false);
        }
    };

    const glassStyle = "bg-white/[0.03] backdrop-blur-3xl border border-white/10 shadow-2xl rounded-[2rem]";

    if (isCartLoading || isAddrLoading || isWalletLoading) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-[#7a6af6]" size={32} /></div>;

    return (
        <div className="min-h-screen text-white flex flex-col font-sans selection:bg-[#7a6af6]/30">
            <Header />
            <main className="max-w-[1440px] mx-auto px-6 md:px-10 pt-32 pb-32 w-full">
                <div className="flex justify-between items-end mb-12 border-b border-white/5 pb-8">
                    <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#7a6af6] italic">Checkout // Stage 03</p>
                        <h1 className="text-5xl font-black uppercase tracking-tighter italic text-white">Review <span className="text-white/20">Order</span></h1>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 items-start max-w-[1200px] mx-auto w-full">
                    <div className="w-full lg:flex-1 space-y-8">
                        {hasInventoryConflict && (
                            <section className="bg-red-500/10 border border-red-500/20 p-6 rounded-3xl flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <AlertCircle className="text-red-500" size={24} />
                                    <div>
                                        <p className="text-xs font-black uppercase text-red-500 tracking-widest">Stock Issue</p>
                                        <p className="text-[10px] text-white/40 font-bold uppercase italic">Some items in your cart are no longer available.</p>
                                    </div>
                                </div>
                                <button onClick={() => navigate('/cart')} className="px-6 py-2 bg-red-500/20 text-red-500 rounded-xl text-[10px] font-black uppercase">Fix Cart</button>
                            </section>
                        )}

                        <section className={`${glassStyle} p-10 ${hasInventoryConflict ? 'opacity-30 pointer-events-none' : ''}`}>
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-[9px] font-black uppercase text-[#7a6af6] italic tracking-[0.4em] flex items-center gap-2"><MapPin size={14} /> 01 // Shipping Address</h2>
                                <div className="flex gap-2">
                                    {/* 🟢 Direct Modal Trigger for adding address */}
                                    <button 
                                        onClick={handleAddNewAddress} 
                                        className="text-[8px] font-black uppercase px-5 py-2 rounded-xl border border-[#7a6af6]/30 bg-[#7a6af6]/10 text-[#7a6af6] hover:bg-[#7a6af6] hover:text-white transition-all"
                                    >
                                        + Add New
                                    </button>
                                    <button 
                                        onClick={() => navigate('/profile/address')} 
                                        className="text-[8px] font-black uppercase px-5 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-white/40"
                                    >
                                        Manage
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {addressData?.map((addr) => (
                                    <div
                                        key={`${addr._id}-${addr.updatedAt}`}
                                        onClick={() => setSelectedAddress(addr)}
                                        className={`group relative p-6 rounded-3xl border transition-all duration-500 cursor-pointer ${selectedAddress?._id === addr._id ? 'bg-white/[0.08] border-[#7a6af6]' : 'bg-white/[0.02] border-white/5'}`}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <span className={`px-2.5 py-0.5 rounded-lg text-[7px] font-black uppercase ${selectedAddress?._id === addr._id ? 'bg-[#7a6af6]' : 'bg-white/5 text-white/40'}`}>{addr.addressType}</span>
                                            <div className="flex items-center gap-2">
                                                <button onClick={(e) => handleEditAddress(e, addr)} className="p-1.5 text-white/20 hover:text-white transition-all"><Edit2 size={14} /></button>
                                                {selectedAddress?._id === addr._id && <CheckCircle2 size={18} className="text-[#7a6af6]" />}
                                            </div>
                                        </div>
                                        <h3 className="text-sm font-black uppercase italic text-white">{addr.fullName}</h3>
                                        <p className="text-[10px] text-white/30 uppercase mt-1 leading-relaxed">{addr.addressLine}, {addr.city}</p>
                                    </div>
                                ))}
                                {addressData?.length === 0 && (
                                     <div 
                                        onClick={handleAddNewAddress}
                                        className="border-2 border-dashed border-white/5 rounded-3xl p-8 flex flex-col items-center justify-center gap-3 hover:border-[#7a6af6]/50 cursor-pointer transition-all group"
                                     >
                                        <MapPin className="text-white/10 group-hover:text-[#7a6af6]" size={24} />
                                        <p className="text-[9px] font-black uppercase tracking-widest text-white/20 group-hover:text-white">No address found. Click to add.</p>
                                     </div>
                                )}
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-[9px] font-black uppercase text-[#7a6af6] italic tracking-[0.4em] px-2 flex items-center gap-2"><Box size={14} /> 02 // Order Summary</h2>
                            <div className="space-y-3">
                                {allItems.map((item) => (
                                    <div key={item._id} className={`${glassStyle} p-5 flex items-center gap-6 relative overflow-hidden ${item.isCheckoutReady === false ? 'border-red-500/20' : ''}`}>
                                        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-black border border-white/5">
                                            <img src={item.variantId?.images?.[0]} className="w-full h-full object-cover" alt="" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-xs font-black italic uppercase text-white">{item.productId?.name}</h3>
                                            <p className="text-[9px] text-white/20 font-bold mt-1 uppercase">Size: {item.size} // Qty: {item.quantity}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xl font-black italic text-white tracking-tighter">₹{(item.currentPrice * item.quantity).toLocaleString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className={`${glassStyle} p-10 ${hasInventoryConflict ? 'opacity-30 pointer-events-none grayscale' : ''}`}>
                            <h2 className="text-[9px] font-black uppercase text-[#7a6af6] italic tracking-[0.4em] mb-10 flex items-center gap-2"><CreditCard size={14} /> 03 // Payment Method</h2>
                            <div className="space-y-4">
                                <div onClick={() => setPaymentMethod('razorpay')} className={`p-6 rounded-[2rem] border cursor-pointer flex items-center gap-5 transition-all ${paymentMethod === 'razorpay' ? 'border-[#3395FF] bg-[#3395FF]/[0.08]' : 'bg-white/[0.02] border-white/5'}`}>
                                    <div className="flex-1 flex items-center gap-4"><p className="text-sm font-black uppercase italic text-white">Online Payment</p><span className="bg-[#3395FF]/20 text-[#3395FF] text-[7px] font-black px-2 py-0.5 rounded border border-[#3395FF]/20">SECURE</span></div>
                                    <img src="https://nextzen-assets.s3.ap-south-1.amazonaws.com/images/Razorpay_logo.png" className="h-4" alt="" />
                                </div>
                                <div onClick={() => setPaymentMethod('wallet')} className={`p-6 rounded-[2rem] border cursor-pointer flex items-center gap-5 transition-all ${paymentMethod === 'wallet' ? 'border-[#7a6af6] bg-[#7a6af6]/[0.08]' : 'bg-white/[0.02] border-white/5'}`}>
                                    <div className="flex-1"><p className="text-sm font-black uppercase italic text-white">My Wallet</p><p className="text-[9px] text-white/30 font-bold mt-1 uppercase tracking-widest">Available Balance: <span className={(wallet?.balance || 0) >= financials.finalTotal ? 'text-green-400' : 'text-red-500/50'}>₹{wallet?.balance?.toLocaleString()}</span></p></div>
                                    <Wallet className={paymentMethod === 'wallet' ? 'text-[#7a6af6]' : 'text-white/10'} />
                                </div>
                                <div onClick={() => setPaymentMethod('cashOnDelivery')} className={`p-6 rounded-[2rem] border cursor-pointer flex items-center gap-5 transition-all ${paymentMethod === 'cashOnDelivery' ? 'border-white/40 bg-white/[0.08]' : 'bg-white/[0.02] border-white/5'}`}>
                                    <p className="flex-1 text-sm font-black uppercase italic text-white">Cash on Delivery</p>
                                    <Box className="text-white/10" />
                                </div>
                            </div>
                        </section>
                    </div>

                    <aside className="w-full lg:w-[320px] lg:sticky lg:top-32 space-y-6">
                        <div className="bg-white text-black p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-[0.04] pointer-events-none"><ShieldCheck size={160} /></div>
                            <h3 className="text-[10px] font-black uppercase text-black/30 mb-8 border-b border-black/5 pb-4 italic text-center tracking-[0.5em]">Payment Summary</h3>

                            <div className="space-y-4 mb-8 relative z-10">
                                <div className="flex justify-between text-[11px] font-black text-black/40 uppercase"><span>Items Subtotal</span><span className="text-black">₹{financials.subtotal.toLocaleString()}</span></div>
                                {appliedCoupon && (
                                    <div className="flex justify-between text-[11px] font-black text-indigo-600 uppercase italic">
                                        <span className="flex items-center gap-1"><Tag size={10} /> {appliedCoupon.code}</span>
                                        <span>- ₹{financials.couponDiscount.toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-[11px] font-black text-black/40 border-b border-black/5 pb-6 uppercase"><span>Delivery Fee</span><span>{financials.deliveryCharge > 0 ? `₹${financials.deliveryCharge}` : 'FREE'}</span></div>
                                <div className="pt-2 flex justify-between items-center text-lg font-black italic">
                                    <span className="text-black/30 text-[9px] font-black uppercase">Grand Total</span>
                                    <span className="text-4xl tracking-tighter text-[#000] leading-none font-black">₹{financials.finalTotal.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="mb-8 p-4 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200 relative">
                                {isSyncingCoupons && <RefreshCw size={8} className="absolute top-2 right-2 animate-spin text-zinc-300" />}
                                <div className="flex justify-between items-center mb-3">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1"><Ticket size={12} /> Available Offers</p>
                                    <button onClick={() => setShowCouponList(!showCouponList)} className="text-[8px] font-black text-[#7a6af6] underline uppercase">{showCouponList ? "Close" : "View All"}</button>
                                </div>

                                {showCouponList && (
                                    <div className="mb-4 space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                                        {availableCoupons.length > 0 ? availableCoupons.map(cpn => (
                                            <div key={cpn.code} onClick={() => handleApplyCoupon(cpn.code)} className="p-2 bg-white border border-zinc-100 rounded-xl cursor-pointer hover:border-[#7a6af6] transition-all">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] font-black text-[#7a6af6]">{cpn.code}</span>
                                                    <span className="text-[8px] font-bold text-green-600">{cpn.discountValue}{cpn.discountType === 'PERCENT' ? '%' : ' OFF'}</span>
                                                </div>
                                                <p className="text-[7px] text-zinc-400 uppercase mt-1">Min Order: ₹{cpn.minPurchaseAmt}</p>
                                            </div>
                                        )) : <p className="text-[8px] text-center text-zinc-400 uppercase italic">No active coupons available</p>}
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <input value={couponInput} onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(""); }} placeholder="COUPON CODE" className="flex-1 bg-white border border-zinc-200 rounded-xl px-3 py-2 text-[10px] font-bold outline-none focus:border-[#7a6af6] transition-all" />
                                    <button onClick={() => handleApplyCoupon()} disabled={isApplyingCoupon || appliedCoupon} className="bg-black text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase hover:bg-[#7a6af6] disabled:opacity-30 transition-all shadow-md active:scale-95">
                                        {isApplyingCoupon ? <Loader2 className="animate-spin" size={12} /> : 'Apply'}
                                    </button>
                                </div>
                                {couponError && <p className="text-[9px] font-bold text-red-500 mt-2 flex items-start gap-1 leading-tight animate-in fade-in"><AlertCircle size={12} className="shrink-0" /> {couponError}</p>}
                                {appliedCoupon && (
                                    <div className="mt-3 flex justify-between items-center bg-indigo-50 p-2.5 rounded-lg border border-indigo-100 animate-in fade-in slide-in-from-top-1">
                                        <span className="text-[8px] font-black text-indigo-600 uppercase italic tracking-tighter">Applied: {appliedCoupon.code}</span>
                                        <button onClick={handleRemoveCoupon} className="text-indigo-600 hover:text-red-500 transition-colors"><X size={14} /></button>
                                    </div>
                                )}
                            </div>

                            <button onClick={handleConfirmRequest} disabled={isProcessing} className="w-full py-6 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.5em] flex items-center justify-center gap-3 transition-all bg-[#0F172A] text-white hover:bg-[#7a6af6] disabled:opacity-30 active:scale-95 shadow-xl">
                                {isProcessing ? <Loader2 className="animate-spin" size={18} /> : <>Place Your Order <ArrowRight size={18} /></>}
                            </button>
                        </div>
                    </aside>
                </div>
            </main>
            <OrderConfirmModal couponCode={appliedCoupon?.code} isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} onConfirm={handleFinalOrderPlacement} isPending={placeOrder.isPending} totals={frozenTotals} inventoryConflict={hasInventoryConflict} paymentMethod={paymentMethod} />
            
            {/* 🟢 Modal handles both 'add' and 'edit' now */}
            {isAddressModalOpen && (
                <AddressModal 
                    isOpen={isAddressModalOpen} 
                    onClose={() => {
                        setIsAddressModalOpen(false);
                        setAddressToEdit(null);
                    }} 
                    mode={addressToEdit ? "edit" : "add"} 
                    initialData={addressToEdit} 
                    onSubmit={handleAddressMutation} 
                />
            )}
            <Footer />
        </div>
    );
};

export default CheckoutPage;