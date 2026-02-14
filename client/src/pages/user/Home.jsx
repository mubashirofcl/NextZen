import React from 'react';
import { Star, ArrowUpRight, ShoppingBag, ArrowRight, Loader2, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/user/Header';
import Footer from '../../components/user/Footer';
import { useProducts } from "../../hooks/user/useProducts";
import { useUserCategories } from '../../hooks/user/useUserCategories';
import { useCart } from '../../hooks/user/useCart';
import { useSelector } from 'react-redux';
import { nxToast } from '../../utils/userToast';
import { useWishlist } from '../../hooks/user/useWishlist';

/* ---------------- INDUSTRIAL RIB COMPONENT ---------------- */
const NewCollectionRib = ({ rotation, top, text = "NEW COLLECTION" }) => (
    <div
        className="absolute w-[180%] py-3 md:py-5 bg-[#8676ff] flex overflow-hidden whitespace-nowrap border-y border-black/20 z-20 shadow-[0_10px_40px_rgba(0,0,0,0.3)] select-none pointer-events-none"
        style={{ transform: `rotate(${rotation}deg)`, top: top, left: '-40%' }}
    >
        <div className="animate-marquee-slow flex items-center">
            {[...Array(15)].map((_, i) => (
                <span key={i} className="text-black font-black text-[14px] md:text-[22px] italic tracking-tighter mx-6 flex items-center gap-4">
                    {text} <div className="w-1.5 h-1.5 bg-black rounded-full" />
                </span>
            ))}
        </div>
    </div>
);

const Home = () => {
    const navigate = useNavigate();
    const { data: categories = [], isLoading: catLoading } = useUserCategories();
    const { data: allProductsData } = useProducts({ limit: 50 });
    const { data: featuredData } = useProducts({ limit: 4, isFeatured: true, sort: "createdAt" });
    const { data: freshData } = useProducts({ limit: 4, sort: "createdAt" });

    const featuredProducts = featuredData?.products || [];
    const freshArrivals = freshData?.products || [];
    const allProducts = allProductsData?.products || [];

    const getCategoryImage = (catId, index) => {
        const product = allProducts?.find(p =>
            String(p.categoryId?._id || p.categoryId) === String(catId)
        );
        if (product?.thumbnail) return product.thumbnail;
        const menFallbacks = [
            "https://images.unsplash.com/photo-1681091638047-4e91651c7a31?q=80&w=1000",
            "https://images.unsplash.com/photo-1578681994506-b8f463449011?q=80&w=1000",
            "https://plus.unsplash.com/premium_photo-1673125287363-b4e837f1215f?q=80&w=1000"
        ];
        return menFallbacks[index % menFallbacks.length];
    };

    return (
        <div className="relative min-h-screen font-sans text-white selection:bg-[#7a6af6]/20 overflow-x-hidden pt-20">
            <Header />

            <section className="relative h-[65vh] md:h-[85vh] flex items-center justify-center mb-28 mt-4 overflow-hidden">
                <div className="absolute inset-0 pointer-events-none z-20">
                    <NewCollectionRib rotation={-8} top="35%" />
                    <NewCollectionRib rotation={7} top="48%" />
                </div>

                <div className="absolute inset-x-4 md:inset-x-10 inset-y-0 rounded-[2rem] md:rounded-[3.5rem] overflow-hidden border border-white/5 shadow-2xl bg-[#414141] z-10">
                    <img
                        src="https://images.unsplash.com/photo-1507680434567-5739c80be1ac?q=80&w=2000"
                        alt="Background"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#050505]/40" />
                </div>

                <div className="relative z-30 text-center select-none px-4">
                    <h1 className="text-[clamp(3.5rem,14vw,10rem)] font-black uppercase italic leading-[0.82] tracking-tighter text-white drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
                        ARCHIVE STORE<br />
                        <span className="text-transparent text-outline-white opacity-50">FOR YOUR SOUL</span>
                    </h1>
                </div>
            </section>

            <main className="max-w-[1600px] mx-auto px-6 md:px-12 relative z-10">
                <section className="w-full mb-32">
                    <div className="flex flex-wrap lg:flex-nowrap gap-6">
                        {!catLoading && categories.slice(0, 4).map((cat, index) => (
                            <CategoryTile
                                key={cat._id}
                                title={cat.name}
                                img={getCategoryImage(cat._id, index)}
                                onClick={() => navigate(`/shop?category=${cat._id}`)}
                            />
                        ))}
                    </div>
                </section>

                <section className="mb-32">
                    <div className="flex justify-between items-end mb-12 border-b border-white/10 pb-8">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-[#7a6af6] rounded-full animate-pulse" />
                                <span className="text-[#7a6af6] text-[10px] font-black uppercase tracking-[0.4em]">Segment 26 // Selection</span>
                            </div>
                            <h3 className="text-5xl font-black uppercase tracking-tighter italic">Featured Archive</h3>
                        </div>
                        <button onClick={() => navigate('/shop')} className="group flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all">
                            View Collection <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
                        </button>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                        {featuredProducts.map((prod) => (
                            <StandardProductCard key={prod._id} prod={prod} tag="Curated" />
                        ))}
                    </div>
                </section>

                <div className="w-[150vw] -ml-[25vw] border-y border-white/5 bg-white/[0.01] py-6 overflow-hidden flex font-black text-[12px] tracking-[0.6em] uppercase mb-32 italic">
                    <div className="flex items-center gap-16 animate-marquee shrink-0">
                        {[...Array(10)].map((_, i) => (
                            <span key={i} className="flex items-center gap-16 text-white/20">
                                NEXTZEN ARCHIVE <Star size={12} className="fill-[#7a6af6] text-[#7a6af6]" />
                                LIMITED DROP 2026 <Star size={12} className="fill-[#7a6af6] text-[#7a6af6]" />
                            </span>
                        ))}
                    </div>
                </div>

                <section className="p-12 md:p-20 backdrop-blur-3xl bg-white/[0.01] border border-white/5 rounded-[4rem] mb-32 shadow-[0_40px_100px_rgba(0,0,0,0.5)] relative overflow-hidden">
                    <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#7a6af6]/5 blur-[120px] rounded-full" />
                    <div className="flex justify-between items-center mb-16 relative z-10">
                        <h3 className="text-4xl font-black uppercase tracking-tighter italic">Latest Segments</h3>
                        <button onClick={() => navigate('/shop')} className="px-8 py-3 bg-white text-black rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-[#7a6af6] hover:text-white transition-all shadow-xl">Explore Drops</button>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
                        {freshArrivals.map((prod) => (
                            <StandardProductCard key={prod._id} prod={prod} tag="Fresh Arrival" />
                        ))}
                    </div>
                </section>
            </main>

            <Footer />

            <style dangerouslySetInnerHTML={{
                __html: `
                .text-outline-white { -webkit-text-stroke: 1px rgba(255,255,255,0.3); }
                @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
                @keyframes marquee-slow { 0% { transform: translateX(0); } 100% { transform: translateX(-30%); } }
                .animate-marquee { animation: marquee 25s linear infinite; }
                .animate-marquee-slow { animation: marquee-slow 35s linear infinite; }
            `}} />
        </div>
    );
};

const CategoryTile = ({ title, img, onClick }) => (
    <div
        onClick={onClick}
        className="relative h-[600px] flex-1 min-w-[320px] group cursor-pointer overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#0a0a0a] transition-all duration-700 hover:shadow-2xl"
    >
        <img
            src={img}
            alt={title}
            className="w-full h-full object-cover transition-all duration-1000 scale-105 group-hover:scale-110 opacity-40 group-hover:opacity-100"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent flex flex-col justify-end p-10">
            <div className="mb-6">
                <div className="w-16 h-16 rounded-full border border-white/20 flex items-center justify-center backdrop-blur-xl bg-white/5 group-hover:bg-white group-hover:border-white transition-all duration-500">
                    <ArrowUpRight size={32} className="text-white group-hover:text-black transition-colors" strokeWidth={2} />
                </div>
            </div>
            <h3 className="text-white font-black text-6xl tracking-tighter uppercase leading-[0.85] mb-4 italic transition-transform group-hover:-translate-y-2 duration-500">{title}</h3>
            <p className="text-[10px] leading-relaxed text-white/40 font-bold uppercase tracking-wider max-w-[260px] opacity-0 group-hover:opacity-100 transition-all duration-700 translate-y-4 group-hover:translate-y-0">
                Synchronizing the latest archival patterns for the current season.
            </p>
        </div>
    </div>
);
const StandardProductCard = ({ prod, tag }) => {
    const navigate = useNavigate();
    const { toggle, wishlist } = useWishlist();
    const { isAuthenticated } = useSelector((state) => state.userAuth);

    // 1. Unified ID Detection
    const pId = prod._id?.toString();
    const vId = (prod.variantId?._id || prod.variantId || prod.variants?.[0]?._id)?.toString();

    // 2. Normalized Wishlist Check
    // We convert everything to strings to ensure the comparison is 100% accurate
    const isWishlisted = wishlist?.some(p => {
        const wishProductId = (p.productId?._id || p.productId)?.toString();
        const wishVariantId = (p.variantId?._id || p.variantId)?.toString();
        return wishProductId === pId && wishVariantId === vId;
    });

    const handleWishlistToggle = (e) => {
        e.stopPropagation();

        if (!isAuthenticated) {
            return nxToast.security("Access Denied", "Please login to archive items.");
        }

        if (!pId || !vId) {
            return nxToast.security("Protocol Error", "Asset data missing.");
        }

        toggle.mutate({
            productId: pId,
            variantId: vId
        }, {
            // Note: Use destructuring { data } to get the backend response directly
            onSuccess: ({ data }) => {
                // Now data refers to { success: true, action: 'added' }
                if (data.action === 'added') {
                    nxToast.success("Secured in Wishlist", "Item added to your archive manifest.");
                } else {
                    nxToast.success("Removed from Wishlist", "Item removed from your archive.");
                }
            },
            onError: (err) => {
                nxToast.security("Sync Error", err.response?.data?.message || "Communication failed.");
            }
        });
    };

    return (
        <div className="group cursor-pointer" onClick={() => navigate(`/product/${prod._id}`)}>
            <div className="relative aspect-[3/4] mb-6 overflow-hidden rounded-[2rem] bg-white/[0.02] border border-white/5 transition-all duration-500 hover:border-[#7a6af6]/40">
                <img
                    src={prod.thumbnail}
                    alt={prod.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                />

                <div className="absolute top-6 right-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 z-30">
                    <button
                        onClick={handleWishlistToggle}
                        disabled={toggle.isPending}
                        className={`p-4 rounded-2xl shadow-2xl transition-all active:scale-90 border backdrop-blur-md ${isWishlisted
                                ? 'bg-red-500 border-red-500 text-white'
                                : 'bg-white border-white text-black hover:bg-[#7a6af6] hover:border-[#7a6af6] hover:text-white'
                            }`}
                    >
                        {toggle.isPending ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : (
                            <Heart size={18} className={isWishlisted ? "fill-white" : ""} />
                        )}
                    </button>
                </div>

                <div className="absolute bottom-6 left-6 bg-black/60 backdrop-blur-md text-[#7a6af6] text-[8px] font-black px-5 py-2 rounded-full uppercase tracking-[0.2em] border border-white/10 shadow-2xl">
                    {tag}
                </div>
            </div>

            <div className="space-y-2 px-3">
                <div className="flex justify-between items-start">
                    <h4 className="text-[13px] font-black text-white/60 uppercase tracking-tighter truncate italic group-hover:text-white transition-colors">
                        {prod.name}
                    </h4>
                    <ArrowUpRight size={14} className="text-white/10 group-hover:text-[#7a6af6] transition-colors" />
                </div>

                <div className="flex items-center gap-4">
                    <p className="text-[18px] font-black text-[#7a6af6] italic">₹{prod.minSalePrice || prod.minPrice}</p>
                    {prod.minPrice > prod.minSalePrice && (
                        <p className="text-[12px] text-white/20 line-through italic font-bold">₹{prod.minPrice}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Home;