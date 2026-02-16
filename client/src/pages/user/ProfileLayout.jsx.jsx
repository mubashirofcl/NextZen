import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { User, MapPin, ShoppingBag, Wallet, Gift, LogOut } from 'lucide-react';

import Header from '../../components/user/Header';
import Footer from '../../components/user/Footer';
import ChangePasswordModal from '../../components/user/ChangePasswordModal';
import { changePassword, userLogout } from '../../api/user/user.api';
import { clearUser } from '../../store/user/authSlice';
import { nxToast } from '../../utils/userToast';

const DEFAULT_AVATAR = 'https://avatar.iran.liara.run/public/boy';

const ProfileLayout = () => {
    const { user } = useSelector((state) => state.userAuth);
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

    const navigate = useNavigate();
    const dispatch = useDispatch();

    const handlePasswordUpdate = async (data) => {
        await changePassword(data);
    };

    const handleLogout = async () => {
        try {
            await userLogout();
            dispatch(clearUser());
            nxToast.success('Successfully Logged out.');
            navigate('/');
        } catch (error) {
            dispatch(clearUser());
            nxToast.security('Failed to Logout.');
            navigate('/');
        }
    };

    const isGoogleUser = Boolean(user?.googleId);

    return (
        <div className="h-screen w-full flex flex-col overflow-hidden">
            <div className="shrink-0 z-50">
                <Header />
            </div>

            <main className="flex-1 flex flex-col min-w-0 overflow-hidden pt-24">
                <div className="flex-1 flex flex-col lg:flex-row gap-8 px-4 sm:px-6 lg:px-12 py-8 overflow-hidden">

                    <aside className="w-full lg:w-[320px] shrink-0 flex flex-col gap-6 overflow-y-auto custom-scrollbar pb-6 lg:pb-0">
                        <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 text-center shadow-2xl shrink-0">
                            <div className="relative w-24 h-24 mx-auto mb-4">
                                <div className="w-full h-full rounded-full overflow-hidden border-2 border-[#7a6af6] p-1">
                                    {user?.profilePicture ? (
                                        <img
                                            src={user.profilePicture}
                                            alt="User"
                                            className="w-full h-full object-cover rounded-full"
                                            onError={(e) => {
                                                e.currentTarget.onerror = null;
                                                e.currentTarget.src = DEFAULT_AVATAR;
                                            }}
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-[#7a6af6] flex items-center justify-center text-white text-2xl font-black">
                                            {user?.name?.charAt(0) || 'U'}
                                        </div>
                                    )}
                                </div>
                                <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 border-4 border-[#1e293b] rounded-full" />
                            </div>

                            <h2 className="text-lg font-black uppercase italic text-white tracking-tighter">
                                {user?.name || 'Client'}
                            </h2>
                            <p className="text-[9px] text-[#7a6af6] font-black uppercase tracking-[0.3em] mt-1">
                                Premium Member
                            </p>
                        </div>

                        <nav className="bg-white/[0.03] backdrop-blur-md border border-white/5 rounded-[2rem] p-4 space-y-2 shrink-0">
                            <ProfileNavLink to="info" icon={<User size={16} />} label="Profile" />
                            <ProfileNavLink to="address" icon={<MapPin size={16} />} label="Addresses" />
                            <ProfileNavLink to="orders" icon={<ShoppingBag size={16} />} label="Orders" />
                            <ProfileNavLink to="wallet" icon={<Wallet size={16} />} label="Wallet" />
                            <ProfileNavLink to="referrals" icon={<Gift size={16} />} label="Referrals" />

                            <div className="pt-4 mt-2 border-t border-white/5">
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-5 py-3 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors font-black text-[10px] uppercase tracking-widest"
                                >
                                    <LogOut size={14} /> Sign Out
                                </button>
                            </div>
                        </nav>
                    </aside>

                    <section className="flex-1 min-w-0 overflow-y-auto custom-scrollbar pr-2 pb-24">
                        <div className="max-w-5xl">
                            <Outlet
                                context={{
                                    openChangePassword: () => setIsChangePasswordOpen(true),
                                    isGoogleUser,
                                }}
                            />
                        </div>
                    </section>
                </div>
            </main>

            <ChangePasswordModal
                isOpen={isChangePasswordOpen}
                onClose={() => setIsChangePasswordOpen(false)}
                onUpdate={handlePasswordUpdate}
            />
        </div>
    );
};

const ProfileNavLink = ({ to, icon, label }) => (
    <NavLink
        to={to}
        className={({ isActive }) =>
            `flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-300 border ${isActive
                ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.2)]'
                : 'text-white/40 border-transparent hover:text-white hover:bg-white/5'
            }`
        }
    >
        {icon}
        <span className="text-[10px] font-black uppercase tracking-[0.2em]">
            {label}
        </span>
    </NavLink>
);

export default ProfileLayout;