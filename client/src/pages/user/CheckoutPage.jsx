import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../hooks/user/useCart';
import { useAddress } from '../../hooks/user/useAddress';
import { useOrder } from '../../hooks/user/useOrder';
import {
    CheckCircle2, ArrowRight, Loader2, MapPin,
    CreditCard, Plus, ShieldCheck, RefreshCw, AlertCircle, ShoppingCart
} from 'lucide-react';
import Header from '../../components/user/Header';
import Footer from '../../components/user/Footer';
import { nxToast } from '../../utils/userToast';
import OrderConfirmModal from '../../components/user/OrderConfirmModal';

const CheckoutPage = () => {
    const navigate = useNavigate();
    const { cart, isLoading: isCartLoading } = useCart();
    const { data: addressData, isLoading: isAddrLoading } = useAddress();
    const { placeOrder } = useOrder();

    const [selectedAddress, setSelectedAddress] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('cashOnDelivery');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [frozenTotals, setFrozenTotals] = useState(null);

    const allItems = cart?.items || [];
    const brokenItems = allItems.filter(i => i.isCheckoutReady === false);
    const activeItems = allItems.filter(i => i.isCheckoutReady !== false);
    const hasInventoryConflict = brokenItems.length > 0;

    useEffect(() => {
        if (!isCartLoading && (!cart?.items || cart.items.length === 0)) {
            navigate('/shop', { replace: true });
        }
    }, [cart, isCartLoading, navigate]);

    useEffect(() => {
        const addresses = Array.isArray(addressData) ? addressData : [];
        if (addresses.length > 0 && !selectedAddress) {
            setSelectedAddress(addresses.find(a => a.isDefault) || addresses[0]);
        }
    }, [addressData, selectedAddress]);

    // --- CALCULATIONS ---
    const subtotal = cart?.subtotal || 0;
    const totalMRP = cart?.totalMarketPrice || 0;
    const deliveryCharge = (subtotal > 0 && subtotal < 1999) ? 99 : 0;
    const finalTotal = subtotal + deliveryCharge;
    const totalDiscount = totalMRP - subtotal;

    const handleConfirmRequest = () => {
        if (hasInventoryConflict) {
            return nxToast.security("Items Unavailable", "Please remove out-of-stock items before placing your order.");
        }
        if (!selectedAddress) return nxToast.error("Address Required", "Please select a delivery address.");

        setFrozenTotals({
            subtotal: totalMRP,
            totalDiscount: totalDiscount,
            deliveryCharge,
            totalAmount: finalTotal
        });

        setIsModalOpen(true);
    };

    const handleFinalOrderPlacement = () => {
        const liveActiveItems = cart?.items?.filter(i => i.isCheckoutReady !== false) || [];

        if (liveActiveItems.length === 0 || hasInventoryConflict) {
            return;
        }

        setIsModalOpen(false);
        placeOrder.mutate({
            addressId: selectedAddress._id,
            items: liveActiveItems.map(item => ({
                productId: item.productId._id,
                variantId: item.variantId._id,
                size: item.size,
                quantity: item.quantity,
                price: item.currentPrice,
                originalPrice: item.marketPrice
            })),
            paymentMethod,
            totals: {
                totalMarketPrice: totalMRP,
                totalDiscount: totalDiscount,
                deliveryCharge,
                totalAmount: finalTotal
            }
        });
    };

    const glassStyle = "bg-gradient-to-br from-white/[0.10] to-transparent backdrop-blur-xl border border-white/10 shadow-xl rounded-3xl";

    if (isCartLoading || isAddrLoading) return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <Loader2 className="animate-spin text-[#7a6af6]" size={32} />
        </div>
    );

    return (
        <div className="min-h-screen text-white flex flex-col font-sans selection:bg-[#7a6af6]/30">
            <Header />

            <main className="max-w-[1440px] mx-auto px-6 md:px-10 pt-32 pb-32 w-full">

                <div className="flex justify-between items-end mb-12 border-b border-white/10 pb-8">
                    <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#7a6af6]">
                            Checkout Process
                        </p>
                        <h1 className="text-5xl font-black uppercase tracking-tighter italic text-white">
                            Order Review <span className="text-slate-500">({activeItems.length} items)</span>
                        </h1>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 items-start max-w-[1200px] mx-auto w-full">

                    <div className="w-full lg:flex-1 space-y-8">

                        {/* --- STOCK ERROR ALERT --- */}
                        {hasInventoryConflict && (
                            <section className="bg-red-500/10 border border-red-500/20 p-6 rounded-3xl flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <AlertCircle className="text-red-500" size={24} />
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-widest text-red-500">Inventory Update</p>
                                        <p className="text-[10px] text-white/60 font-bold uppercase tracking-tight">Some items in your bag have just gone out of stock. Please update your bag to continue.</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => navigate('/cart')}
                                    className="px-6 py-2 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase hover:bg-red-600 transition-all flex items-center gap-2"
                                >
                                    <ShoppingCart size={14} /> Update Bag
                                </button>
                            </section>
                        )}

                        {/* 01. DELIVERY ADDRESS */}
                        <section className={`${glassStyle} p-10 ${hasInventoryConflict ? 'opacity-50 pointer-events-none' : ''}`}>
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-[9px] font-black uppercase text-[#7a6af6] italic tracking-[0.3em] flex items-center gap-2">
                                    <MapPin size={12} /> 01 // Delivery Address
                                </h2>
                                <button onClick={() => navigate('/profile/address')} className="text-[8px] font-black uppercase px-5 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-[#7a6af6] transition-all">
                                    <Plus size={10} className="inline mr-1" /> Add New Address
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {addressData?.map((addr) => (
                                    <div
                                        key={addr._id}
                                        onClick={() => setSelectedAddress(addr)}
                                        className={`p-6 rounded-2xl border transition-all cursor-pointer ${selectedAddress?._id === addr._id
                                            ? 'bg-white/[0.08] border-[#7a6af6]'
                                            : 'bg-white/[0.02] border-white/5 hover:border-white/20'
                                            }`}
                                    >
                                        <div className="flex justify-between mb-4">
                                            <span className={`px-2.5 py-0.5 rounded text-[7px] font-black uppercase tracking-widest ${selectedAddress?._id === addr._id ? 'bg-[#7a6af6] text-white' : 'bg-white/5 text-white/30'}`}>
                                                {addr.addressType}
                                            </span>
                                            {selectedAddress?._id === addr._id && <CheckCircle2 size={16} className="text-[#7a6af6]" />}
                                        </div>
                                        <h3 className="text-sm font-black uppercase italic text-white mb-2">{addr.fullName}</h3>
                                        <p className="text-[10px] text-white/40 uppercase font-medium tracking-wider leading-relaxed">
                                            {addr.addressLine}, {addr.city}<br />{addr.state} - {addr.pincode}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* 02. ITEM PREVIEW */}
                        <section className="space-y-4">
                            <h2 className="text-[9px] font-black uppercase text-[#7a6af6] italic tracking-[0.3em] px-2">
                                02 // Review Items
                            </h2>
                            <div className="space-y-3">
                                {allItems.map((item) => (
                                    <div key={item._id} className={`${glassStyle} p-5 flex items-center gap-6 group relative overflow-hidden ${item.isCheckoutReady === false ? 'border-red-500/30' : ''}`}>

                                        {item.isCheckoutReady === false && (
                                            <div className="absolute inset-0 bg-red-950/20 backdrop-blur-[2px] flex items-center justify-center z-10">
                                                <span className="bg-red-500 text-white text-[8px] font-black uppercase px-3 py-1 rounded-full shadow-lg">Out of Stock</span>
                                            </div>
                                        )}

                                        <div className="w-16 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-black">
                                            <img src={item.variantId?.images?.[0]} className={`w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 ${item.isCheckoutReady === false ? 'opacity-20' : ''}`} alt="" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className={`text-xs font-black italic uppercase tracking-tight ${item.isCheckoutReady === false ? 'text-white/20' : 'text-white'}`}>{item.productId?.name}</h3>
                                            <p className="text-[9px] text-white/30 font-bold uppercase mt-1 tracking-widest leading-none">Size: {item.size} | Qty: {item.quantity}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-lg font-black italic ${item.isCheckoutReady === false ? 'text-white/10' : 'text-white'}`}>₹{(item.currentPrice * item.quantity).toLocaleString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* 03. PAYMENT SELECTION */}
                        <section className={`${glassStyle} p-10 relative overflow-hidden ${hasInventoryConflict ? 'opacity-50 pointer-events-none' : ''}`}>
                            <h2 className="text-[9px] font-black uppercase text-[#7a6af6] italic tracking-[0.3em] mb-8 flex items-center gap-2">
                                <CreditCard size={12} /> 03 // Payment Method
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-6 rounded-2xl border border-[#7a6af6] bg-white/[0.08] cursor-default flex items-center gap-5">
                                    <div className="w-4 h-4 rounded-full border-2 border-[#7a6af6] flex items-center justify-center">
                                        <div className="w-2 h-2 rounded-full bg-[#7a6af6]" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black uppercase italic text-white">Cash on Delivery</p>
                                        <p className="text-[9px] text-[#7a6af6] font-black uppercase tracking-widest">Selected Option</p>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* RIGHT SIDE: PRICE SUMMARY */}
                    <aside className="w-full lg:w-[320px] lg:sticky lg:top-32">
                        <div className="bg-white text-[#0F172A] p-7 rounded-[2rem] shadow-2xl border border-slate-100">
                            <h3 className="text-sm font-black uppercase tracking-wider text-slate-400 mb-6 border-b border-slate-50 pb-4 italic text-center">
                                Price Details
                            </h3>

                            <div className="space-y-4 mb-8">
                                <div className="flex justify-between text-[12px] font-bold uppercase tracking-tight text-slate-500">
                                    <span>Subtotal</span>
                                    <span className="text-black font-black">₹{totalMRP.toLocaleString()}</span>
                                </div>

                                {totalDiscount > 0 && (
                                    <div className="flex justify-between text-[12px] font-bold uppercase tracking-tight text-green-600">
                                        <span>Total Savings</span>
                                        <span>- ₹{totalDiscount.toLocaleString()}</span>
                                    </div>
                                )}

                                <div className="flex justify-between text-[12px] font-bold uppercase tracking-tight text-slate-500 border-b border-dashed border-slate-100 pb-5">
                                    <span>Delivery Fee</span>
                                    <span className="font-black text-black">{deliveryCharge > 0 ? `₹${deliveryCharge}` : 'FREE'}</span>
                                </div>

                                <div className="pt-2 flex justify-between items-center text-lg font-black uppercase tracking-tighter text-black leading-none">
                                    <span className="text-slate-400 text-xs font-bold uppercase tracking-tighter">Total Payable</span>
                                    <span className="text-3xl italic tracking-tighter font-black">₹{finalTotal.toLocaleString()}</span>
                                </div>
                            </div>

                            {hasInventoryConflict ? (
                                <button
                                    onClick={() => navigate('/cart')}
                                    className="w-full py-5 bg-red-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] flex items-center justify-center gap-3 hover:bg-red-600 transition-all duration-300 shadow-xl"
                                >
                                    Remove Unavailable Items <ArrowRight size={16} />
                                </button>
                            ) : (
                                <button
                                    onClick={handleConfirmRequest}
                                    disabled={placeOrder.isPending}
                                    className="w-full py-5 bg-[#0F172A] text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] flex items-center justify-center gap-3 hover:bg-[#7a6af6] transition-all duration-300 shadow-xl active:scale-95 disabled:opacity-50"
                                >
                                    {placeOrder.isPending ? (
                                        <Loader2 className="animate-spin" size={16} />
                                    ) : (
                                        <>Proceed to Confirm <ArrowRight size={16} /></>
                                    )}
                                </button>
                            )}

                            <div className="mt-8 space-y-3 pt-6 border-t border-slate-50">
                                <div className="flex items-center gap-2 text-green-600">
                                    <ShieldCheck size={14} />
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter italic leading-none">Safe & Secure Payment</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-300">
                                    <RefreshCw size={14} />
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter italic leading-none">30-Day Easy Returns</span>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </main>

            <OrderConfirmModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleFinalOrderPlacement}
                isPending={placeOrder.isPending}
                totals={frozenTotals || {
                    subtotal: totalMRP,
                    totalDiscount: totalDiscount,
                    deliveryCharge,
                    totalAmount: finalTotal
                }}

                inventoryConflict={hasInventoryConflict}
            />

            <Footer />
        </div>
    );
};

export default CheckoutPage;