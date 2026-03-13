import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { ShoppingBag, LogOut, Settings, ChevronDown, Heart, Ticket, Search, X, Package, Loader2 } from 'lucide-react';
import { clearUser } from '../../store/user/authSlice';
import { userLogout } from '../../api/user/user.api';
import { nxToast } from '../../utils/userToast';
import TOAST_MESSAGES from '../../utils/toastMessages';
import { useCart } from '../../hooks/user/useCart';
import { useWishlist } from '../../hooks/user/useWishlist';
import { useUserCategories } from '../../hooks/user/useUserCategories';
import userAxios from '../../api/baseAxios';

const Header = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const searchRef = useRef(null);

    const { user, isAuthenticated } = useSelector((state) => state.userAuth);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [liveCoupons, setLiveCoupons] = useState([]);

    // --- LIVE SEARCH STATES ---
    const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);

    const { data: categories = [] } = useUserCategories();
    const { cart } = useCart();
    const { wishlist } = useWishlist();

    const cartCount = cart?.items?.length || 0;
    const wishlistCount = wishlist?.length || 0;

    // 🟢 1. FIX: Added missing useEffect to fetch coupons
    useEffect(() => {
        const fetchLiveOffers = async () => {
            try {
                // Ensure this matches your backend route in app.js
                const { data } = await userAxios.get("/users/coupons");
                if (data.success) setLiveCoupons(data.coupons);
            } catch (err) {
                console.error("Coupon Sync Error");
            }
        };
        fetchLiveOffers();
    }, []);

    // 🟢 2. LIVE SEARCH LOGIC (Debounced)
    useEffect(() => {
        const delayDebounce = setTimeout(async () => {
            const query = searchInput.trim();
            if (query.length > 1) {
                setIsSearching(true);
                try {
                    // Path synced to: app.use("/api/products", productListRoutes)
                    const { data } = await userAxios.get(`/products?search=${query}&limit=4`);
                    // data.products is used because your repository returns { products: [], totalCount: X }
                    setSearchResults(data.products || []);
                    setShowResults(true);
                } catch (err) {
                    console.error("Live search failed:", err.message);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults([]);
                setShowResults(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounce);
    }, [searchInput]);

    // Close results when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) setShowResults(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSearchSubmit = (e) => {
        if (e) e.preventDefault();
        if (searchInput.trim()) {
            navigate(`/shop?search=${encodeURIComponent(searchInput.trim())}`);
            setShowResults(false);
        }
    };

    const handleProtectedNavigation = (path) => {
        if (!isAuthenticated) {
            nxToast.security(TOAST_MESSAGES.AUTH.ACCESS_DENIED.title, TOAST_MESSAGES.AUTH.ACCESS_DENIED.message);
            navigate('/login');
            return;
        }
        navigate(path);
    };

    const handleNavClick = (name) => {
        const lowerName = name.toLowerCase();
        if (lowerName === 'shop') { navigate('/shop'); return; }
        const targetCategory = categories.find(cat => cat.name.toLowerCase() === lowerName);
        if (targetCategory) navigate(`/shop?category=${targetCategory._id}`);
        else navigate('/shop');
    };

    const isNavItemActive = (name) => {
        const lowerName = name.toLowerCase();
        const currentCategory = searchParams.get("category");
        if (lowerName === 'shop') return location.pathname === '/shop' && !currentCategory;
        const targetCategory = categories.find(cat => cat.name.toLowerCase() === lowerName);
        return targetCategory && currentCategory === targetCategory._id;
    };

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = async () => {
        try {
            await userLogout();
            dispatch(clearUser());
            nxToast.success(TOAST_MESSAGES.AUTH.LOGOUT_SUCCESS.title, TOAST_MESSAGES.AUTH.LOGOUT_SUCCESS.message);
            navigate('/');
        } catch (error) {
            dispatch(clearUser());
            navigate('/');
        }
    };

    return (
        <div className="w-full fixed top-0 z-50 font-sans selection:bg-[#7a6af6]/30">

            {/* LIVE COUPON MARQUEE */}
            <div className={`bg-black text-white overflow-hidden transition-all duration-500 ease-in-out border-b border-white/5 ${isScrolled ? 'max-h-0 opacity-0' : 'max-h-10 opacity-100'}`}>
                <div className="py-2 whitespace-nowrap flex animate-marquee">
                    {[...Array(2)].map((_, outerIdx) => (
                        <div key={outerIdx} className="flex items-center">
                            {liveCoupons.length > 0 ? (
                                liveCoupons.map((cpn) => (
                                    <div key={`${outerIdx}-${cpn._id}`} className="flex items-center gap-6 mx-10">
                                        <Ticket size={10} className="text-[#7a6af6]" />
                                        <p className="text-[9px] font-black uppercase tracking-[0.3em]">
                                            USE CODE <span className="text-[#7a6af6] ml-1">{cpn.code}</span> FOR {cpn.discountValue}{cpn.discountType === 'PERCENT' ? '%' : ' OFF'}
                                        </p>
                                        <div className="w-1 h-1 bg-white/20 rounded-full" />
                                    </div>
                                ))
                            ) : (
                                <div className="flex items-center gap-6 mx-10">
                                    <p className="text-[9px] font-black uppercase tracking-[0.3em]">
                                        FREE SHIPPING ABOVE ₹1999 // NEXTGEN ARCHIVE 2026 // NEW DROPS LIVE
                                    </p>
                                    <div className="w-1 h-1 bg-white/20 rounded-full" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <header className={`w-full transition-all duration-500 border-b border-white/10 ${isScrolled
                ? 'bg-black/40 backdrop-blur-2xl shadow-2xl rounded-b-[1.2rem]'
                : 'bg-black/60 rounded-b-none'
                }`}>
                <div className="max-w-[1500px] mx-auto px-6 h-14 flex items-center justify-between relative">

                    {/* LEFT SECTION: NAVIGATION */}
                    <nav className="hidden lg:flex items-center gap-8 flex-1">
                        {['Shop', 'Apparel', 'Accessories'].map((name) => (
                            <button
                                key={name}
                                onClick={() => handleNavClick(name)}
                                className="text-[9px] font-black uppercase tracking-[0.2em] text-white/60 hover:text-white transition-all relative group"
                            >
                                {name}
                                <span className={`absolute -bottom-1 left-0 h-0.5 bg-[#7a6af6] transition-all duration-300 ${isNavItemActive(name) ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                            </button>
                        ))}
                    </nav>

                    {/* CENTER SECTION: LOGO */}
                    <div onClick={() => navigate('/')} className="absolute left-1/2 -translate-x-1/2 cursor-pointer group z-20">
                        <h1 className="text-lg md:text-xl font-black tracking-tighter text-white uppercase italic group-hover:scale-105 transition-transform">
                            NEXT<span className="text-[#7a6af6]">ZEN</span>
                        </h1>
                    </div>

                    {/* RIGHT SECTION: SEARCH & ICONS */}
                    <div className="flex items-center gap-5 flex-1 justify-end">

                        {/* 🟢 SEARCH BAR & LIVE DROPDOWN (Correct positioning) */}
                        <div className="relative group hidden md:block" ref={searchRef}>
                            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                                <input
                                    type="text"
                                    value={searchInput}
                                    onFocus={() => searchInput.length > 1 && setShowResults(true)}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    placeholder="Search archive..."
                                    className="bg-white/10 border border-white/10 rounded-full py-1.5 pl-10 pr-4 text-[11px] font-medium text-white outline-none focus:bg-white/20 focus:border-[#7a6af6]/50 transition-all w-44 focus:w-64"
                                />
                                <div className="absolute left-3.5">
                                    {isSearching ? <Loader2 size={12} className="animate-spin text-[#7a6af6]" /> : <Search size={14} className="text-white/30 group-focus-within:text-[#7a6af6]" />}
                                </div>
                                {searchInput && (
                                    <X size={12} className="absolute right-4 text-white/30 hover:text-white cursor-pointer" onClick={() => { setSearchInput(""); setShowResults(false); }} />
                                )}
                            </form>

                            {/* 🟢 FLOATING LIVE RESULTS DROPDOWN (Matches Image UI) */}
                            {showResults && (
                                <div className="absolute top-full right-0 mt-3 w-[340px] bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-[100] border border-gray-100 text-gray-900">
                                    <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Package size={14} className="text-gray-400" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Products ({searchResults.length})</span>
                                        </div>
                                        <span className="text-[8px] font-bold text-gray-300 uppercase italic">Press Enter</span>
                                    </div>

                                    <div className="max-h-[350px] overflow-y-auto custom-scrollbar-light">
                                        {searchResults.length > 0 ? searchResults.map((item) => (
                                            <div
                                                key={item._id}
                                                onClick={() => { navigate(`/product/${item._id}`); setShowResults(false); setSearchInput(""); }}
                                                className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-50 last:border-0 group"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-14 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                                        <img src={item.thumbnail} className="w-full h-full object-cover" alt="" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[12px] font-bold text-gray-900 leading-tight group-hover:text-[#7a6af6] transition-colors">{item.name}</p>
                                                        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-tighter mt-1">{item.subcategory?.name || 'Item'}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right flex flex-col items-end">
                                                    <span className="text-[11px] font-black text-gray-900 italic">₹{item.minSalePrice?.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        )) : !isSearching && (
                                            <div className="p-10 text-center text-gray-400 text-[10px] font-bold uppercase tracking-widest italic">No matching in archive</div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* WISHLIST ICON */}
                        <div className="relative cursor-pointer group p-1" onClick={() => handleProtectedNavigation('/wishlist')}>
                            <Heart size={18} className={`transition-colors ${wishlistCount > 0 && isAuthenticated ? 'text-[#7a6af6]' : 'text-white group-hover:text-[#7a6af6]'}`} fill={wishlistCount > 0 && isAuthenticated ? "currentColor" : "none"} />
                            {wishlistCount > 0 && isAuthenticated && (
                                <span className="absolute -top-1 -right-1 bg-white text-black text-[7px] w-4 h-4 rounded-full flex items-center justify-center font-black">
                                    {wishlistCount}
                                </span>
                            )}
                        </div>

                        {/* CART ICON */}
                        <div className="relative cursor-pointer group p-1" onClick={() => handleProtectedNavigation('/cart')}>
                            <ShoppingBag size={18} className="text-white group-hover:text-[#7a6af6] transition-colors" />
                            {cartCount > 0 && isAuthenticated && (
                                <span className="absolute -top-1 -right-1 bg-[#7a6af6] text-white text-[7px] w-4 h-4 rounded-full flex items-center justify-center font-black">
                                    {cartCount}
                                </span>
                            )}
                        </div>

                        {/* PROFILE DROPDOWN */}
                        <div className="relative">
                            {isAuthenticated ? (
                                <div className="relative">
                                    <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center gap-2 outline-none group">
                                        <div className="w-8 h-8 rounded-full border border-white/10 bg-white/5 group-hover:border-[#7a6af6] transition-colors flex items-center justify-center text-white text-[10px] font-black uppercase">
                                            {user?.name?.charAt(0)}
                                        </div>
                                        <ChevronDown size={12} className={`text-white/40 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                    {isDropdownOpen && (
                                        <>
                                            <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)}></div>
                                            <div className="absolute right-0 mt-3 w-44 bg-black/95 backdrop-blur-3xl border border-white/10 rounded-xl py-2 shadow-2xl z-20 animate-in fade-in zoom-in-95">
                                                <button onClick={() => navigate('/profile')} className="w-full px-4 py-2 text-left text-[9px] font-black uppercase tracking-widest text-white/60 hover:text-white flex items-center gap-3 transition-all"><Settings size={12} /> Profile</button>
                                                <button onClick={() => navigate('/profile/orders')} className="w-full px-4 py-2 text-left text-[9px] font-black uppercase tracking-widest text-white/60 hover:text-white flex items-center gap-3 transition-all"><ShoppingBag size={12} /> Orders</button>
                                                <button onClick={handleLogout} className="w-full px-4 py-2 text-left text-[9px] font-black uppercase tracking-widest text-red-400 hover:text-red-500 flex items-center gap-3 border-t border-white/5 mt-1 pt-2"><LogOut size={12} /> Sign Out</button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <button onClick={() => navigate('/login')} className="text-[9px] font-black uppercase tracking-[0.2em] text-white px-5 py-1.5 border border-white/20 rounded-full hover:bg-white hover:text-black transition-all">
                                    Login
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </header>
            <style dangerouslySetInnerHTML={{ __html: `.animate-marquee { animation: marquee 35s linear infinite; display: flex; width: max-content; } @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } } .custom-scrollbar-light::-webkit-scrollbar { width: 4px; } .custom-scrollbar-light::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar-light::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }` }} />
        </div>
    );
};

export default Header;