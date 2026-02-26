import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ShoppingBag, Heart, ChevronRight, Minus, Plus,
    ShieldCheck, Truck, List, Loader2,
    Sparkles, X, Send, MessageSquare, Bot,
    Palette,
    Banknote
} from 'lucide-react';
import Header from '../../components/user/Header';
import Footer from '../../components/user/Footer';
import { useProductDetails } from '../../hooks/user/useProductDetails';
import { useRecommended } from '../../hooks/user/useRecommended';
import { useCart } from '../../hooks/user/useCart';
import { useWishlist } from '../../hooks/user/useWishlist';
import { nxToast } from '../../utils/userToast';
import { useSelector } from 'react-redux';
import { askStyleAssistant } from '../../api/user/chatbotApi';

const ProductDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const imgRef = useRef(null);
    const chatEndRef = useRef(null);
    const chatCache = useRef({});

    const { data: product, isLoading, error } = useProductDetails(id);
    const { addToCart, cart } = useCart();
    const { toggleWishlist, isInWishlist, isPending: wishlistPending } = useWishlist();
    const { isAuthenticated } = useSelector((state) => state.userAuth);

    const activeVariants = product?.variants?.filter(v => v.isDeleted === false) || [];
    const { data: recommendedData = [] } = useRecommended(product?.subcategory?._id || product?.subcategoryId, id);

    const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);
    const [selectedSize, setSelectedSize] = useState(null);
    const [activeImg, setActiveImg] = useState(null);
    const [zoomPos, setZoomPos] = useState({ x: 0, y: 0, show: false });
    const [qty, setQty] = useState(1);

    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatInput, setChatInput] = useState("");
    const [chatHistory, setChatHistory] = useState([]);
    const [isAITyping, setIsAITyping] = useState(false);
    const [showNudge, setShowNudge] = useState(false);

    const currentVariant = activeVariants[selectedVariantIdx];
    const isOutOfStock = !selectedSize || selectedSize.stock === 0;

    const isAlreadyInCart = cart?.items?.some(item =>
        (item.productId?._id === id || item.productId === id) &&
        (item.variantId?._id === currentVariant?._id || item.variantId === currentVariant?._id) &&
        item.size === selectedSize?.size
    );

    const isWishlisted = isInWishlist(id);

    const quickSuggestions = useMemo(() => {
        if (!product) return [];
        const base = ["Is this in stock?", "Any active offers?"];
        const category = product.categoryId?.name?.toLowerCase() || "";
        if (category.includes('hoodie') || category.includes('shirt') || category.includes('top')) {
            return [...base, "What's the fit like?", "Styling tips?"];
        }
        return [...base, "How do I style this?"];
    }, [product]);

    useEffect(() => {
        if (error || (product && product.isActive === false)) navigate('/shop', { replace: true });
    }, [product, error, navigate]);

    useEffect(() => {
        if (currentVariant) {
            setActiveImg(currentVariant.images[0]);
            const autoSize = currentVariant.sizes.find(s => s.stock > 0) || currentVariant.sizes[0];
            setSelectedSize(autoSize);
            setQty(1);
        }
    }, [selectedVariantIdx, product]);

    useEffect(() => {
        window.scrollTo(0, 0);
        setChatHistory([]);
        setShowNudge(false);
        const timer = setTimeout(() => setShowNudge(true), 10000);
        return () => clearTimeout(timer);
    }, [id]);

    useEffect(() => {
        if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }, [chatHistory, isAITyping]);

    useEffect(() => {
        if (isChatOpen) setShowNudge(false);
    }, [isChatOpen]);


    const handleMouseMove = (e) => {
        if (!imgRef.current) return;
        const { left, top, width, height } = imgRef.current.getBoundingClientRect();
        const x = ((e.pageX - left - window.scrollX) / width) * 100;
        const y = ((e.pageY - top - window.scrollY) / height) * 100;
        setZoomPos({ x, y, show: true });
    };

    const handleAddToCart = async () => {
        if (!isAuthenticated) return nxToast.security("Access Denied", "Please login to sync this item.");
        if (!selectedSize) return nxToast.security("Selection Required", "Choose a dimension.");
        if (isAlreadyInCart) return nxToast.security("Already Archived", "Item in manifest.");
        if (qty > selectedSize.stock) return nxToast.security("Warehouse Limit", `Only ${selectedSize.stock} units left.`);

        try {
            await addToCart.mutateAsync({
                productId: id,
                variantId: currentVariant._id,
                size: selectedSize.size,
                quantity: qty,
                stock: selectedSize.stock,
                price: selectedSize.salePrice || selectedSize.originalPrice
            });
            nxToast.success("Archive Synced", "Secured in your archive.");
        } catch (err) {
            nxToast.security("Sync Error", err.response?.data?.message || "Interrupted.");
        }
    };

    const handleWishlistToggle = () => {
        if (!isAuthenticated) return nxToast.security("Access Denied", "Please login.");
        toggleWishlist(id, currentVariant._id);
    };

    const handleAskAI = async (overrideMessage = null) => {
        const messageToSend = (overrideMessage || chatInput).trim();
        if (!messageToSend || isAITyping) return;

        if (!isAuthenticated) {
            setChatHistory(prev => [...prev, {
                role: 'model',
                text: "I'd love to help, but you need to be logged in to access the Concierge! ✨"
            }]);
            return;
        }

        const cacheKey = `${id}-${messageToSend.toLowerCase()}`;
        if (chatCache.current[cacheKey]) {
            setChatHistory(prev => [...prev,
            { role: 'user', text: messageToSend },
            { role: 'model', text: chatCache.current[cacheKey] }
            ]);
            return;
        }

        setChatHistory(prev => [...prev, { role: 'user', text: messageToSend }]);
        setChatInput("");
        setIsAITyping(true);

        try {
            const slidingHistory = chatHistory.slice(-4);
            const data = await askStyleAssistant(id, messageToSend, slidingHistory);
            if (data.success) {
                chatCache.current[cacheKey] = data.reply;
                setChatHistory(prev => [...prev, { role: 'model', text: data.reply }]);
            }
        } catch (err) {
            setChatHistory(prev => [...prev, {
                role: 'model',
                text: "My neural link is flickering. Try again in a minute."
            }]);
        } finally {
            setIsAITyping(false);
        }
    };

    if (isLoading) return <div className="h-screen flex items-center justify-center text-[10px] font-black uppercase tracking-[0.5em] text-white/20 animate-pulse">Initialising Archive...</div>;
    if (!product || activeVariants.length === 0) return null;

    const salePrice = selectedSize?.salePrice || 0;
    const originalPrice = selectedSize?.originalPrice || 0;
    const discount = originalPrice > salePrice ? Math.round(((originalPrice - salePrice) / originalPrice) * 100) : 0;

    return (
        <div className="relative min-h-screen font-sans text-white pt-16 selection:bg-[#7a6af6]/30 overflow-x-hidden">
            <Header />

            <div className={`fixed inset-y-0 right-0 w-full sm:w-[420px] z-[110] transform transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${isChatOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="h-[96vh] my-[2vh] mr-[1vw] w-full bg-black/40 backdrop-blur-2xl border border-white/10 flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.5)] rounded-[2.5rem] overflow-hidden">
                    <div className="p-6 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="p-2 bg-[#7a6af6] rounded-xl shadow-[0_0_15px_rgba(122,106,246,0.3)]">
                                    <Sparkles size={18} className="text-white" />
                                </div>
                                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-black" />
                            </div>
                            <div>
                                <h3 className="text-[12px] font-bold uppercase tracking-widest text-white/90">Style Concierge</h3>
                                <p className="text-[8px] font-medium text-[#7a6af6] uppercase tracking-[0.2em] mt-1 animate-pulse">Neural Link Active</p>
                            </div>
                        </div>
                        <button onClick={() => setIsChatOpen(false)} className="group p-2 hover:bg-white/10 rounded-full transition-all">
                            <X size={20} className="text-white/40 group-hover:text-white transition-all" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar relative">
                        {chatHistory.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30">
                                <MessageSquare size={32} strokeWidth={1} className="text-white" />
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold uppercase tracking-widest">System Ready</p>
                                    <p className="text-[9px] font-medium max-w-[180px] leading-relaxed">Ask about sizing, styling, or stock.</p>
                                </div>
                            </div>
                        )}

                        {chatHistory.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-400`}>
                                <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-[13px] font-medium leading-relaxed tracking-wide ${msg.role === 'user' ? 'bg-[#7a6af6] text-white rounded-tr-none' : 'bg-white/5 border border-white/10 text-white/90 rounded-tl-none shadow-xl'}`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}

                        {isAITyping && (
                            <div className="flex justify-start">
                                <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-2xl rounded-tl-none">
                                    <div className="flex gap-1.5">
                                        <div className="w-1 h-1 bg-[#7a6af6] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-1 h-1 bg-[#7a6af6] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-1 h-1 bg-[#7a6af6] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {!isAITyping && chatHistory.length < 6 && (
                        <div className="px-6 py-4 flex flex-wrap gap-2">
                            {quickSuggestions.map((chip, i) => (
                                <button key={i} onClick={() => handleAskAI(chip)} className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-[9px] font-bold uppercase tracking-wider text-white/50 hover:border-[#7a6af6]/50 hover:text-white hover:bg-[#7a6af6]/10 transition-all">
                                    {chip}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="p-6 bg-white/[0.02] border-t border-white/5">
                        <div className="relative group">
                            <input
                                type="text"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
                                placeholder="Type a message..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 pr-14 text-[13px] text-white outline-none focus:border-[#7a6af6]/50 transition-all"
                            />
                            <button onClick={() => handleAskAI()} disabled={isAITyping || !chatInput.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-[#7a6af6] text-white rounded-lg hover:scale-105 transition-all disabled:opacity-20">
                                <Send size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {showNudge && !isChatOpen && chatHistory.length === 0 && (
                <div className="fixed bottom-28 right-10 z-[100] animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="relative group">
                        <div className="bg-black/60 backdrop-blur-2xl border border-white/10 p-4 rounded-3xl shadow-2xl flex items-center gap-4 max-w-[240px] relative">
                            <button
                                onClick={() => setShowNudge(false)}
                                className="absolute -top-2 -right-2 w-5 h-5 bg-zinc-900 border border-white/10 rounded-full flex items-center justify-center text-white/30 hover:text-white transition-all"
                            >
                                <X size={10} />
                            </button>

                            <div className="w-10 h-10 shrink-0 bg-[#7a6af6] rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(122,106,246,0.3)] animate-bounce">
                                <Bot size={20} className="text-white" />
                            </div>

                            <div className="space-y-0.5">
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/90 italic">Style Query?</p>
                                <p className="text-[9px] font-medium text-white/40 leading-tight">I can check stock or style this piece for you.</p>
                            </div>
                        </div>
                        <div className="absolute -bottom-1.5 right-8 w-3 h-3 bg-black/40 border-r border-b border-white/10 rotate-45 backdrop-blur-2xl" />
                    </div>
                </div>
            )}

            <button
                onClick={() => setIsChatOpen(true)}
                className={`fixed bottom-8 right-8 z-[90] flex items-center gap-4 bg-white/5 backdrop-blur-xl border border-white/10 pl-6 pr-4 py-4 rounded-2xl shadow-xl hover:bg-white/10 transition-all duration-500 group active:scale-95 ${isChatOpen ? 'opacity-0 scale-50 pointer-events-none' : 'opacity-100 scale-100'}`}
            >

                {showNudge && (
                    <span className="absolute -top-1 -left-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#7a6af6] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-[#7a6af6]"></span>
                    </span>
                )}

                <div className="flex flex-col items-end">
                    <span className="text-[11px] font-bold uppercase text-white/90">Style Assistant</span>
                    <div className="flex items-center gap-1.5 mt-1">
                        <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                        </span>
                        <span className="text-[8px] font-medium text-white/40 uppercase tracking-widest">Online</span>
                    </div>
                </div>
                <div className="w-11 h-11 bg-[#7a6af6] rounded-xl flex items-center justify-center text-white shadow-[#7a6af6]/20 group-hover:rotate-6 transition-all duration-500">
                    <Sparkles size={20} fill="currentColor" />
                </div>
            </button>

            <main className="w-full px-4 md:px-8 lg:px-10 py-10 relative z-10">
                <nav className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.3em] text-white mb-6 pl-1">
                    <span onClick={() => navigate('/')} className="hover:text-white cursor-pointer transition-colors">Home</span>
                    <ChevronRight size={8} />
                    <span onClick={() => navigate('/shop')} className="hover:text-white cursor-pointer transition-colors">Shop</span>
                    <ChevronRight size={8} />
                    <span className="text-[#7a6af6]/60 italic">{product.brand?.name}</span>
                    <ChevronRight size={8} />
                    <span className="opacity-40">{product.name}</span>
                </nav>

                <div className="w-full border border-white/10 rounded-[2rem] overflow-hidden backdrop-blur-3xl bg-white/[0.01] flex flex-col lg:flex-row shadow-2xl">
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

                    <div className="lg:w-1/2 p-8 lg:p-16 flex flex-col justify-center">
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

                <section className="mt-20 space-y-10">
                    <div className="flex justify-between items-end border-b border-white/5 pb-4 px-1">
                        <h2 className="text-2xl font-black uppercase tracking-tighter italic">Related Archive</h2>
                        <span className="text-[8px] font-black uppercase tracking-[0.4em] text-white/20">Discovery 2026</span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 overflow-hidden">
                        {recommendedData.slice(0, 6).map((rec) => (
                            <div key={rec._id} onClick={() => navigate(`/product/${rec._id}`)} className="group cursor-pointer space-y-2">
                                <div className="aspect-[3/4] bg-white/[0.02] rounded-xl overflow-hidden border border-white/5 relative transition-all duration-500 group-hover:border-[#7a6af6]/40">
                                    <img src={rec.thumbnail} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-100" alt={rec.name} />
                                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/90 to-transparent" />
                                    {rec.hex && (
                                        <div className="absolute top-2 right-2 w-2 h-2 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: rec.hex }} />
                                    )}
                                    <div className="absolute bottom-2 left-0 right-0 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <p className="text-[11px] font-black italic text-white">₹{rec.minSalePrice?.toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="text-center px-1">
                                    <h3 className="text-[9px] font-black uppercase tracking-widest text-white/40 group-hover:text-[#7a6af6] transition-colors truncate italic">{rec.name}</h3>
                                    <p className="text-[7px] font-bold uppercase tracking-[0.2em] text-white/10 italic">{rec.color || 'Standard'}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="max-w-[1440px] mx-auto border-t border-white/10 pt-20 grid grid-cols-1 md:grid-cols-3 gap-16 mb-10 mt-40">
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
            </main>
            <Footer />
        </div>
    );
};

export default ProductDetails;