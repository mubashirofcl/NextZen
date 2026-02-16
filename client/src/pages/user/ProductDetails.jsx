import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ShoppingBag, Heart, ChevronRight, Minus, Plus,
    ShieldCheck, Truck, List, AlertCircle, Loader2
} from 'lucide-react';
import Header from '../../components/user/Header';
import Footer from '../../components/user/Footer';
import { useProductDetails } from '../../hooks/user/useProductDetails';
import { useRecommended } from '../../hooks/user/useRecommended';

import { useCart } from '../../hooks/user/useCart';
import { useWishlist } from '../../hooks/user/useWishlist';
import { nxToast } from '../../utils/userToast';
import { useSelector } from 'react-redux';

const ProductDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const imgRef = useRef(null);

    const { data: product, isLoading, error } = useProductDetails(id);
    const { addToCart, cart } = useCart();

    // 🟢 FIXED: Destructured as toggleWishlist and isInWishlist to match your Shop.jsx logic
    const { toggleWishlist, isInWishlist, isPending: wishlistPending } = useWishlist();

    const activeVariants = product?.variants?.filter(v => v.isDeleted === false) || [];

    const { data: recommendedData = [] } = useRecommended(
        product?.subcategory?._id || product?.subcategoryId,
        id
    );

    const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);
    const [selectedSize, setSelectedSize] = useState(null);
    const [activeImg, setActiveImg] = useState(null);
    const [zoomPos, setZoomPos] = useState({ x: 0, y: 0, show: false });
    const [qty, setQty] = useState(1);

    const currentVariant = activeVariants[selectedVariantIdx];
    const isOutOfStock = !selectedSize || selectedSize.stock === 0;

    // --- PROTOCOL: DUPLICATE CHECK ---
    const isAlreadyInCart = cart?.items?.some(item =>
        (item.productId?._id === id || item.productId === id) &&
        (item.variantId?._id === currentVariant?._id || item.variantId === currentVariant?._id) &&
        item.size === selectedSize?.size
    );

    // 🟢 FIXED: Uses helper from hook
    const isWishlisted = isInWishlist(id);

    useEffect(() => {
        if (error || (product && product.isActive === false)) {
            navigate('/shop', { replace: true });
        }
    }, [product, error, navigate]);

    useEffect(() => {
        if (currentVariant) {
            setActiveImg(currentVariant.images[0]);
            const autoSize = currentVariant.sizes.find(s => s.stock > 0) || currentVariant.sizes[0];
            setSelectedSize(autoSize);
            setQty(1);
        }
    }, [selectedVariantIdx, product]);

    useEffect(() => { window.scrollTo(0, 0); }, [id]);

    const handleMouseMove = (e) => {
        if (!imgRef.current) return;
        const { left, top, width, height } = imgRef.current.getBoundingClientRect();
        const x = ((e.pageX - left - window.scrollX) / width) * 100;
        const y = ((e.pageY - top - window.scrollY) / height) * 100;
        setZoomPos({ x, y, show: true });
    };

    const { isAuthenticated } = useSelector((state) => state.userAuth);

    const handleAddToCart = async () => {
        if (!isAuthenticated) {
            return nxToast.security("Access Denied", "Please login to sync this item to your cart.");
        }

        if (!selectedSize) {
            return nxToast.security("Selection Required", "Please choose a dimension before archiving.");
        }

        if (isAlreadyInCart) {
            return nxToast.security("Already Archived", "This variant is already present in your cart manifest.");
        }

        if (qty > selectedSize.stock) {
            return nxToast.security("Warehouse Limit", `Only ${selectedSize.stock} units remain.`);
        }

        try {
            await addToCart.mutateAsync({
                productId: id,
                variantId: currentVariant._id,
                size: selectedSize.size,
                quantity: qty,
                stock: selectedSize.stock,
                price: selectedSize.salePrice || selectedSize.originalPrice
            });

            nxToast.success("Archive Synced", "This item has been secured in your archive.");
        } catch (err) {
            nxToast.security("Sync Error", err.response?.data?.message || "Communication interrupted.");
        }
    };
    const handleWishlistToggle = () => {
        if (!isAuthenticated) {
            return nxToast.security("Access Denied", "Please login to sync wishlist.");
        }

        if (!id || !currentVariant?._id) {
            return nxToast.security("Protocol Error", "Asset identifiers missing.");
        }

        toggleWishlist(id, currentVariant._id);
    };

    if (isLoading) return <div className="h-screen flex items-center justify-center text-[10px] font-black uppercase tracking-[0.5em] text-white/20">Initialising Archive...</div>;
    if (!product || activeVariants.length === 0) return null;

    const salePrice = selectedSize?.salePrice || 0;
    const originalPrice = selectedSize?.originalPrice || 0;
    const discount = originalPrice > salePrice ? Math.round(((originalPrice - salePrice) / originalPrice) * 100) : 0;

    return (
        <div className="relative min-h-screen font-sans text-white pt-16 selection:bg-[#7a6af6]/30">
            <Header />

            <main className="w-full px-4 md:px-8 lg:px-10 py-6 relative z-10">
                {/* 1. BREADCRUMBS */}
                <nav className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.3em] text-white/20 mb-6 pl-1">
                    <span onClick={() => navigate('/')} className="hover:text-white cursor-pointer transition-colors">Home</span>
                    <ChevronRight size={8} />
                    <span onClick={() => navigate('/shop')} className="hover:text-white cursor-pointer transition-colors">Shop</span>
                    <ChevronRight size={8} />
                    <span className="text-[#7a6af6]/60 italic">{product.brand?.name}</span>
                    <ChevronRight size={8} />
                    <span className="opacity-40">{product.name}</span>
                </nav>

                {/* 2. MAIN CONTAINER */}
                <div className="w-full border border-white/10 rounded-[2rem] overflow-hidden backdrop-blur-3xl bg-white/[0.01] flex flex-col lg:flex-row shadow-2xl">

                    {/* LEFT: IMAGE STAGE */}
                    <div className="lg:w-1/2 relative border-b lg:border-b-0 lg:border-r border-white/10 bg-white/[0.01]">
                        <div
                            ref={imgRef}
                            onMouseMove={handleMouseMove}
                            onMouseLeave={() => setZoomPos({ ...zoomPos, show: false })}
                            className="aspect-[4/5] lg:aspect-auto lg:h-[680px] overflow-hidden relative cursor-zoom-in"
                        >
                            <img
                                src={activeImg || currentVariant?.images[0]}
                                alt={product.name}
                                className={`w-full h-full object-cover transition-transform duration-300 pointer-events-none ${zoomPos.show ? 'scale-[2]' : 'scale-100'} ${isOutOfStock ? 'grayscale opacity-40' : ''}`}
                                style={zoomPos.show ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` } : {}}
                            />
                            {isOutOfStock ? (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="bg-red-600 px-6 py-2 rounded font-black text-[10px] tracking-[0.3em] uppercase italic shadow-2xl border border-white/10">Sold Out</div>
                                </div>
                            ) : discount > 0 && (
                                <div className="absolute top-6 left-6 bg-[#7a6af6] px-3 py-1 rounded text-[9px] font-black italic shadow-2xl">
                                    -{discount}% DROP
                                </div>
                            )}
                        </div>

                        <div className="absolute bottom-6 left-6 flex gap-2">
                            {currentVariant?.images.map((img, i) => (
                                <button key={i} onClick={() => setActiveImg(img)} className={`w-12 h-14 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${activeImg === img ? 'border-[#7a6af6] scale-105 shadow-xl' : 'border-white/10 opacity-30 hover:opacity-100'}`}>
                                    <img src={img} alt="" className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT: DETAILS */}
                    <div className="lg:w-1/2 p-8 lg:p-14 flex flex-col justify-center">
                        <div className="space-y-6">
                            <header className="space-y-2">
                                <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.3em] text-white/30">
                                    <span className="text-[#7a6af6]">{product.brand?.name}</span>
                                    <span>/</span>
                                    <span>{product.subcategory?.name}</span>
                                </div>
                                <h1 className="text-3xl font-black uppercase tracking-tight italic">{product.name}</h1>
                                <div className="flex items-baseline gap-4">
                                    <span className={`text-4xl font-black italic ${isOutOfStock ? 'text-white/10' : ''}`}>₹{salePrice.toLocaleString()}</span>
                                    {originalPrice > salePrice && !isOutOfStock && (
                                        <span className="text-sm text-white/20 line-through font-bold italic opacity-50">₹{originalPrice.toLocaleString()}</span>
                                    )}
                                </div>
                            </header>

                            {/* SELECTION GRID */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6 border-y border-white/5">
                                <div className="space-y-4">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-white/30 italic">Color: {currentVariant?.color}</p>
                                    <div className="flex gap-2.5">
                                        {activeVariants.map((v, i) => (
                                            <button
                                                key={v._id || i}
                                                onClick={() => setSelectedVariantIdx(i)}
                                                className={`w-7 h-7 rounded-full border transition-all ${selectedVariantIdx === i ? 'border-[#7a6af6] ring-2 ring-[#7a6af6]/20 shadow-lg' : 'border-white/10'}`}
                                                style={{ backgroundColor: v.hex }}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-white/30 italic">Dimensions</p>
                                        <span className={`text-[8px] uppercase font-black ${selectedSize?.stock === 0 ? 'text-red-500' : 'text-[#7a6af6]'}`}>
                                            {selectedSize?.stock === 0 ? 'Depleted' : `${selectedSize?.stock} Units`}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {currentVariant?.sizes.map((s, i) => (
                                            <button
                                                key={i}
                                                disabled={s.stock === 0}
                                                onClick={() => setSelectedSize(s)}
                                                className={`w-10 h-9 flex items-center justify-center text-[10px] font-black rounded border transition-all ${selectedSize?.size === s.size ? 'bg-[#7a6af6] border-[#7a6af6] text-white' : 'border-white/10 text-white/40 bg-white/[0.01]'} ${s.stock === 0 ? 'opacity-20 cursor-not-allowed border-red-500/30 text-red-500' : ''}`}
                                            >
                                                {s.size}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <p className="text-[8px] font-black uppercase tracking-widest text-[#7a6af6] flex items-center gap-2"><List size={10} /> Highlights</p>
                                <ul className="grid grid-cols-2 gap-y-2 gap-x-4">
                                    {product.highlights?.map((h, i) => (
                                        <li key={i} className="text-[9px] text-white/60 font-bold uppercase flex items-center gap-2">
                                            <div className="w-1 h-1 bg-[#7a6af6] rounded-full shrink-0" /> {h}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="space-y-4 pt-4">
                                <div className="flex gap-2 h-12">
                                    <div className={`flex items-center bg-white/[0.03] border border-white/5 rounded-lg px-4 gap-4 ${isOutOfStock || isAlreadyInCart ? 'opacity-10 pointer-events-none' : ''}`}>
                                        <button onClick={() => setQty(q => Math.max(1, q - 1))} className="text-white/20 hover:text-white transition-colors"><Minus size={14} /></button>
                                        <span className="text-[10px] font-black w-3 text-center italic">{qty}</span>
                                        <button onClick={() => setQty(q => Math.min(selectedSize?.stock || 1, Math.min(5, q + 1)))} className="text-white/20 hover:text-white transition-colors"><Plus size={14} /></button>
                                    </div>

                                    <button
                                        onClick={handleAddToCart}
                                        disabled={isOutOfStock || addToCart.isPending}
                                        className={`flex-1 rounded-lg font-black uppercase tracking-[0.1em] text-[10px] transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg ${isOutOfStock ? 'bg-red-500/10 text-red-500 border border-red-500/20' : isAlreadyInCart ? 'bg-zinc-800 text-white/40 border border-white/5' : 'bg-[#7a6af6] text-white hover:bg-[#6858e0] shadow-[#7a6af6]/10'}`}
                                    >
                                        {addToCart.isPending ? <Loader2 size={16} className="animate-spin" /> : isOutOfStock ? "Archive Empty" : isAlreadyInCart ? <><ShieldCheck size={16} /> In Archive</> : <><ShoppingBag size={16} /> Commit To Archive</>}
                                    </button>

                                    <button
                                        onClick={handleWishlistToggle}
                                        disabled={wishlistPending}
                                        className={`w-12 h-12 border rounded-lg flex items-center justify-center transition-all group ${isWishlisted ? 'border-red-500/50 bg-red-500/10 text-red-500' : 'border-white/10 text-white/20 hover:text-red-400 hover:bg-white/[0.02]'}`}
                                    >
                                        {wishlistPending ? <Loader2 size={18} className="animate-spin" /> : <Heart size={18} className={isWishlisted ? "fill-red-500" : "group-hover:fill-red-400"} />}
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.01] border border-white/5">
                                        <ShieldCheck size={14} className="text-[#7a6af6]" />
                                        <span className="text-[8px] font-black uppercase text-white/40 italic">Authentic Spec</span>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.01] border border-white/5">
                                        <Truck size={14} className="text-[#7a6af6]" />
                                        <span className="text-[8px] font-black uppercase text-white/40 italic">Archive Logistics</span>
                                    </div>
                                </div>

                                <p className="text-[10px] text-white/30 leading-relaxed font-medium italic line-clamp-3 hover:line-clamp-none transition-all duration-500">{product.description}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. RELATED PRODUCTS */}
                <section className="mt-20 space-y-10">
                    <div className="flex justify-between items-end border-b border-white/5 pb-4 px-1">
                        <h2 className="text-2xl font-black uppercase tracking-tighter italic">Related Archive</h2>
                        <span className="text-[8px] font-black uppercase tracking-[0.4em] text-white/20">Discovery 2026</span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {recommendedData.map((rec) => (
                            <div key={rec._id} onClick={() => navigate(`/product/${rec._id}`)} className="group cursor-pointer space-y-2">
                                <div className="aspect-[3/4] bg-white/[0.02] rounded-xl overflow-hidden border border-white/5 relative transition-all duration-500 group-hover:border-[#7a6af6]/40">
                                    <img src={rec.thumbnail} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-100" alt={rec.name} />
                                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/90 to-transparent" />
                                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: rec.hex }} />
                                    <div className="absolute bottom-2 left-0 right-0 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <p className="text-[11px] font-black italic text-white">₹{rec.minSalePrice}</p>
                                    </div>
                                </div>
                                <div className="text-center px-1">
                                    <h3 className="text-[9px] font-black uppercase tracking-widest text-white/40 group-hover:text-[#7a6af6] transition-colors truncate italic">{rec.name}</h3>
                                    <p className="text-[7px] font-bold uppercase tracking-[0.2em] text-white/10 italic">{rec.color}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
};

export default ProductDetails;