import React from "react";
import Header from "../../components/user/Header";
import Footer from "../../components/user/Footer";
import CartList from "../../components/user/CartList"; 
import { useCart } from "../../hooks/user/useCart";

const CartPage = () => {
    const { cart } = useCart();
    const itemCount = cart?.items?.length || 0;

    return (
        <div className="min-h-screen  selection:bg-[#7a6af6]/30">
            <Header />
            
            <main className="max-w-[1440px] mx-auto px-6 md:px-10 pt-32 pb-32">
                {/* Header Section */}
                <div className="flex justify-between items-end mb-12 border-b border-slate-100 pb-8">
                    <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#7a6af6]">
                            User Assets // Cart
                        </p>
                        <h1 className="text-5xl font-black uppercase tracking-tighter italic">
                            Your Archive <span className="text-slate-200">({itemCount})</span>
                        </h1>
                    </div>
                    <p className="hidden md:block text-[10px] font-bold text-slate-400 uppercase tracking-widest max-w-[200px] text-right">
                        Review your selected pieces before initiating the final deployment.
                    </p>
                </div>

                <CartList />
            </main>

            <Footer />
        </div>
    );
};

export default CartPage;