import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { ShoppingBag, LogOut, Settings, ChevronDown, Heart, Ticket } from 'lucide-react';
import { clearUser } from '../../store/user/authSlice';
import { userLogout } from '../../api/user/user.api';
import { nxToast } from '../../utils/userToast';
import { useCart } from '../../hooks/user/useCart';
import { useWishlist } from '../../hooks/user/useWishlist';
import { useUserCategories } from '../../hooks/user/useUserCategories';
import userAxios from '../../api/baseAxios'; // Ensure this is imported

const Header = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);

    const { user, isAuthenticated } = useSelector((state) => state.userAuth);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [liveCoupons, setLiveCoupons] = useState([]);

    const { data: categories = [] } = useUserCategories();
    const { cart } = useCart();
    const { wishlist } = useWishlist();

    const cartCount = cart?.items?.length || 0;
    const wishlistCount = wishlist?.length || 0;

    // 🟢 FETCH LIVE COUPONS FOR MARQUEE
    useEffect(() => {
        const fetchLiveOffers = async () => {
            try {
                const { data } = await userAxios.get("/users/coupons/available");
                if (data.success) setLiveCoupons(data.coupons);
            } catch (err) {
                console.error("Coupon Sync Error");
            }
        };
        fetchLiveOffers();
    }, []);

    const handleProtectedNavigation = (path) => {
        if (!isAuthenticated) {
            nxToast.security("Access Restricted", "Please login to access your personal bag.");
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

    useEffect(() => setIsDropdownOpen(false), [location.pathname]);

    const handleLogout = async () => {
        try {
            await userLogout();
            dispatch(clearUser());
            nxToast.success("Successfully Logged out.");
            navigate('/');
        } catch (error) {
            dispatch(clearUser());
            navigate('/');
        }
    };

    return (
        <div className="w-full fixed top-0 z-50 font-sans selection:bg-[#7a6af6]/30">

            {/* 🟢 LIVE COUPON MARQUEE BANNER */}
            <div className={`bg-black text-white overflow-hidden transition-all duration-500 ease-in-out border-b border-white/5 ${isScrolled ? 'max-h-0 opacity-0' : 'max-h-10 opacity-100'}`}>
                <div className="py-2 whitespace-nowrap flex animate-marquee">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="flex items-center">
                            {liveCoupons.length > 0 ? liveCoupons.map((cpn) => (
                                <div key={cpn._id} className="flex items-center gap-6 mx-10">
                                    <Ticket size={10} className="text-[#7a6af6]" />
                                    <p className="text-[9px] font-black uppercase tracking-[0.3em]">
                                        USE CODE <span className="text-[#7a6af6] ml-1">{cpn.code}</span> FOR {cpn.discountValue}{cpn.discountType === 'PERCENT' ? '%' : ' OFF'}
                                    </p>
                                    <div className="w-1 h-1 bg-white/20 rounded-full" />
                                </div>
                            )) : (
                                <div className="flex items-center gap-6 mx-10">
                                    <p className="text-[9px] font-black uppercase tracking-[0.3em]">Free Shipping Above ₹1999 // Nextgen Archive 2026</p>
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

                    <nav className="hidden lg:flex items-center gap-8">
                        {['Shop', 'Apparel', 'Accessories'].map((name) => (
                            <button
                                key={name}
                                onClick={() => handleNavClick(name)}
                                className="text-[9px] font-black uppercase tracking-[0.2em] text-white/60 hover:text-white transition-all relative group"
                            >
                                {name}
                                <span className={`absolute -bottom-1 left-0 h-0.5 bg-[#7a6af6] transition-all duration-300 ${isNavItemActive(name) ? 'w-full' : 'w-0 group-hover:w-full'
                                    }`}></span>
                            </button>
                        ))}
                    </nav>

                    <div onClick={() => navigate('/')} className="absolute left-1/2 -translate-x-1/2 cursor-pointer group">
                        <h1 className="text-lg md:text-xl font-black tracking-tighter text-white uppercase italic group-hover:scale-105 transition-transform">
                            NEXT<span className="text-[#7a6af6]">ZEN</span>
                        </h1>
                    </div>

                    <div className="flex items-center gap-5">
                        <div className="relative cursor-pointer group p-1" onClick={() => handleProtectedNavigation('/wishlist')}>
                            <Heart size={18} className={`transition-colors ${wishlistCount > 0 && isAuthenticated ? 'text-[#7a6af6]' : 'text-white group-hover:text-[#7a6af6]'}`} fill={wishlistCount > 0 && isAuthenticated ? "currentColor" : "none"} />
                            {wishlistCount > 0 && isAuthenticated && (
                                <span className="absolute -top-1 -right-1 bg-white text-black text-[7px] w-4 h-4 rounded-full flex items-center justify-center font-black">
                                    {wishlistCount}
                                </span>
                            )}
                        </div>

                        <div className="relative cursor-pointer group p-1" onClick={() => handleProtectedNavigation('/cart')}>
                            <ShoppingBag size={18} className="text-white group-hover:text-[#7a6af6] transition-colors" />
                            {cartCount > 0 && isAuthenticated && (
                                <span className="absolute -top-1 -right-1 bg-[#7a6af6] text-white text-[7px] w-4 h-4 rounded-full flex items-center justify-center font-black">
                                    {cartCount}
                                </span>
                            )}
                        </div>

                        <div className="flex items-center justify-end">
                            {isAuthenticated ? (
                                <div className="relative">
                                    <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center gap-2 outline-none group">
                                        <div className="w-8 h-8 rounded-full border border-white/10 overflow-hidden bg-white/5 group-hover:border-[#7a6af6] transition-colors">
                                            <div className="w-full h-full flex items-center justify-center text-white text-[10px] font-black uppercase">
                                                {user?.name?.charAt(0)}
                                            </div>
                                        </div>
                                        <ChevronDown size={12} className={`text-white/40 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {isDropdownOpen && (
                                        <>
                                            <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)}></div>
                                            <div className="absolute right-0 mt-3 w-44 bg-black/95 backdrop-blur-3xl border border-white/10 rounded-xl py-2 shadow-2xl z-20 animate-in fade-in zoom-in duration-150">
                                                <button onClick={() => navigate('/profile')} className="w-full px-4 py-2 text-left text-[9px] font-black uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/5 flex items-center gap-3 transition-all">
                                                    <Settings size={12} /> Profile
                                                </button>
                                                <button onClick={() => navigate('/profile/orders')} className="w-full px-4 py-2 text-left text-[9px] font-black uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/5 flex items-center gap-3 transition-all">
                                                    <ShoppingBag size={12} /> My Orders
                                                </button>
                                                <button onClick={handleLogout} className="w-full px-4 py-2 text-left text-[9px] font-black uppercase tracking-widest text-red-400 hover:text-red-500 hover:bg-red-500/10 flex items-center gap-3 transition-all">
                                                    <LogOut size={12} /> Sign Out
                                                </button>
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

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
                .animate-marquee { animation: marquee 35s linear infinite; display: flex; width: max-content; }
            `}} />
        </div>
    );
};

export default Header;