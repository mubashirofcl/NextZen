import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../hooks/user/useCart';
import { useAddress } from '../../hooks/user/useAddress';
import { useOrder } from '../../hooks/user/useOrder';
import { updateAddress } from '../../api/user/address.api';
import userAxios from '../../api/baseAxios';
import { useQueryClient } from '@tanstack/react-query'; 
import {
    CheckCircle2, ArrowRight, Loader2, MapPin,
    CreditCard, Plus, ShieldCheck, RefreshCw, AlertCircle, ShoppingCart,
    Edit2, Wallet, Box
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

    const [selectedAddress, setSelectedAddress] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('cashOnDelivery');
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
    const [addressToEdit, setAddressToEdit] = useState(null);
    const [frozenTotals, setFrozenTotals] = useState(null);
    
    // 🟢 LOCK: Prevents the cart-empty useEffect from redirecting to /shop during success
    const [isProcessing, setIsProcessing] = useState(false);

    const allItems = cart?.items || [];
    const brokenItems = allItems.filter(i => i.isCheckoutReady === false);
    const activeItems = allItems.filter(i => i.isCheckoutReady !== false);
    const hasInventoryConflict = brokenItems.length > 0;

    useEffect(() => {
        // 🟢 Only redirect if NOT currently processing an order
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

    const subtotal = cart?.subtotal || 0;
    const totalMRP = cart?.totalMarketPrice || 0;
    const deliveryCharge = (subtotal > 0 && subtotal < 1999) ? 99 : 0;
    const taxRate = 0.18;
    const tax = Math.round(subtotal * taxRate);
    const finalTotal = subtotal + deliveryCharge + tax;
    const totalDiscount = totalMRP - subtotal;

    const clearCartUI = () => {
        queryClient.setQueryData(["cart"], { items: [], subtotal: 0, totalMarketPrice: 0 });
        queryClient.invalidateQueries({ queryKey: ["cart"] });
    };

    const handleOnlinePayment = async (orderPayload) => {
        try {
            const isLoaded = await loadRazorpayScript();
            if (!isLoaded) return nxToast.error("Payment gateway offline");

            const { data } = await userAxios.post("/user/payment/create-order", { amount: finalTotal });
            if (!data.success) return nxToast.error("Initialization Failed");

            const rzpOrderId = data.order.id;

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: data.order.amount,
                currency: "INR",
                name: "Next Zen Store",
                description: "Checkout Terminal",
                order_id: rzpOrderId,
                handler: async function (response) {
                    try {
                        const verifyRes = await userAxios.post("/user/payment/verify-payment", response);
                        if (verifyRes.data.success) {
                            // 🟢 LOCK the redirect before mutation
                            setIsProcessing(true);

                            const finalRes = await placeOrder.mutateAsync({
                                ...orderPayload,
                                razorpayOrderId: rzpOrderId,
                                status: "pending",
                                paymentInfo: { id: response.razorpay_payment_id, status: "Paid", method: "razorpay" }
                            });
                            
                            clearCartUI();
                            // Ensure navigate uses absolute path
                            navigate(`/checkout/success/${finalRes.orderId}`, { replace: true });
                        }
                    } catch (err) {
                        nxToast.security("Verification error. Check order history.");
                    }
                },
                modal: {
                    ondismiss: async function () {
                        setIsProcessing(true); // Lock redirect
                        const failRes = await placeOrder.mutateAsync({ 
                            ...orderPayload, 
                            razorpayOrderId: rzpOrderId,
                            status: 'payment_failed' 
                        });
                        clearCartUI();
                        navigate("/payment-failed", {
                            state: {
                                error: "Payment was cancelled.",
                                razorpayOrderId: rzpOrderId,
                                orderPayload: { ...orderPayload, _id: failRes.orderId },
                                totalAmount: finalTotal
                            },
                            replace: true
                        });
                    }
                },
                theme: { color: "#7a6af6" }
            };

            const rzp = new window.Razorpay(options);
            
            rzp.on("payment.failed", async function (response) {
                setIsProcessing(true); // Lock redirect
                const failRes = await placeOrder.mutateAsync({ 
                    ...orderPayload, 
                    razorpayOrderId: rzpOrderId,
                    status: 'payment_failed' 
                });
                clearCartUI();
                navigate("/payment-failed", {
                    state: { 
                        error: response.error.description, 
                        razorpayOrderId: rzpOrderId, 
                        orderPayload: { ...orderPayload, _id: failRes.orderId }, 
                        totalAmount: finalTotal 
                    },
                    replace: true
                });
            });
            
            rzp.open();
        } catch (error) {
            nxToast.error("Gateway protocol error.");
        }
    };

    const handleConfirmRequest = () => {
        if (hasInventoryConflict) return nxToast.security("Items Unavailable", "Update your bag.");
        if (!selectedAddress) return nxToast.error("Address Required", "Select destination.");
        setFrozenTotals({ subtotal: totalMRP, totalDiscount, deliveryCharge, tax, totalAmount: finalTotal });
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
                totalAmount: item.currentPrice * item.quantity
            })),
            paymentMethod,
            totals: { totalMarketPrice: totalMRP, totalDiscount, deliveryCharge, tax, totalAmount: finalTotal }
        };

        if (paymentMethod === 'razorpay') {
            handleOnlinePayment(orderPayload);
        } else {
            setIsProcessing(true); // Lock redirect for COD
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

    const handleAddressUpdateSuccess = async (updatedData) => {
        await refetchAddresses();
        if (selectedAddress?._id === addressToEdit?._id) setSelectedAddress(prev => ({ ...prev, ...updatedData }));
        setIsAddressModalOpen(false);
        setAddressToEdit(null);
    };

    const handleAddressMutation = async (data) => {
        await updateAddress(addressToEdit._id, data);
        handleAddressUpdateSuccess(data);
    };

    const glassStyle = "bg-gradient-to-br from-white/[0.10] to-transparent backdrop-blur-xl border border-white/10 shadow-xl rounded-3xl";

    if (isCartLoading || isAddrLoading) return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <Loader2 className="animate-spin text-[#7a6af6]" size={32} />
        </div>
    );

    return (
        <div className="min-h-screen text-white flex flex-col font-sans">
            <Header />
            <main className="max-w-[1440px] mx-auto px-6 md:px-10 pt-32 pb-32 w-full">
                <div className="flex justify-between items-end mb-12 border-b border-white/10 pb-8">
                    <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#7a6af6]">Checkout Terminal</p>
                        <h1 className="text-5xl font-black uppercase tracking-tighter italic text-white">Review <span className="text-slate-500">({activeItems.length} Payload)</span></h1>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 items-start max-w-[1200px] mx-auto w-full">
                    <div className="w-full lg:flex-1 space-y-8">
                        {hasInventoryConflict && (
                            <section className="bg-red-500/10 border border-red-500/20 p-6 rounded-3xl flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <AlertCircle className="text-red-500" size={24} />
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-widest text-red-500">Update Required</p>
                                        <p className="text-[10px] text-white/60 font-bold uppercase">Stock mismatch detected.</p>
                                    </div>
                                </div>
                                <button onClick={() => navigate('/cart')} className="px-6 py-2 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-2"><ShoppingCart size={14} /> Update Bag</button>
                            </section>
                        )}

                        <section className={`${glassStyle} p-10 ${hasInventoryConflict ? 'opacity-50 pointer-events-none' : ''}`}>
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-[9px] font-black uppercase text-[#7a6af6] italic tracking-[0.3em] flex items-center gap-2"><MapPin size={12} /> 01 // Destination</h2>
                                <button onClick={() => navigate('/profile/address')} className="text-[8px] font-black uppercase px-5 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-[#7a6af6] transition-all"><Plus size={10} className="inline mr-1" /> Add New</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {addressData?.map((addr) => (
                                    <div key={addr._id} onClick={() => setSelectedAddress(addr)} className={`group relative p-6 rounded-2xl border transition-all cursor-pointer ${selectedAddress?._id === addr._id ? 'bg-white/[0.08] border-[#7a6af6]' : 'bg-white/5 border-white/5 hover:border-white/20'}`}>
                                        <div className="flex justify-between items-start mb-4">
                                            <span className={`px-2.5 py-0.5 rounded text-[7px] font-black uppercase ${selectedAddress?._id === addr._id ? 'bg-[#7a6af6]' : 'bg-white/5'}`}>{addr.addressType}</span>
                                            <div className="flex items-center gap-2">
                                                <button onClick={(e) => handleEditAddress(e, addr)} className="p-1.5 text-white/20 hover:text-white rounded-lg transition-all"><Edit2 size={14} /></button>
                                                {selectedAddress?._id === addr._id && <CheckCircle2 size={16} className="text-[#7a6af6]" />}
                                            </div>
                                        </div>
                                        <h3 className="text-sm font-black uppercase italic text-white mb-2">{addr.fullName}</h3>
                                        <p className="text-[10px] text-white/40 uppercase tracking-wider">{addr.addressLine}, {addr.city}<br />{addr.state} - {addr.pincode}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-[9px] font-black uppercase text-[#7a6af6] italic tracking-[0.3em] px-2 flex items-center gap-2"><Box size={14} /> 02 // Payload Items</h2>
                            <div className="space-y-3">
                                {allItems.map((item) => (
                                    <div key={item._id} className={`${glassStyle} p-5 flex items-center gap-6 relative overflow-hidden ${item.isCheckoutReady === false ? 'border-red-500/30' : ''}`}>
                                        {item.isCheckoutReady === false && <div className="absolute inset-0 bg-red-950/20 flex items-center justify-center z-10"><span className="bg-red-500 text-white text-[8px] font-black px-3 py-1 rounded-full">Unavailable</span></div>}
                                        <div className="w-12 h-16 rounded-xl overflow-hidden bg-black border border-white/10 shrink-0"><img src={item.variantId?.images?.[0]} className="w-full h-full object-cover" /></div>
                                        <div className="flex-1"><h3 className="text-xs font-black italic uppercase">{item.productId?.name}</h3><p className="text-[9px] text-white/30 font-bold mt-1">Size: {item.size} | Qty: {item.quantity}</p></div>
                                        <div className="text-right"><span className="text-lg font-black italic">₹{(item.currentPrice * item.quantity).toLocaleString()}</span></div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className={`${glassStyle} p-10 ${hasInventoryConflict ? 'opacity-50 pointer-events-none' : ''}`}>
                            <h2 className="text-[9px] font-black uppercase text-[#7a6af6] italic tracking-[0.3em] mb-8 flex items-center gap-2"><CreditCard size={12} /> 03 // Payment</h2>
                            <div className="space-y-4">
                                <div onClick={() => setPaymentMethod('cashOnDelivery')} className={`p-6 rounded-2xl border cursor-pointer flex items-center gap-5 transition-all ${paymentMethod === 'cashOnDelivery' ? 'border-[#7a6af6] bg-white/[0.08]' : 'border-white/5 bg-white/[0.02]'}`}>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'cashOnDelivery' ? 'border-[#7a6af6]' : 'border-white/20'}`}>{paymentMethod === 'cashOnDelivery' && <div className="w-2.5 h-2.5 rounded-full bg-[#7a6af6]" />}</div>
                                    <div className="flex-1"><p className="text-sm font-black uppercase italic text-white">Cash on Delivery</p></div>
                                    <Wallet className="text-white/20" size={24} />
                                </div>
                                <div onClick={() => setPaymentMethod('razorpay')} className={`p-6 rounded-2xl border cursor-pointer flex items-center gap-5 transition-all ${paymentMethod === 'razorpay' ? 'border-[#7a6af6] bg-white/[0.08]' : 'border-white/5 bg-white/[0.02]'}`}>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'razorpay' ? 'border-[#7a6af6]' : 'border-white/20'}`}>{paymentMethod === 'razorpay' && <div className="w-2.5 h-2.5 rounded-full bg-[#7a6af6]" />}</div>
                                    <div className="flex-1"><div className="flex items-center gap-2"><p className="text-sm font-black uppercase italic text-white">Online Terminal</p><span className="bg-[#7a6af6] text-white text-[8px] font-black px-2 py-0.5 rounded">ENCRYPTED</span></div></div>
                                    <CreditCard className="text-white/20" size={24} />
                                </div>
                            </div>
                        </section>
                    </div>

                    <aside className="w-full lg:w-[320px] lg:sticky lg:top-32">
                        <div className="bg-white text-[#0F172A] p-7 rounded-[2rem] shadow-2xl">
                            <h3 className="text-sm font-black uppercase text-slate-400 mb-6 border-b pb-4 italic text-center">Summary</h3>
                            <div className="space-y-4 mb-8">
                                <div className="flex justify-between text-[12px] font-bold text-slate-500"><span>Subtotal</span><span className="text-black font-black">₹{totalMRP.toLocaleString()}</span></div>
                                {totalDiscount > 0 && <div className="flex justify-between text-[12px] font-bold text-green-600"><span>Savings</span><span>- ₹{totalDiscount.toLocaleString()}</span></div>}
                                <div className="flex justify-between text-[12px] font-bold text-slate-500"><span>Tax (18%)</span><span className="text-black font-black">₹{tax.toLocaleString()}</span></div>
                                <div className="flex justify-between text-[12px] font-bold text-slate-500 border-b border-dashed pb-5"><span>Delivery</span><span className="font-black text-black">{deliveryCharge > 0 ? `₹${deliveryCharge}` : 'FREE'}</span></div>
                                <div className="pt-2 flex justify-between items-center text-lg font-black italic"><span className="text-slate-400 text-xs font-bold">Total</span><span className="text-3xl">₹{finalTotal.toLocaleString()}</span></div>
                            </div>
                            <button onClick={handleConfirmRequest} disabled={placeOrder.isPending} className="w-full py-5 bg-[#0F172A] text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] flex items-center justify-center gap-3 hover:bg-[#7a6af6] transition-all disabled:opacity-50 active:scale-95">
                                {placeOrder.isPending ? <Loader2 className="animate-spin" size={16} /> : <>Initialize Finalize <ArrowRight size={16} /></>}
                            </button>
                        </div>
                    </aside>
                </div>
            </main>

            <OrderConfirmModal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} onConfirm={handleFinalOrderPlacement} isPending={placeOrder.isPending} totals={frozenTotals || { subtotal: totalMRP, totalDiscount, deliveryCharge, tax, totalAmount: finalTotal }} inventoryConflict={hasInventoryConflict} />
            {isAddressModalOpen && <AddressModal isOpen={isAddressModalOpen} onClose={() => setIsAddressModalOpen(false)} mode="edit" initialData={addressToEdit} onSubmit={handleAddressMutation} />}
            <Footer />
        </div>
    );
};

export default CheckoutPage;