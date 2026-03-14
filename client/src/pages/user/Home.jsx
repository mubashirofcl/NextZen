import React, { useState, useEffect } from 'react';
import { Star, ArrowUpRight, ArrowRight, Loader2, Heart, Percent, CheckCircle, Sparkles, Banknote, Palette, ShieldCheck, Ticket, Play, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/user/Header';
import Footer from '../../components/user/Footer';
import { useProducts } from "../../hooks/user/useProducts";
import { useUserCategories } from '../../hooks/user/useUserCategories';
import { useSelector } from 'react-redux';
import { nxToast } from '../../utils/userToast';
import { useWishlist } from '../../hooks/user/useWishlist';
import userAxios from '../../api/baseAxios';

const NewCollectionRib = ({ rotation, top, text = "NEW ARRIVALS" }) => (
    <div
        className="absolute w-[200%] py-4 md:py-4 bg-[#8676ff] flex overflow-hidden whitespace-nowrap border-y border-black/20 z-20 shadow-[0_20px_50px_rgba(0,0,0,0.4)] select-none pointer-events-none"
        style={{ transform: `rotate(${rotation}deg)`, top: top, left: '-50%' }}
    >
        <div className="animate-marquee-slow flex items-center">
            {[...Array(15)].map((_, i) => (
                <span key={i} className="text-black font-black text-[16px] md:text-[24px] italic tracking-tighter mx-8 flex items-center gap-6">
                    {text} <div className="w-2 h-2 bg-black rounded-full" />
                </span>
            ))}
        </div>
    </div>
);

const Home = () => {
    const navigate = useNavigate();
    const { data: categories = [], isLoading: catLoading } = useUserCategories();
    const { data: featuredData } = useProducts({ limit: 4, isFeatured: true });
    const { data: freshData } = useProducts({ limit: 8, sort: "createdAt" });
    const [latestCoupon, setLatestCoupon] = useState(null);
    const [currentHeroIndex, setCurrentHeroIndex] = useState(0);

    const referenceStyles = `

        .vertical-text {
            writing-mode: vertical-rl;
            text-orientation: mixed;
        }
        .text-outline-white {
            -webkit-text-stroke: 1px white;
            color: transparent;
        }
    `;

    const heroImages = [
        "/hero_model.png",
        "/hero_model_2.png",
        "/hero_model_3.png"
    ];

    const adminHeroBanner = "https://images.unsplash.com/photo-1507680434567-5739c80be1ac?q=80&w=2000";
    const adminOfferBanner = "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=2000";

    const featuredProducts = featuredData?.products || [];
    const freshArrivals = freshData?.products || [];

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentHeroIndex((prev) => (prev + 1) % heroImages.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [heroImages.length]);

    useEffect(() => {
        const fetchPromo = async () => {
            try {
                const { data } = await userAxios.get("/users/coupons/available");
                if (data.success && data.coupons.length > 0) {
                    setLatestCoupon(data.coupons[0]);
                }
            } catch (err) {
                console.error("Coupon Sync Error");
            }
        };
        fetchPromo();
    }, []);

    const copyCode = (code) => {
        navigator.clipboard.writeText(code);
        nxToast.success("Code Copied", "Apply it at checkout for a discount.");
    };

    return (
        <div className="relative min-h-screen font-sans text-white selection:bg-[#7a6af6]/20 overflow-x-hidden">
            <style dangerouslySetInnerHTML={{ __html: referenceStyles }} />
            <Header />

            <section className="relative w-full h-screen flex items-center justify-center overflow-hidden mb-20 md:mb-24">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
                    <h2 className="text-[24vw] font-[900] text-[#7a6af6] select-none tracking-tighter uppercase whitespace-nowrap leading-none opacity-100 animate-fade-in transition-all duration-1000">
                        NEXTZEN
                    </h2>
                </div>

                <div className="relative z-20 flex justify-center items-center h-full w-full animate-fade-in-up">
                    <div className="relative w-[70vw] md:w-[320px] aspect-[9/15.5] rounded-[3rem] md:rounded-[4rem] overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.8)] ring-1 ring-white/5 group transition-all duration-500 hover:shadow-[0_60px_100px_rgba(224,31,31,0.2)]">
                        <video
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                        >
                            <source src="https://d3kspkscsewpy5.cloudfront.net/promo-video.mp4" type="video/mp4" />
                        </video>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                        <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[#7a6af6]/20 to-transparent opacity-60 pointer-events-none" />
                    </div>
                </div>

                <div className="absolute inset-0 z-30 flex flex-col justify-between p-6 md:p-14 pointer-events-none">
                    <div className="max-w-2xl mt-4 md:mt-10 animate-fade-in-up">
                        <h1 className="text-[clamp(2.5rem,7vw,5.5rem)] font-black uppercase tracking-tighter leading-[0.85] text-white">
                            Watch. <br />
                            Shop. Own.
                        </h1>
                    </div>

                    <div className="flex flex-col md:flex-row items-end justify-between w-full h-auto mb-4 md:mb-6">
                        <div className="max-w-xs mb-8 md:mb-0 animate-fade-in-up delay-200">
                            <p className="text-[9px] md:text-[11px] text-white/50 font-normal leading-relaxed tracking-tight lowercase">
                                welcome to nextzen — the next-gen social <br />
                                marketplace powered by innovation. seamlessly <br />
                                scroll through content, shop what you see, and <br />
                                own your experience — all in one app.
                            </p>
                        </div>

                        <div className="flex flex-col md:flex-row gap-3 pointer-events-auto animate-fade-in-up delay-400">
                            <button
                                onClick={() => navigate('/shop')}
                                className="group relative w-[180px] h-14 bg-white rounded-xl border border-white/5 transition-all hover:border-[#7a6af6]/40 overflow-hidden"
                            >
                                <div className="absolute inset-x-0 bottom-0 h-[1px] bg-[#7a6af6] opacity-50 shadow-[0_0_15px_#7a6af6]" />
                                <div className="flex items-center gap-3 px-5">
                                    <div className="w-8 h-8 flex items-center justify-center">
                                        <ShoppingBag size={18} className="text-black opacity-40 group-hover:text-[#7a6af6] group-hover:opacity-100 transition-all" />
                                    </div>
                                    <div className="flex flex-col items-start leading-tight">
                                        <span className="text-[7px] font-bold text-black/40 uppercase tracking-widest">LATEST DROP</span>
                                        <span className="text-[13px] font-black text-black tracking-tighter">Shop Now</span>
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => navigate('/shop')}
                                className="group relative w-[180px] h-14 bg-white rounded-xl border border-white/5 transition-all hover:border-[#7a6af6]/40 overflow-hidden"
                            >
                                <div className="absolute inset-x-0 bottom-0 h-[1px] bg-[#7a6af6] opacity-50 shadow-[0_0_15px_#7a6af6]" />
                                <div className="flex items-center gap-3 px-5">
                                    <div className="w-8 h-8 flex items-center justify-center">
                                        <ArrowUpRight size={18} className="text-black opacity-40 group-hover:text-[#7a6af6] group-hover:opacity-100 transition-all" />
                                    </div>
                                    <div className="flex flex-col items-start leading-tight">
                                        <span className="text-[7px] font-bold text-black/40 uppercase tracking-widest">ARCHIVE 26</span>
                                        <span className="text-[13px] font-black text-black tracking-tighter">Explore Now</span>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </section>
            <main className="max-w-[1600px] mx-auto px-6 md:px-12 relative z-10">

                <section className="w-full mb-40">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        {!catLoading && categories.slice(0, 3).map((cat, index) => (
                            <CategoryEditorialTile
                                key={cat._id}
                                title={cat.name}
                                description={cat.description || "Premium seasonal pieces designed for bold identities."}
                                modelName={"EXPLORE NOW"}
                                onClick={() => navigate(`/shop?category=${cat._id}`)}
                            />
                        ))}
                    </div>
                </section>

                <section className="mb-40">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-16 border-b border-white/10 pb-10">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <Sparkles size={16} className="text-[#7a6af6] animate-pulse" />
                                <span className="text-[#7a6af6] text-[11px] font-black uppercase tracking-[0.5em]">Curated Picks</span>
                            </div>
                            <h3 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic leading-none">Featured Styles</h3>
                        </div>
                        <button onClick={() => navigate('/shop')} className="group flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-white transition-all">
                            View All Items <ArrowRight size={18} />
                        </button>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10">
                        {featuredProducts.map((prod) => (
                            <StandardProductCard key={prod._id} prod={prod} tag="Bestseller" />
                        ))}
                    </div>
                </section>

                <section className="max-w-[1440px] mx-auto border-t border-white/10 pt-20 grid grid-cols-1 md:grid-cols-3 gap-16 mb-40">
                    <div className="flex flex-col items-center text-center space-y-4 group">
                        <div className="w-16 h-16 rounded-full bg-[#111] flex items-center justify-center group-hover:bg-[#7a6af6] transition-all duration-500 shadow-xl border border-white/5">
                            <Palette className="text-white" size={28} />
                        </div>
                        <h3 className="text-sm font-black uppercase tracking-[0.2em] italic">Exclusive Collabs</h3>
                        <p className="text-[10px] text-white/40 uppercase tracking-widest leading-relaxed max-w-[250px]">
                            Collaborations with iconic artists and illustrators on premium fabrics.
                        </p>
                    </div>

                    <div className="flex flex-col items-center text-center space-y-4 group">
                        <div className="w-16 h-16 rounded-full bg-[#111] flex items-center justify-center group-hover:bg-[#7a6af6] transition-all duration-500 shadow-xl border border-white/5">
                            <Banknote className="text-white" size={28} />
                        </div>
                        <h3 className="text-sm font-black uppercase tracking-[0.2em] italic">Honest Pricing</h3>
                        <p className="text-[10px] text-white/40 uppercase tracking-widest leading-relaxed max-w-[250px]">
                            Direct shop access ensuring luxury quality without the traditional high markups.
                        </p>
                    </div>

                    <div className="flex flex-col items-center text-center space-y-4 group">
                        <div className="w-16 h-16 rounded-full bg-[#111] flex items-center justify-center group-hover:bg-[#7a6af6] transition-all duration-500 shadow-xl border border-white/5">
                            <ShieldCheck className="text-white" size={28} />
                        </div>
                        <h3 className="text-sm font-black uppercase tracking-[0.2em] italic">Guaranteed Quality</h3>
                        <p className="text-[10px] text-white/40 uppercase tracking-widest leading-relaxed max-w-[250px]">
                            Meticulous attention to every stitch, seam, and detail in every piece we drop.
                        </p>
                    </div>
                </section>

                <section className="w-full mb-40 px-2">

                    <div className="relative min-h-[400px] md:h-[550px] rounded-[2rem] md:rounded-[3.5rem] overflow-hidden group border border-white/5 shadow-2xl bg-black">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#7a6af6] via-[#4f46e5]/40 to-black opacity-90 z-10" />
                        <img
                            src={adminOfferBanner}
                            className="absolute inset-0 w-full h-full object-cover grayscale mix-blend-overlay group-hover:scale-105 transition-transform duration-[3s]"
                            alt="Promotion"
                        />

                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center p-8 md:p-12">
                            <div className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-6 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.4em] mb-8 flex items-center gap-2">
                                <Sparkles size={12} className="text-[#7a6af6]" />
                                Limited Protocol
                            </div>

                            {latestCoupon ? (
                                <>
                                    <h2 className="text-5xl md:text-[8rem] font-black italic uppercase tracking-tighter leading-[0.9] mb-4 drop-shadow-2xl">
                                        GET <span className="text-transparent text-outline-white">
                                            {latestCoupon.discountValue}{latestCoupon.discountType === 'PERCENT' ? '%' : ' OFF'}
                                        </span>
                                    </h2>
                                    <p className="text-[11px] md:text-[13px] font-black uppercase tracking-[0.6em] text-white/60 mb-10 italic">
                                        MINIMUM PURCHASE: ₹{latestCoupon.minPurchaseAmt} // WINTER 2026
                                    </p>

                                    <div className="flex flex-col items-center gap-6">
                                        <div className="bg-white/5 border border-white/10 backdrop-blur-xl p-1 rounded-2xl flex items-center gap-4 pr-6 group/code">
                                            <div className="bg-white text-black px-6 py-3 rounded-xl font-black text-xl tracking-tighter italic">
                                                {latestCoupon.code}
                                            </div>
                                            <button
                                                onClick={() => copyCode(latestCoupon.code)}
                                                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-[#7a6af6] transition-colors"
                                            >
                                                <Ticket size={14} /> Copy Code
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => navigate('/shop')}
                                            className="bg-[#7a6af6] text-white px-14 py-5 rounded-full font-black uppercase text-[12px] tracking-[0.2em] hover:bg-white hover:text-black transition-all shadow-xl active:scale-95"
                                        >
                                            Shop with Discount
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <h2 className="text-5xl md:text-[9rem] font-black italic uppercase tracking-tighter leading-none mb-6">
                                        SEASON <span className="text-transparent text-outline-white">OFF 40%</span>
                                    </h2>
                                    <button onClick={() => navigate('/shop')} className="bg-white text-black px-14 py-5 rounded-full font-black uppercase text-[12px] tracking-[0.2em] hover:bg-[#7a6af6] hover:text-white transition-all">
                                        Explore Drop
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </section>

                <section className="pb-32">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-20 gap-8">
                        <h3 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic">Latest Drops</h3>
                        <button onClick={() => navigate('/shop')} className="px-12 py-4 bg-[#7a6af6] text-white rounded-full text-[11px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all shadow-2xl active:scale-95">Shop All New</button>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10 relative z-10">
                        {freshArrivals.map((prod) => (
                            <StandardProductCard key={prod._id} prod={prod} tag="New" />
                        ))}
                    </div>
                </section>

            </main>

            <Footer />

            <style dangerouslySetInnerHTML={{
                __html: `
                .text-outline-white { -webkit-text-stroke: 1px rgba(255,255,255,1); }
                .text-outline-black { -webkit-text-stroke: 1px rgba(0,0,0,1); }
                @media (min-width: 768px) { 
                    .text-outline-white { -webkit-text-stroke: 1.5px rgba(255,255,255,1); } 
                    .text-outline-black { -webkit-text-stroke: 1.5px rgba(0,0,0,1); } 
                }
                @keyframes marquee-slow { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
                .animate-marquee-slow { animation: marquee-slow 45s linear infinite; }
                @keyframes slow-zoom { 0% { transform: scale(1); } 100% { transform: scale(1.1); } }
                .animate-slow-zoom { animation: slow-zoom 20s ease-in-out infinite alternate; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in { animation: fadeIn 1.5s ease-out forwards; }
                
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in-up { animation: fadeInUp 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
                
                @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-15px); } 100% { transform: translateY(0px); } }
                .animate-float { animation: float 6s ease-in-out infinite; }
                
                .delay-100 { animation-delay: 100ms; }
                .delay-200 { animation-delay: 200ms; }
                .delay-300 { animation-delay: 400ms; }
                .delay-400 { animation-delay: 600ms; }
            `}} />
        </div>
    );
};

const CategoryEditorialTile = ({ title, modelName, description, onClick }) => (
    <div
        onClick={onClick}
        className="relative group cursor-pointer h-[420px] overflow-hidden rounded-[2.5rem] border border-white/5 transition-all duration-700 hover:border-[#7a6af6]/40 hover:shadow-[0_0_50px_rgba(122,106,246,0.15)]"
    >
        <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#7a6af6]/10 blur-[100px] rounded-full group-hover:bg-[#7a6af6]/20 transition-colors duration-700" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-[#FF3D00]/5 blur-[100px] rounded-full group-hover:bg-[#FF3D00]/10 transition-colors duration-700" />
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[20rem] font-black italic text-white/[0.02] select-none uppercase transition-all duration-1000 group-hover:text-white/[0.04] group-hover:scale-110">
                {title.charAt(0)}
            </span>
        </div>

        <div className="relative h-full p-10 flex flex-col justify-between z-10">
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="h-px w-8 bg-[#7a6af6]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#7a6af6]">Category // {title}</span>
                </div>
                <h3 className="text-5xl font-black uppercase italic leading-none tracking-tighter text-white drop-shadow-2xl">{title}</h3>
                <p className="text-[11px] font-medium text-white/30 uppercase tracking-[0.15em] leading-relaxed max-w-[220px] transition-colors group-hover:text-white/60">{description}</p>
            </div>
            <div className="relative">
                <div className="bg-white text-black p-6 rounded-[2rem] shadow-[0_20px_40px_rgba(0,0,0,0.4)] flex justify-between items-center transition-all duration-500 transform group-hover:-translate-y-2 group-hover:scale-[1.02]">
                    <div className="space-y-1">
                        <p className="text-[8px] font-black opacity-30 uppercase tracking-[0.2em] leading-none">Quick View</p>
                        <h4 className="text-[15px] font-black uppercase italic leading-none tracking-tight">{modelName}</h4>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center transition-all duration-500 group-hover:bg-[#7a6af6] shadow-lg">
                        <ArrowUpRight size={22} className="text-white transition-transform duration-500 group-hover:rotate-45" strokeWidth={2.5} />
                    </div>
                </div>
                <div className="absolute inset-0 bg-[#7a6af6] rounded-[2rem] -z-10 translate-y-2 blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-700" />
            </div>
        </div>
    </div>
);

const StandardProductCard = ({ prod, tag }) => {
    const navigate = useNavigate();
    const { toggleWishlist, isInWishlist, isPending } = useWishlist();
    const { isAuthenticated } = useSelector((state) => state.userAuth);

    const pId = prod._id?.toString();
    const vId = (prod.variantId || prod.variants?.[0]?._id || pId)?.toString();
    const isWishlisted = isInWishlist(pId);

    const handleWishlistToggle = (e) => {
        e.stopPropagation();
        if (!isAuthenticated) return nxToast.security("Access Restricted", "Please login to save items.");
        if (!pId || !vId) return;
        toggleWishlist(pId, vId);
    };

    return (
        <div className="group cursor-pointer" onClick={() => navigate(`/product/${pId}`)}>
            <div className="relative aspect-[3.2/4] mb-8 overflow-hidden rounded-[2.5rem] bg-white/[0.03] border border-white/5 transition-all duration-700 hover:border-[#7a6af6]/50">
                <img src={prod.thumbnail} alt={prod.name} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-500 scale-90 group-hover:scale-100">
                    <button
                        onClick={handleWishlistToggle}
                        disabled={isPending}
                        className={`p-4 rounded-2xl backdrop-blur-xl border shadow-2xl transition-all active:scale-90 ${isWishlisted ? 'bg-red-500 border-red-500 text-white' : 'bg-white/10 border-white/10 text-white hover:bg-white hover:text-black'}`}
                    >
                        {isPending ? <Loader2 size={18} className="animate-spin" /> : <Heart size={18} fill={isWishlisted ? "white" : "none"} strokeWidth={2.5} />}
                    </button>
                </div>
                <div className="absolute bottom-6 left-6 bg-black/40 backdrop-blur-md text-[#7a6af6] text-[9px] font-black px-5 py-2 rounded-full uppercase tracking-widest border border-white/10">{tag}</div>
            </div>
            <div className="space-y-3 px-4">
                <h4 className="text-[15px] font-black text-white/70 uppercase tracking-tighter italic group-hover:text-white transition-colors truncate">{prod.name}</h4>
                <div className="flex items-center gap-4">
                    <p className="text-[22px] font-black italic tracking-tighter text-white">₹{(prod.minSalePrice || prod.minPrice)?.toLocaleString()}</p>
                    {prod.discountValue > 0 && <span className="text-[11px] font-black text-[#7a6af6] italic">-{prod.discountValue}%</span>}
                </div>
            </div>
        </div>
    );
};

export default Home;