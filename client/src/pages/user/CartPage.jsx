import React, { useMemo } from "react";
import Header from "../../components/user/Header";
import Footer from "../../components/user/Footer";
import CartList from "../../components/user/CartList";
import { useCart } from "../../hooks/user/useCart";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CartPage = () => {
    const navigate = useNavigate();
    const { cart } = useCart();
    const itemCount = cart?.items?.length || 0;

    const financials = useMemo(() => {
        if (!cart?.items) return { subtotal: 0, totalDiscount: 0, deliveryCharge: 0, finalTotal: 0 };

        const subtotal = cart?.subtotal || 0;
        const totalMRP = cart?.totalMarketPrice || 0;

        const deliveryCharge = (subtotal > 0 && subtotal < 1999) ? 99 : 0;

        const finalTotal = subtotal + deliveryCharge;
        const totalDiscount = totalMRP - subtotal;

        return { subtotal, totalDiscount, deliveryCharge, finalTotal };
    }, [cart]);

    return (
        <div className="min-h-screen selection:bg-[#7a6af6]/30 text-white">
            <Header />

            <main className="max-w-[1440px] mx-auto px-6 md:px-10 pt-32 pb-32">
                <div className="flex justify-between items-end mb-12 border-b border-white/10 pb-8">
                    <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#7a6af6] italic">
                            Shopping Bag // Review
                        </p>
                        <h1 className="text-5xl font-black uppercase tracking-tighter italic">
                            Your Bag <span className="text-white/20">({itemCount})</span>
                        </h1>
                    </div>
                    <p className="hidden md:block text-[10px] font-bold text-white/40 uppercase tracking-widest max-w-[200px] text-right">
                        Review your items before proceeding to checkout.
                    </p>
                </div>

                <div className="flex flex-col lg:flex-row gap-10 items-start">
                    <div className="w-full lg:flex-1">
                        <CartList />
                    </div>

                    {itemCount > 0 && (
                        <aside className="w-full lg:w-[350px] lg:sticky lg:top-32">
                            <div className="bg-white text-black p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-[0.03] transition-opacity pointer-events-none">
                                    <ShieldCheck size={160} />
                                </div>

                                <h3 className="text-[10px] font-black uppercase text-black/30 mb-8 border-b border-black/5 pb-4 italic text-center tracking-[0.5em]">Order Summary</h3>

                                <div className="space-y-4 text-[11px] font-bold uppercase tracking-tight relative z-10">
                                    <div className="flex justify-between text-black/40">
                                        <span>Items Total</span>
                                        <span className="text-black font-black">₹{financials.subtotal.toLocaleString()}</span>
                                    </div>

                                    {financials.totalDiscount > 0 && (
                                        <div className="flex justify-between text-green-600">
                                            <span>Your Savings</span>
                                            <span>- ₹{financials.totalDiscount.toLocaleString()}</span>
                                        </div>
                                    )}

                                    <div className="flex justify-between text-black/40 border-b border-black/5 pb-6">
                                        <span>Delivery Fee</span>
                                        <span className="text-black font-black">
                                            {financials.deliveryCharge > 0 ? `₹${financials.deliveryCharge}` : 'FREE'}
                                        </span>
                                    </div>

                                    <div className="pt-2 flex justify-between items-center text-lg font-black italic">
                                        <span className="text-black/30 text-[9px] font-black uppercase tracking-[0.3em]">Grand Total</span>
                                        <span className="text-4xl tracking-tighter text-[#000] leading-none font-black">
                                            ₹{financials.finalTotal.toLocaleString()}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => navigate('/checkout')}
                                    className="group w-full py-6 mt-8 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.5em] flex items-center justify-center gap-3 transition-all duration-500 active:scale-95 shadow-xl bg-[#0F172A] text-white hover:bg-[#7a6af6]"
                                >
                                    Proceed to Checkout <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>

                            <p className="mt-6 text-[9px] text-white/20 font-bold uppercase text-center tracking-widest italic">
                                Safe & Secure Checkout via Razorpay
                            </p>
                        </aside>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default CartPage;