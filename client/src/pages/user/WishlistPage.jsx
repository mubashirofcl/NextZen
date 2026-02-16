import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowRight, Loader2, Heart } from 'lucide-react';
import { useWishlist } from "../../hooks/user/useWishlist";
import { useCart } from "../../hooks/user/useCart";
import { nxToast } from "../../utils/userToast";
import Header from "../../components/user/Header";
import Footer from "../../components/user/Footer";

const WishlistPage = () => {
    const navigate = useNavigate();
    const { wishlist, toggleWishlist, removeItem, clearWishlist, isLoading } = useWishlist();
    const { addToCart } = useCart();

    const archiveItems = Array.isArray(wishlist) ? wishlist : [];

    const handleMoveToCart = (item) => {
        const product = item.productId;
        const variant = item.variantId;

        if (!variant || !variant.sizes || variant.sizes.length === 0) {
            return nxToast.error("Protocol Error", "Asset data incomplete.");
        }

        const targetSize = variant.sizes.find(s => s.stock > 0);
        if (!targetSize) return nxToast.error("Out of Stock", "Item unavailable.");

        // 🟢 1. Add to Cart first
        addToCart.mutate({
            productId: product._id,
            variantId: variant._id,
            size: targetSize.size,
            quantity: 1,
            price: targetSize.salePrice || targetSize.originalPrice,
            stock: targetSize.stock
        }, {
            onSuccess: () => {
                removeItem.mutate({ 
                    productId: product._id, 
                    variantId: variant._id 
                });

                nxToast.success("Secured", "Item moved to your bag.");
            },
            onError: (err) => {
                nxToast.error("Transfer Error", err.response?.data?.message || "Could not move item.");
            }
        });
    };

    return (
        <div className="min-h-screen text-white">
            <Header />
            <main className="max-w-[1440px] mx-auto px-6 md:px-10 pt-32 pb-32">
                
                <div className="flex justify-between items-end mb-12 border-b border-white/5 pb-8">
                    <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#7a6af6]">Archive // Saved</p>
                        <h1 className="text-5xl font-black uppercase tracking-tighter italic text-white">The Wishlist</h1>
                    </div>
                    <div className="flex items-center gap-6">
                        {archiveItems.length > 0 && (
                            <button 
                                onClick={() => {
                                    nxToast.confirm("Purge Archive?", "This will remove all items.", () => clearWishlist.mutate());
                                }} 
                                className="text-[9px] font-black uppercase px-4 py-2 rounded-full border border-red-500/20 text-red-500/60 hover:bg-red-500 hover:text-white transition-all"
                            >
                                Clear Archive
                            </button>
                        )}
                        <span className="text-[10px] font-black text-white/20 uppercase italic tracking-widest">Count: {archiveItems.length}</span>
                    </div>
                </div>

                {isLoading ? (
                    <div className="py-40 text-center"><Loader2 className="animate-spin mx-auto text-[#7a6af6]" size={32} /></div>
                ) : archiveItems.length === 0 ? (
                    <div className="py-40 text-center border-2 border-dashed border-white/5 rounded-[3rem] space-y-6">
                        <Heart className="mx-auto text-white/5" size={48} />
                        <p className="text-[10px] font-black uppercase text-white/20">Archive Empty</p>
                        <button onClick={() => navigate('/shop')} className="bg-white text-black px-8 py-4 rounded-full text-[10px] font-black uppercase tracking-widest">Explore</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
                        {archiveItems.map((item) => {
                            const product = item.productId || {};
                            const variant = item.variantId || {};
                            
                            if (!product.name) return null;

                            const imageUrl = variant.images?.[0] || '/placeholder.jpg';
                            const prices = variant.sizes?.map(s => s.salePrice).filter(p => p > 0) || [];
                            const displayPrice = prices.length > 0 ? Math.min(...prices) : 0;

                            return (
                                <div key={item._id} className="group bg-white/[0.02] border border-white/5 p-4 rounded-[2rem] hover:border-[#7a6af6]/50 transition-all">
                                    <div className="aspect-[3/4] rounded-[1.5rem] overflow-hidden bg-black mb-4 relative">
                                        <img src={imageUrl} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt={product.name} />
                                        <button 
                                            onClick={() => toggleWishlist(product._id, variant._id)} 
                                            className="absolute top-4 right-4 p-2.5 bg-black/60 rounded-full text-white/40 hover:text-red-500 z-10"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    <div className="space-y-1 px-1">
                                        <h3 className="text-[11px] font-black uppercase text-white italic truncate">{product.name}</h3>
                                        <p className="text-[10px] text-white/40 uppercase">Color: {variant.color || 'Default'}</p>
                                        <div className="flex justify-between items-end pt-4">
                                            <p className="text-sm font-black italic text-[#7a6af6]">₹{displayPrice.toLocaleString()}</p>
                                            <div className="flex gap-2">
                                                <button onClick={() => navigate(`/product/${product._id}`)} className="p-2 border border-white/10 rounded-xl text-white/40 hover:bg-white hover:text-black transition-all">
                                                    <ArrowRight size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleMoveToCart(item)} 
                                                    disabled={addToCart.isPending}
                                                    className="p-2 bg-[#7a6af6] rounded-xl text-white hover:bg-white hover:text-[#7a6af6] transition-all"
                                                >
                                                    {addToCart.isPending ? <Loader2 size={16} className="animate-spin" /> : <ShoppingBag size={16} />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
};

export default WishlistPage;