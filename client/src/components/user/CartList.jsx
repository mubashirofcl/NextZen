import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart, useClearCart } from '../../hooks/user/useCart';
import { Trash2, Minus, Plus, ShoppingBag, ShieldX, Info, ArrowRight, Loader2 } from 'lucide-react';
import { nxToast } from '../../utils/userToast';
import userAxios from '../../api/user/userAxios';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const CartList = () => {
    const navigate = useNavigate();
    const { cart, updateQty, remove, isLoading } = useCart();
    const { mutate: clearCart } = useClearCart();

    // Items Categorization
    const items = cart?.items || [];
    const activeItems = items.filter(i => i.isCheckoutReady !== false);
    const brokenItems = items.filter(i => i.isCheckoutReady === false);
    const subtotal = cart?.subtotal || 0;

    // Inside CartList.jsx
    const queryClient = useQueryClient(); // Ensure this is initialized at the top

    const validateAndProceed = useMutation({
        mutationFn: async () => {
            const { data } = await userAxios.get("/user/cart/validate-checkout");
            return data;
        },
        onSuccess: () => {
            navigate('/checkout');
        },
        onError: (error) => {
            // 1. Force React Query to re-fetch the cart
            // This will bring in the "isCheckoutReady: false" and "errorMessage"
            queryClient.invalidateQueries(["cart"]);

            // 2. Extract and show the error toast
            const message = error.response?.data?.message || "Archive validation failed.";
            nxToast.security("Inventory Conflict", message);
        }
    });

    const handleProceed = () => {
        // 1. Client-side blocking
        if (brokenItems.length > 0) {
            return nxToast.security(
                "Action Blocked",
                "Please remove unavailable or out-of-stock items before deployment."
            );
        }
        if (activeItems.length === 0) {
            return nxToast.error("Empty Archive", "Add items before initiating checkout.");
        }

        // 2. Server-side validation (Pre-flight check)
        validateAndProceed.mutate();
    };

    if (isLoading) return (
        <div className="py-20 text-center animate-pulse">
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#7a6af6]">Syncing Archive...</span>
        </div>
    );

    if (items.length === 0) return (
        <div className="py-32 text-center border-2 border-dashed border-white/5 rounded-[3rem] bg-white/[0.01]">
            <ShoppingBag className="mx-auto text-white/10 mb-4" size={40} />
            <h2 className="text-[10px] font-black uppercase text-white/20 tracking-[0.5em]">Archive Empty</h2>
            <button
                onClick={() => navigate('/shop')}
                className="mt-8 px-8 py-4 bg-white text-black rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-[#7a6af6] hover:text-white transition-all"
            >
                Explore Drops
            </button>
        </div>
    );

    return (
        <div className="flex flex-col xl:flex-row gap-8 items-start max-w-[1400px] mx-auto px-4">
            {/* LEFT: ITEM LIST */}
            <div className="w-full xl:flex-1 space-y-4">
                <div className="flex justify-between items-center px-1 pb-4 border-b border-white/5">
                    <h2 className="text-[10px] font-black uppercase tracking-widest text-white/40 italic">
                        Deployment Manifest // {activeItems.length} SEGMENTS
                    </h2>
                    <button
                        disabled={isLoading}
                        onClick={() => {
                            nxToast.confirm(
                                "Purge Manifest?",
                                "This action will permanently remove all items from your current archive session.",
                                () => clearCart()
                            );
                        }}
                        className="text-[9px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full border border-red-500/20 bg-red-500/5 text-red-500/60 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all active:scale-95 disabled:opacity-20"
                    >
                        Clear Archive
                    </button>
                </div>

                {activeItems.map((item) => (
                    <div key={item._id} className="group relative flex items-center gap-6 p-4 bg-[#0f172a68] border border-white/5 rounded-2xl hover:border-white/10 transition-all duration-300">
                        <div className="w-20 h-24 sm:w-24 sm:h-32 flex-shrink-0 rounded-xl overflow-hidden bg-black shadow-inner">
                            <img src={item.variantId?.images?.[0]} className="w-full h-full object-cover" alt={item.productId?.name} />
                        </div>
                        <div className="flex-1 flex flex-col justify-between h-24 sm:h-32 py-1">
                            <div className="space-y-1">
                                <h3 className="text-sm sm:text-base font-bold text-white tracking-tight leading-tight uppercase italic">{item.productId?.name}</h3>
                                <p className="text-[10px] sm:text-xs font-medium text-white/40 uppercase tracking-wide">
                                    Size: <span className="text-white">{item.size}</span> <span className="mx-2 opacity-20">|</span> Color: <span className="text-white">{item.variantId?.color}</span>
                                </p>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="flex items-center bg-black/40 rounded-lg p-1 border border-white/10">
                                    <button onClick={() => updateQty.mutate({ itemId: item._id, action: 'dec' })} disabled={item.quantity <= 1} className="p-1.5 text-white/30 hover:text-white disabled:opacity-10 transition-colors"><Minus size={14} /></button>
                                    <span className="text-xs font-bold w-8 text-center text-white">{item.quantity}</span>
                                    <button onClick={() => updateQty.mutate({ itemId: item._id, action: 'inc' })} disabled={item.quantity >= 5 || item.quantity >= item.currentStock} className="p-1.5 text-white/30 hover:text-white disabled:opacity-10 transition-colors"><Plus size={14} /></button>
                                </div>
                                <button onClick={() => remove.mutate(item._id)} className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-white/20 hover:text-red-500 transition-colors">
                                    <Trash2 size={14} /> <span>Remove</span>
                                </button>
                            </div>
                        </div>
                        <div className="text-right pr-4 border-l border-white/5 pl-6">
                            <p className="text-[9px] font-bold text-white/20 uppercase tracking-tighter mb-1">Item Total</p>
                            <span className="text-base sm:text-xl font-black text-white italic">₹{(item.currentPrice * item.quantity).toLocaleString()}</span>
                        </div>
                    </div>
                ))}

                {/* ERROR SECTION */}
                {brokenItems.length > 0 && (
                    <div className="mt-12 pt-8 border-t border-red-500/10">
                        <div className="flex items-center gap-2 mb-4 px-1">
                            <ShieldX size={16} className="text-red-500" />
                            <h2 className="text-xs font-black uppercase tracking-widest text-red-500">Inventory Conflicts</h2>
                        </div>
                        {brokenItems.map((item) => (
                            <div key={item._id} className="flex items-center gap-4 p-4 bg-red-500/[0.03] border border-red-500/10 rounded-2xl opacity-80 mb-3">
                                <div className="w-14 h-14 rounded-lg overflow-hidden grayscale bg-black flex-shrink-0 opacity-40">
                                    <img src={item.variantId?.images?.[0]} className="w-full h-full object-cover" alt="" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xs font-bold text-white/40 uppercase italic">{item.productId?.name}</h3>
                                    <p className="text-[10px] text-red-500 font-medium mt-1 flex items-center gap-1 uppercase tracking-tighter">
                                        <Info size={10} /> {item.errorMessage || "Deployment halted: Item unavailable."}
                                    </p>
                                </div>
                                <button onClick={() => remove.mutate(item._id)} className="p-3 text-white/20 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* RIGHT: ORDER SUMMARY */}
            <div className="w-full xl:w-80 sticky top-10">
                <div className="bg-[#0f172a68] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl backdrop-blur-md">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 mb-10 text-center italic">Pricing Manifest</h3>
                    <div className="space-y-6 mb-10">
                        <div className="flex justify-between text-[11px] font-bold text-white/30 uppercase tracking-[0.2em] px-1">
                            <span>Subtotal</span>
                            <span className="text-white">₹{subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-[11px] font-bold text-white/30 uppercase tracking-[0.2em] px-1">
                            <span>Logistics</span>
                            <span className="text-[#7a6af6]">Complimentary</span>
                        </div>
                        <div className="pt-6 border-t border-white/5">
                            <div className="flex justify-between items-end">
                                <span className="text-[10px] font-black uppercase text-[#7a6af6] mb-1 italic">Total Deployment</span>
                                <span className="text-4xl font-black italic text-white tracking-tighter">₹{subtotal.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleProceed}
                        disabled={brokenItems.length > 0 || activeItems.length === 0 || validateAndProceed.isLoading}
                        className="group w-full py-5 bg-[#7a6af6] text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white hover:text-black transition-all flex items-center justify-center gap-3 disabled:opacity-10 disabled:cursor-not-allowed shadow-lg shadow-[#7a6af6]/20"
                    >
                        {validateAndProceed.isLoading ? (
                            <Loader2 className="animate-spin" size={16} />
                        ) : brokenItems.length > 0 ? (
                            "Resolve Conflicts"
                        ) : (
                            <>Proceed To Check Out <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" /></>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CartList;