import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../hooks/user/useCart';
import { useAddress } from '../../hooks/user/useAddress';
import { useOrder } from '../../hooks/user/useOrder';
import { useWallet } from '../../hooks/user/useWallet';
import { updateAddress } from '../../api/user/address.api';
import userAxios from '../../api/baseAxios';
import { useQueryClient } from '@tanstack/react-query';
import {
    CheckCircle2, ArrowRight, Loader2, MapPin,
    CreditCard, Plus, ShieldCheck, ShoppingCart,
    Edit2, Wallet, Box, AlertCircle
} from 'lucide-react';
import Header from '../../components/user/Header';
import Footer from '../../components/user/Footer';
import { nxToast } from '../../utils/userToast';
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

    const allItems = cart?.items || [];
    const brokenItems = allItems.filter(i => i.isCheckoutReady === false);
    const activeItems = allItems.filter(i => i.isCheckoutReady !== false);
    const hasInventoryConflict = brokenItems.length > 0;

    // 🟢 UPDATED FINANCIALS: Removed all Tax logic
    const getFinancials = () => {
        if (!cart?.items) return { subtotal: 0, totalMRP: 0, deliveryCharge: 0, finalTotal: 0, totalDiscount: 0 };

        // Subtotal of only checkout-ready items
        const subtotal = cart?.subtotal || 0;
        const totalMRP = cart?.totalMarketPrice || 0;

        // Shipping Logic
        const deliveryCharge = (subtotal > 0 && subtotal < 1999) ? 99 : 0;

        // Final Total is now simple: Subtotal + Delivery
        // (Savings are already reflected in the subtotal via item.currentPrice)
        const finalTotal = subtotal + deliveryCharge;
        const totalDiscount = totalMRP - subtotal;

        return { subtotal, totalMRP, deliveryCharge, finalTotal, totalDiscount };
    };

    const financials = getFinancials();

    useEffect(() => {
        if (!isProcessing && !isCartLoading && (!cart?.items || cart.items.length === 0)) {
            navigate('/shop', { replace: true });
        }
    }, [cart, isCartLoading, navigate, isProcessing]);

    useEffect(() => {
        const addresses = Array.isArray(addressData) ? addressData : [];
        if (addresses.length > 0 && !selectedAddress) {
            setSelectedAddress(addresses.find(a => a.isDefault) || addresses[0]);
        }
    }, [addressData, selectedAddress]);

    const clearCartUI = () => {
        queryClient.setQueryData(["cart"], { items: [], subtotal: 0, totalMarketPrice: 0 });
        queryClient.invalidateQueries({ queryKey: ["cart"] });
        queryClient.invalidateQueries({ queryKey: ["wallet"] });
    };

    const handleOnlinePayment = async (orderPayload) => {
        try {
            const isLoaded = await loadRazorpayScript();
            if (!isLoaded) return nxToast.security("Payment gateway is offline");

            // Create Order with simplified amount
            const { data } = await userAxios.post("/user/payment/create-order", {
                amount: financials.finalTotal,
                items: cart.items, // Sending items for backend verification
                totals: financials
            });

            if (!data.success) return nxToast.security("Payment initialization failed");

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: data.order.amount,
                currency: "INR",
                name: "Next Zen Store",
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
                    } catch (err) { nxToast.security("Payment sync error"); }
                },
                modal: {
                    ondismiss: async function () {
                        setIsProcessing(true);
                        const failRes = await placeOrder.mutateAsync({ ...orderPayload, razorpayOrderId: data.order.id, status: 'payment_failed' });
                        clearCartUI();
                        navigate("/payment-failed", {
                            state: {
                                razorpayOrderId: data.order.id,
                                orderPayload: { ...orderPayload, _id: failRes.orderId },
                                totalAmount: financials.finalTotal
                            },
                            replace: true
                        });
                    }
                },
                theme: { color: "#3395FF" }
            };
            new window.Razorpay(options).open();
        } catch (error) {
            console.error(error);
            nxToast.security("Payment system error.");
        }
    };

    const handleConfirmRequest = () => {
        if (hasInventoryConflict) return nxToast.security("Please update your cart items");
        if (!selectedAddress) return nxToast.security("Please select a delivery address");

        if (paymentMethod === 'wallet' && (wallet?.balance || 0) < financials.finalTotal) {
            return nxToast.security("Insufficient wallet balance");
        }

        setFrozenTotals({
            subtotal: financials.subtotal,
            deliveryCharge: financials.deliveryCharge,
            totalAmount: financials.finalTotal,
            totalDiscount: financials.totalDiscount
        });
        setIsConfirmModalOpen(true);
    };

    const handleFinalOrderPlacement = () => {
        const liveActiveItems = cart?.items?.filter(i => i.isCheckoutReady !== false) || [];
        if (liveActiveItems.length === 0) return;

        setIsConfirmModalOpen(false);

        const orderPayload = {
            addressId: selectedAddress._id,
            items: liveActiveItems.map(item => ({
                productId: item.productId._id,
                variantId: item.variantId._id,
                size: item.size,
                quantity: item.quantity,
                price: item.currentPrice,
                originalPrice: item.marketPrice,
                totalAmount: item.currentPrice * item.quantity // Pure price * qty
            })),
            paymentMethod,
            totals: {
                subtotal: financials.subtotal,
                totalDiscount: financials.totalDiscount,
                deliveryCharge: financials.deliveryCharge,
                totalAmount: financials.finalTotal
            }
        };

        if (paymentMethod === 'razorpay') {
            handleOnlinePayment(orderPayload);
        } else {
            setIsProcessing(true);
            placeOrder.mutate(orderPayload, {
                onSuccess: (data) => {
                    clearCartUI();
                    navigate(`/checkout/success/${data.orderId}`, { replace: true });
                }
            });
        }
    };

    const handleEditAddress = (e, addr) => {
        e.stopPropagation();
        setAddressToEdit(addr);
        setIsAddressModalOpen(true);
    };

    const handleAddressMutation = async (data) => {
        await updateAddress(addressToEdit._id, data);
        await refetchAddresses();
        setIsAddressModalOpen(false);
        setAddressToEdit(null);
    };

    const glassStyle = "bg-white/[0.03] backdrop-blur-3xl border border-white/10 shadow-2xl rounded-[2rem]";

    if (isCartLoading || isAddrLoading || isWalletLoading) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-[#7a6af6]" size={32} /></div>;

    return (
        <div className="min-h-screen text-white flex flex-col font-sans">
            <Header />
            <main className="max-w-[1440px] mx-auto px-6 md:px-10 pt-32 pb-32 w-full">

                <div className="flex justify-between items-end mb-12 border-b border-white/5 pb-8">
                    <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#7a6af6] italic">Final Step // Checkout</p>
                        <h1 className="text-5xl font-black uppercase tracking-tighter italic">Order <span className="text-white/20">Review</span></h1>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 items-start max-w-[1200px] mx-auto w-full">
                    <div className="w-full lg:flex-1 space-y-8">

                        {hasInventoryConflict && (
                            <section className="bg-red-500/10 border border-red-500/20 p-6 rounded-3xl flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <AlertCircle className="text-red-500" size={24} />
                                    <div>
                                        <p className="text-xs font-black uppercase text-red-500 tracking-widest">Stock Update</p>
                                        <p className="text-[10px] text-white/40 font-bold uppercase italic">Some items are no longer available.</p>
                                    </div>
                                </div>
                                <button onClick={() => navigate('/cart')} className="px-6 py-2 bg-red-500/20 text-red-500 border border-red-500/30 rounded-xl text-[10px] font-black uppercase hover:bg-red-500 hover:text-white transition-all">Go to Cart</button>
                            </section>
                        )}

                        {/* 01 // DELIVERY ADDRESS */}
                        <section className={`${glassStyle} p-10 ${hasInventoryConflict ? 'opacity-30 pointer-events-none' : ''}`}>
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-[9px] font-black uppercase text-[#7a6af6] italic tracking-[0.4em] flex items-center gap-2"><MapPin size={14} /> 01 // Delivery Address</h2>
                                <button onClick={() => navigate('/profile/address')} className="text-[8px] font-black uppercase px-5 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-[#7a6af6] transition-all tracking-widest"><Plus size={10} className="inline mr-1" /> Add New</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {addressData?.map((addr) => (
                                    <div key={addr._id} onClick={() => setSelectedAddress(addr)} className={`group relative p-6 rounded-3xl border transition-all duration-500 cursor-pointer ${selectedAddress?._id === addr._id ? 'bg-white/[0.08] border-[#7a6af6] shadow-[0_0_30px_rgba(122,106,246,0.1)]' : 'bg-white/[0.02] border-white/5 hover:border-white/20'}`}>
                                        <div className="flex justify-between items-start mb-4">
                                            <span className={`px-2.5 py-0.5 rounded-lg text-[7px] font-black uppercase ${selectedAddress?._id === addr._id ? 'bg-[#7a6af6] text-white' : 'bg-white/5 text-white/40'}`}>{addr.addressType}</span>
                                            <div className="flex items-center gap-2">
                                                <button onClick={(e) => handleEditAddress(e, addr)} className="p-1.5 text-white/20 hover:text-white transition-all"><Edit2 size={14} /></button>
                                                {selectedAddress?._id === addr._id && <CheckCircle2 size={18} className="text-[#7a6af6]" />}
                                            </div>
                                        </div>
                                        <h3 className="text-sm font-black uppercase italic text-white mb-1">{addr.fullName}</h3>
                                        <p className="text-[10px] text-white/30 uppercase tracking-widest leading-relaxed">{addr.addressLine}, {addr.city}<br />{addr.state} — {addr.pincode}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* 02 // YOUR SELECTION */}
                        <section className="space-y-4">
                            <h2 className="text-[9px] font-black uppercase text-[#7a6af6] italic tracking-[0.4em] px-2 flex items-center gap-2"><Box size={14} /> 02 // Your Selection</h2>
                            <div className="space-y-3">
                                {allItems.map((item) => (
                                    <div key={item._id} className={`${glassStyle} p-5 flex items-center gap-6 relative overflow-hidden ${item.isCheckoutReady === false ? 'border-red-500/20' : 'hover:bg-white/[0.01]'}`}>
                                        {item.isCheckoutReady === false && <div className="absolute inset-0 bg-red-950/40 backdrop-blur-sm flex items-center justify-center z-10"><span className="bg-red-600 text-white text-[8px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">Out of Stock</span></div>}
                                        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-black border border-white/5 shrink-0"><img src={item.variantId?.images?.[0]} className="w-full h-full object-cover opacity-80" alt="" /></div>
                                        <div className="flex-1">
                                            <h3 className="text-xs font-black italic uppercase text-white">{item.productId?.name}</h3>
                                            <p className="text-[9px] text-white/20 font-bold mt-1 uppercase tracking-widest">Size: {item.size} <span className="mx-2 text-white/5">//</span> Qty: {item.quantity}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xl font-black italic text-white tracking-tighter">₹{(item.currentPrice * item.quantity).toLocaleString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* 03 // PAYMENT METHOD */}
                        <section className={`${glassStyle} p-10 ${hasInventoryConflict ? 'opacity-30 pointer-events-none grayscale' : ''}`}>
                            <h2 className="text-[9px] font-black uppercase text-[#7a6af6] italic tracking-[0.4em] mb-10 flex items-center gap-2"><CreditCard size={14} /> 03 // Payment Method</h2>
                            <div className="space-y-4">
                                <div onClick={() => setPaymentMethod('razorpay')} className={`p-6 rounded-[2rem] border cursor-pointer flex items-center gap-5 transition-all duration-500 ${paymentMethod === 'razorpay' ? 'border-[#3395FF] bg-[#3395FF]/[0.08] shadow-[0_0_40px_rgba(51,149,255,0.1)]' : 'bg-white/[0.02] border-white/5 hover:border-white/10'}`}>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${paymentMethod === 'razorpay' ? 'border-[#3395FF]' : 'border-white/10'}`}>
                                        {paymentMethod === 'razorpay' && <div className="w-2.5 h-2.5 rounded-full bg-[#3395FF]" />}
                                    </div>
                                    <div className="flex-1 flex items-center gap-4">
                                        <p className="text-sm font-black uppercase italic text-white tracking-tighter mt-0.5">Pay Online with Razorpay</p>
                                        <span className={`bg-[#3395FF]/20 text-[#3395FF] text-[7px] font-black px-2 py-0.5 rounded border border-[#3395FF]/20 tracking-widest`}>SECURE</span>
                                    </div>
                                    <img src="../../public/Razorpay_logo.png" alt="Razorpay" className={`h-4 transition-all duration-700 ${paymentMethod === 'razorpay' ? 'grayscale-0' : 'grayscale invert brightness-200 opacity-10'}`} />
                                </div>

                                <div onClick={() => setPaymentMethod('wallet')} className={`p-6 rounded-[2rem] border cursor-pointer flex items-center gap-5 transition-all duration-500 ${paymentMethod === 'wallet' ? 'border-[#7a6af6] bg-[#7a6af6]/[0.08] shadow-[0_0_40px_rgba(122,106,246,0.15)]' : 'bg-white/[0.02] border-white/5 hover:border-white/10'}`}>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${paymentMethod === 'wallet' ? 'border-[#7a6af6]' : 'border-white/10'}`}>
                                        {paymentMethod === 'wallet' && <div className="w-2.5 h-2.5 rounded-full bg-[#7a6af6]" />}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-black uppercase italic text-white tracking-tighter">Use Digital Wallet Balance</p>
                                        <p className="text-[9px] text-white/30 font-bold uppercase mt-1 italic tracking-widest">Available: <span className={(wallet?.balance || 0) >= financials.finalTotal ? 'text-green-400' : 'text-red-500/50'}>₹{wallet?.balance?.toLocaleString()}</span></p>
                                    </div>
                                    <Wallet className={paymentMethod === 'wallet' ? 'text-[#7a6af6]' : 'text-white/10'} size={24} />
                                </div>

                                <div onClick={() => setPaymentMethod('cashOnDelivery')} className={`p-6 rounded-[2rem] border cursor-pointer flex items-center gap-5 transition-all duration-500 ${paymentMethod === 'cashOnDelivery' ? 'border-white/40 bg-white/[0.08]' : 'bg-white/[0.02] border-white/5 hover:border-white/10'}`}>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${paymentMethod === 'cashOnDelivery' ? 'border-white' : 'border-white/10'}`}>
                                        {paymentMethod === 'cashOnDelivery' && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                                    </div>
                                    <p className="flex-1 text-sm font-black uppercase italic text-white tracking-tighter">Cash on Delivery</p>
                                    <Box className="text-white/10" size={24} />
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* SETTLEMENT SIDEBAR */}
                    <aside className="w-full lg:w-[320px] lg:sticky lg:top-32">
                        <div className="bg-white text-black p-8 rounded-[2.5rem] shadow-2xl overflow-hidden relative group">
                            <div className="absolute top-0 right-0 p-4 opacity-[0.04] transition-opacity pointer-events-none"><ShieldCheck size={160} /></div>

                            <h3 className="text-[10px] font-black uppercase text-black/30 mb-8 border-b border-black/5 pb-4 italic text-center tracking-[0.5em]">Payment Summary</h3>

                            <div className="space-y-4 mb-10 relative z-10">
                                <div className="flex justify-between text-[11px] font-black text-black/40 uppercase tracking-widest"><span>Item Total</span><span className="text-black font-black">₹{financials.subtotal.toLocaleString()}</span></div>
                                {financials.totalDiscount > 0 && <div className="flex justify-between text-[11px] font-black text-green-600 uppercase tracking-widest"><span>Your Savings</span><span>- ₹{financials.totalDiscount.toLocaleString()}</span></div>}

                                {/* 🔴 TAX ROW REMOVED COMPLETELY */}

                                <div className="flex justify-between text-[11px] font-black text-black/40 border-b border-black/5 pb-6 uppercase tracking-widest"><span>Shipping Fee</span><span className="text-black font-black">{financials.deliveryCharge > 0 ? `₹${financials.deliveryCharge}` : 'FREE'}</span></div>

                                <div className="pt-2 flex justify-between items-center text-lg font-black italic">
                                    <span className="text-black/30 text-[9px] font-black uppercase tracking-[0.3em]">Total Amount</span>
                                    <span className="text-4xl tracking-tighter text-[#000] leading-none font-black">₹{financials.finalTotal.toLocaleString()}</span>
                                </div>
                            </div>

                            <button
                                onClick={handleConfirmRequest}
                                disabled={placeOrder.isPending || isProcessing}
                                className={`group w-full py-6 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.5em] flex items-center justify-center gap-3 transition-all duration-500 active:scale-95 shadow-xl ${paymentMethod === 'razorpay'
                                    ? 'bg-[#7a6af6] text-white shadow-[#3395FF]/20'
                                    : 'bg-[#0F172A] text-white hover:bg-[#7a6af6]'
                                    } disabled:opacity-30`}
                            >
                                {placeOrder.isPending || isProcessing ? (
                                    <Loader2 className="animate-spin" size={18} />
                                ) : (
                                    <>Review Order <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
                                )}
                            </button>
                        </div>
                    </aside>
                </div>
            </main>

            <OrderConfirmModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleFinalOrderPlacement}
                isPending={placeOrder.isPending}
                totals={frozenTotals}
                inventoryConflict={hasInventoryConflict}
                paymentMethod={paymentMethod}
            />
            {isAddressModalOpen && (
                <AddressModal
                    isOpen={isAddressModalOpen}
                    onClose={() => setIsAddressModalOpen(false)}
                    mode="edit"
                    initialData={addressToEdit}
                    onSubmit={handleAddressMutation}
                />
            )}
            <Footer />
        </div>
    );
};

export default CheckoutPage;