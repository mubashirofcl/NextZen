import React from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, ShoppingBag, Heart, ArrowRight } from "lucide-react";
import { useWishlist } from "../../hooks/user/useWishlist";
import { nxToast } from "../../utils/userToast"; // Ensure nxToast is imported
import Header from "../../components/user/Header";
import Footer from "../../components/user/Footer";

const WishlistPage = () => {
    const navigate = useNavigate();
    const { wishlist, toggle, clearWishlist, isLoading } = useWishlist();

    const archiveItems = Array.isArray(wishlist) ? wishlist : [];

    return (
        <div className="min-h-screen">
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

                            return (
                                <div key={item._id} className="relative group bg-[#0f172a68] border border-white/5 p-4 rounded-[2rem] transition-all hover:border-[#7a6af6]/50">
                                    <div className="aspect-[3/4] rounded-[1.5rem] overflow-hidden bg-black mb-4 relative">
                                        <img
                                            src={imageUrl}
                                            className="w-full h-full object-cover"
                                            alt={product.name}
                                        />
                                        <button
                                            onClick={() => toggle.mutate({ productId: product._id, variantId: variant._id })}
                                            className="absolute top-4 right-4 p-2.5 bg-black/60 backdrop-blur-md rounded-full text-white/40 hover:text-red-500 transition-all"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    <div className="space-y-1 px-1">
                                        <h3 className="text-[11px] font-black uppercase tracking-tight text-white italic truncate">
                                            {product.name}
                                        </h3>
                                        <p className="text-[10px] font-medium text-white/40 uppercase tracking-wide">
                                            Color: <span className="text-white">{variant.color}</span>
                                        </p>
                                        <div className="flex justify-between items-center pt-2">
                                            <p className="text-sm font-black italic text-[#7a6af6]">
                                                ₹{displayPrice.toLocaleString()}
                                            </p>
                                            <button
                                                onClick={() => navigate(`/product/${product._id}`)}
                                                className="p-2 bg-white/5 rounded-lg hover:bg-white hover:text-black transition-all"
                                            >
                                                <ArrowRight size={14} />
                                            </button>
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