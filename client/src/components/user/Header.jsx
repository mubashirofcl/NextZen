import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Search, ShoppingBag, LogOut, Settings, ChevronDown } from 'lucide-react';
import { clearUser } from '../../store/user/authSlice';
import { userLogout } from '../../api/user/user.api';
import { nxToast } from '../../utils/toastProvider';

const Header = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const location = useLocation();

    const { user, loading, isAuthenticated } = useSelector((state) => state.userAuth);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    useEffect(() => {
        setIsDropdownOpen(false);
    }, [location.pathname]);

    const categories = [
        { name: 'Apparel', path: '/category/apparel' },
        { name: 'Oversized', path: '/category/oversized-t-shirts' },
        { name: 'Hoodies', path: '/category/hoodies' },
        { name: 'Accessories', path: '/category/accessories' },
    ];

    const handleLogout = async () => {
        try {
            await userLogout();
            dispatch(clearUser());
            nxToast.success(
                "Successfully Logged out."
            );
            navigate('/');
        } catch (error) {
            dispatch(clearUser());
            nxToast.security(
                "Filed to Logout."
            );
            navigate('/');
        }
    };

    return (
        <div className="w-full sticky top-0 z-50 font-sans">
            <div className="bg-[#0F172A] text-white py-2 text-center text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase px-4">
                Free Shipping on Orders Above ₹1999 <span className="ml-4 text-[#7a6af6]">Code: ZEN25</span>
            </div>

            <header className="border-b mx-14 mt-3 border-gray-100 bg-white/40 backdrop-blur-xl shadow-sm rounded-[5rem]">
                <div className="max-w-[1500px] mx-auto px-6 h-20 flex items-center justify-between relative">

                    <nav className="hidden lg:flex items-center gap-10">
                        {categories.map((cat) => (
                            <button
                                key={cat.name}
                                onClick={() => navigate(cat.path)}
                                className="text-[11px] font-black uppercase tracking-[0.2em] text-[#fff] hover:text-[#7a6af6] transition-all relative group"
                            >
                                {cat.name}
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#7a6af6] transition-all group-hover:w-full"></span>
                            </button>
                        ))}
                    </nav>

                    <div onClick={() => navigate('/')} className="absolute left-1/2 -translate-x-1/2 cursor-pointer">
                        <h1 className="text-2xl font-black tracking-tighter leading-none text-[#dedede] uppercase">
                            NEXT<span className="text-[#7a6af6]">ZEN</span>
                        </h1>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="relative group cursor-pointer" onClick={() => navigate('/cart')}>
                            <ShoppingBag size={22} strokeWidth={2} className="text-[#ffffff] group-hover:text-[#7a6af6] transition-colors" />
                            <span className="absolute -top-2 -right-2 bg-[#7a6af6] text-white text-[9px] w-5 h-5 rounded-full flex items-center justify-center font-black shadow-lg">0</span>
                        </div>

                        {/* AUTH SECTION START */}
                        <div className="flex items-center min-w-[100px] justify-end">
                            {loading ? (
                                <div className="w-9 h-9 rounded-full bg-gray-100 animate-pulse border border-gray-200"></div>
                            ) : (isAuthenticated && user) ? (
                                <div className="relative">
                                    <button
                                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                        className="flex items-center gap-2 group outline-none"
                                    >
                                        <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center transition-all overflow-hidden border-2 border-transparent group-hover:border-[#7a6af6] shadow-sm">
                                            {user.profilePicture ? (
                                                <img src={user.profilePicture} className="w-full h-full object-cover" alt="profile" />
                                            ) : (
                                                <div className="w-full h-full bg-[#0F172A] flex items-center justify-center text-white text-xs font-black uppercase">
                                                    {user.name?.charAt(0) || 'U'}
                                                </div>
                                            )}
                                        </div>
                                        <ChevronDown size={14} className={`text-gray-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {isDropdownOpen && (
                                        <>
                                            <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)}></div>
                                            <div className="absolute right-0 mt-4 w-56 bg-white border border-gray-100 rounded-2xl shadow-2xl py-3 z-20 animate-in fade-in zoom-in duration-200">
                                                <div className="px-5 py-3 border-b border-gray-50 mb-2">
                                                    <p className="text-[9px] uppercase tracking-widest text-gray-400 font-black mb-1">Signed in as</p>
                                                    <p className="text-xs font-black text-[#0F172A] truncate uppercase">{user.name}</p>
                                                </div>
                                                <button onClick={() => navigate('/profile')} className="w-full px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-600 hover:bg-gray-50 flex items-center gap-3 transition-colors">
                                                    <Settings size={14} /> Profile
                                                </button>
                                                <div className="h-[1px] bg-gray-50 my-2 mx-5"></div>
                                                <button onClick={handleLogout} className="w-full px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 flex items-center gap-3 transition-colors">
                                                    <LogOut size={14} /> Sign Out
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <button
                                    onClick={() => navigate('/login')}
                                    className="text-[11px] font-black uppercase tracking-[0.2em] text-[#0F172A] px-6 py-2 border-2 border-[#0F172A] rounded-full hover:bg-[#0F172A] hover:text-white transition-all shadow-sm active:scale-95"
                                >
                                    Login
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </header>
        </div>
    );
};

export default Header;