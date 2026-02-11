import React from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, ShoppingBag, Heart, ArrowRight, AlertCircle } from "lucide-react";
import { useWishlist } from "../../hooks/user/useWishlist";
import { useCart } from "../../hooks/user/useCart";
import { nxToast } from "../../utils/userToast";
import Header from "../../components/user/Header";
import Footer from "../../components/user/Footer";

const WishlistPage = () => {
    const navigate = useNavigate();

    // 🟢 Hooks: Ensure 'removeItem' is destructured from useWishlist
    const { wishlist, toggle, removeItem, clearWishlist, isLoading } = useWishlist();
    const { addToCart } = useCart();

    const archiveItems = Array.isArray(wishlist) ? wishlist : [];

    const handleMoveToCart = (item) => {
        const product = item.productId;
        const variant = item.variantId;

        // 1. Auto-select first available size
        const targetSize = variant.sizes?.find(s => s.stock > 0);

        if (!targetSize) {
            return nxToast.error("Out of Stock", "No sizes available for this item.");
        }

        // 2. Add to Cart
        addToCart.mutate({
            productId: product._id,
            variantId: variant._id,
            size: targetSize.size,
            quantity: 1,
            price: targetSize.salePrice || targetSize.originalPrice,
            stock: targetSize.stock
        }, {
            onSuccess: () => {
                // 🟢 3. STRICT REMOVE: Use removeItem instead of toggle
                // This guarantees the item is removed and never re-added
                removeItem.mutate({ 
                    productId: product._id, 
                    variantId: variant._id 
                });

                nxToast.success("Moved to Bag", "Item moved from wishlist to cart.");
            },
            onError: (err) => {
                nxToast.error("Action Failed", err.response?.data?.message || "Could not move item.");
            }
        });
    };

    return (
        <div className="min-h-screen text-white">
            <Header />
            <main className="max-w-[1440px] mx-auto px-6 md:px-10 pt-32 pb-32">

                {/* HEADER SECTION */}
                <div className="flex justify-between items-end mb-12 border-b border-white/5 pb-8">
                    <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#7a6af6]">Archive // Saved</p>
                        <h1 className="text-5xl font-black uppercase tracking-tighter italic text-white">The Wishlist</h1>
                    </div>

                    <div className="flex items-center gap-6">
                        {archiveItems.length > 0 && (
                            <button
                                onClick={() => {
                                    nxToast.confirm(
                                        "Purge Wishlist?",
                                        "All saved items will be permanently removed from your archive.",
                                        () => clearWishlist.mutate()
                                    );
                                }}
                                className="text-[9px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full border border-red-500/20 bg-red-500/5 text-red-500/60 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all active:scale-95"
                            >
                                Clear Archive
                            </button>
                        )}
                        <span className="text-[10px] font-black text-white/20 uppercase italic tracking-widest">
                            Segment Count: {archiveItems.length}
                        </span>
                    </div>
                </div>

                {/* CONTENT SECTION */}
                {isLoading ? (
                    <div className="py-20 text-center">
                        <span className="font-black uppercase text-[10px] animate-pulse tracking-[0.5em] text-slate-400">Syncing Archive...</span>
                    </div>
                ) : archiveItems.length === 0 ? (
                    <div className="py-40 text-center border-2 border-dashed border-white/5 rounded-[3rem] space-y-6">
                        <Heart className="mx-auto text-white/5" size={48} />
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Your archive is empty</p>
                        <button
                            onClick={() => navigate('/shop')}
                            className="bg-white text-black px-8 py-4 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-[#7a6af6] hover:text-white transition-all active:scale-95"
                        >
                            Explore Drops
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
                        {archiveItems.map((item) => {
                            const product = item.productId;
                            const variant = item.variantId;

                            if (!product || !variant) return null;

                            const imageUrl = variant.images?.[0] || '/placeholder.jpg';
                            const displayPrice = variant.sizes?.length > 0
                                ? Math.min(...variant.sizes.map(s => s.salePrice || s.originalPrice))
                                : 0;

                            // Check stock for "Sold Out" badge
                            const isOutOfStock = !variant.sizes?.some(s => s.stock > 0);

                            return (
                                <div key={item._id} className="relative group bg-[#0f172a68] border border-white/5 p-4 rounded-[2rem] transition-all hover:border-[#7a6af6]/50 hover:bg-[#7a6af6]/5">

                                    {/* IMAGE AREA */}
                                    <div className="aspect-[3/4] rounded-[1.5rem] overflow-hidden bg-black mb-4 relative">
                                        <img
                                            src={imageUrl}
                                            className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${isOutOfStock ? 'opacity-40 grayscale' : ''}`}
                                            alt={product.name}
                                        />

                                        {/* Remove Button (Top Right) */}
                                        <button
                                            onClick={() => toggle.mutate({ productId: product._id, variantId: variant._id })}
                                            className="absolute top-4 right-4 p-2.5 bg-black/60 backdrop-blur-md rounded-full text-white/40 hover:text-red-500 transition-all z-10"
                                            title="Remove from Wishlist"
                                        >
                                            <Trash2 size={16} />
                                        </button>

                                        {isOutOfStock && (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="bg-black/80 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border border-white/10">
                                                    Sold Out
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* INFO AREA */}
                                    <div className="space-y-1 px-1">
                                        <h3 className="text-[11px] font-black uppercase tracking-tight text-white italic truncate">
                                            {product.name}
                                        </h3>
                                        <p className="text-[10px] font-medium text-white/40 uppercase tracking-wide">
                                            Color: <span className="text-white">{variant.color}</span>
                                        </p>

                                        <div className="flex justify-between items-end pt-4">
                                            <p className="text-sm font-black italic text-[#7a6af6] mb-1">
                                                ₹{displayPrice.toLocaleString()}
                                            </p>

                                            {/* 🟢 ACTION BUTTONS */}
                                            <div className="flex gap-2">
                                                {/* View Details */}
                                                <button
                                                    onClick={() => navigate(`/product/${product._id}`)}
                                                    className="p-2.5 border border-white/10 rounded-xl text-white/40 hover:bg-white hover:text-black hover:border-white transition-all"
                                                    title="View Details"
                                                >
                                                    <ArrowRight size={16} />
                                                </button>

                                                {/* Move to Cart */}
                                                <button
                                                    disabled={isOutOfStock}
                                                    onClick={() => handleMoveToCart(item)}
                                                    className="p-2.5 bg-[#7a6af6] rounded-xl text-white hover:bg-white hover:text-[#7a6af6] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#7a6af6]/20"
                                                    title="Move to Bag"
                                                >
                                                    <ShoppingBag size={16} />
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