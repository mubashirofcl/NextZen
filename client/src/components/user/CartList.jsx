import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart, useClearCart } from '../../hooks/user/useCart';
import {
    Trash2, Minus, Plus, ShoppingBag, ShieldX,
    ShieldCheck, ArrowUpRight, Zap
} from 'lucide-react';
import { nxToast } from '../../utils/userToast';

const CartList = () => {
    const navigate = useNavigate();
    const { cart, updateQty, remove, isLoading, refetch } = useCart();
    const { mutate: clearCart } = useClearCart();

    useEffect(() => {
        refetch();
    }, [refetch]);

    const items = cart?.items || [];
    const glassStyle = "bg-white/[0.03] backdrop-blur-xl border border-white/10 shadow-xl rounded-[2rem]";

    if (isLoading) return <div className="py-20 text-center animate-pulse text-[#7a6af6] font-black uppercase tracking-[0.5em]">Syncing Your Bag...</div>;

    if (items.length === 0) return (
        <div className="py-40 text-center border-2 border-dashed border-white/5 rounded-[3rem] space-y-6">
            <ShoppingBag className="mx-auto text-white/5" size={48} />
            <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Your bag is empty</p>
            <button
                onClick={() => navigate('/shop')}
                className="bg-white text-black px-8 py-4 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-[#7a6af6] hover:text-white transition-all active:scale-95"
            >
                Start Shopping
            </button>
        </div>
    );

    return (
        <div className="w-full space-y-6">
            <div className="flex justify-between items-center px-2 pb-2 border-b border-white/5">
                <h2 className="text-[9px] font-black uppercase text-[#7a6af6] italic tracking-[0.4em]">01 // Your Items ({items.length})</h2>
                <button
                    onClick={() => nxToast.confirm("Clear Bag?", "Remove all items from your cart?", () => clearCart())}
                    className="text-[8px] font-black uppercase text-red-500/40 hover:text-red-500 transition-colors tracking-[0.2em]"
                >
                    Empty Cart
                </button>
            </div>

            <div className="space-y-4">
                {items.map((item) => {
          
                    const isOutOfStock = item.isCheckoutReady === false;
                    
                    const hasDiscount = item.marketPrice > item.currentPrice;

                    const showPriceDrop = item.priceDropped || (item.currentPrice < item.unitPrice);

                    return (
                        <div key={item._id} className={`${glassStyle} p-6 flex flex-col sm:flex-row items-center gap-6 group hover:border-white/20 transition-all relative overflow-hidden`}>

                            {isOutOfStock && (
                                <div className="absolute inset-0 bg-black/80 backdrop-blur-[4px] z-20 flex items-center justify-center border border-red-500/20 rounded-[2rem]">
                                    <div className="flex items-center gap-2 bg-red-600 text-white px-5 py-2 rounded-full shadow-2xl">
                                        <ShieldX size={14} />
                                        <span className="text-[9px] font-black uppercase tracking-widest">
                                            {item.errorMessage || "Currently Unavailable"}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Image Wrapper */}
                            <div 
                                onClick={() => !isOutOfStock && navigate(`/product/${item.productId?._id}`)}
                                className={`w-20 h-24 flex-shrink-0 rounded-2xl overflow-hidden bg-black border border-white/5 relative group/img ${isOutOfStock ? 'opacity-30' : 'cursor-pointer'}`}
                            >
                                <img 
                                    src={item.variantId?.images?.[0] || item.productId?.thumbnail} 
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-110" 
                                    alt="" 
                                />
                                {!isOutOfStock && (
                                    <div className="absolute inset-0 bg-[#7a6af6]/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                        <ArrowUpRight size={20} className="text-white" />
                                    </div>
                                )}
                            </div>

                            {/* Content Info */}
                            <div className={`flex-1 space-y-4 ${isOutOfStock ? 'opacity-30' : ''}`}>
                                <div>
                                    <h3 
                                        onClick={() => !isOutOfStock && navigate(`/product/${item.productId?._id}`)}
                                        className={`text-sm font-black text-white italic uppercase tracking-tight transition-colors ${!isOutOfStock ? 'cursor-pointer hover:text-[#7a6af6]' : ''}`}
                                    >
                                        {item.productId?.name || "Premium Item"}
                                    </h3>
                                    <div className="flex flex-wrap items-center gap-3 mt-1.5">
                                        <span className="px-2 py-0.5 bg-white/5 rounded text-[8px] font-black text-white/40 uppercase tracking-tighter border border-white/5">Size: {item.size}</span>
                                        
                                  
                                        {showPriceDrop && (
                                            <span className="flex items-center gap-1 text-[7px] font-black text-green-400 uppercase tracking-widest animate-pulse bg-green-500/10 px-2 py-0.5 rounded">
                                                <Zap size={8} className="fill-green-400" /> Offer Applied
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="flex items-center bg-white/5 rounded-xl p-1 border border-white/10 shadow-inner">
                                        <button
                                            onClick={() => updateQty.mutate({ itemId: item._id, action: 'dec' })}
                                            disabled={item.quantity <= 1 || isOutOfStock}
                                            className="p-1.5 text-white/30 hover:text-white disabled:opacity-10 transition-all"
                                        >
                                            <Minus size={14} />
                                        </button>
                                        <span className="text-xs font-black w-8 text-center text-white">{item.quantity}</span>
                                        <button
                                            onClick={() => updateQty.mutate({ itemId: item._id, action: 'inc' })}
                                            disabled={item.quantity >= 5 || isOutOfStock}
                                            className="p-1.5 text-white/30 hover:text-white disabled:opacity-10 transition-all"
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Remove Button */}
                            <button
                                onClick={() => remove.mutate(item._id)}
                                className="absolute top-6 right-6 z-30 p-2 text-white/10 hover:text-red-500 transition-all"
                            >
                                <Trash2 size={16} />
                            </button>

                            {/* Pricing */}
                            <div className={`text-right sm:border-l border-white/5 sm:pl-10 min-w-[120px] ${isOutOfStock ? 'opacity-30' : ''}`}>
                                <div className="space-y-1">
                                    {hasDiscount && (
                                        <p className="text-[10px] font-bold text-white/10 line-through italic tracking-tighter">
                                            ₹{(item.marketPrice * item.quantity).toLocaleString()}
                                        </p>
                                    )}
                                    <p className={`text-xl font-black italic tracking-tighter ${showPriceDrop ? 'text-green-400' : 'text-white'}`}>
                                        ₹{(item.currentPrice * item.quantity).toLocaleString()}
                                    </p>
                                    {showPriceDrop && (
                                        <p className="text-[7px] font-black text-green-400/50 uppercase italic tracking-widest">
                                            Price Updated
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="pt-8 flex flex-col items-center gap-4 opacity-20">
                <div className="flex items-center gap-2">
                    <ShieldCheck size={12} className="text-[#7a6af6]" />
                    <span className="text-[8px] font-black uppercase tracking-[0.3em] text-white text-center">
                        Safe Checkout Active
                    </span>
                </div>
            </div>
        </div>
    );
};

export default CartList;