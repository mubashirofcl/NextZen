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
        <div className="min-h-screen text-[#0F172A]">
            <Header />

            <main className="max-w-[1200px] mx-auto pt-16 pb-24 px-6 flex flex-col md:flex-row gap-10">
                <aside className="w-full md:w-64 flex flex-col gap-6">
                    <div className="bg-white/40 rounded-xl p-6 text-center shadow-sm">
                        <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-4 border-2 border-slate-200">
                            {user?.profilePicture ? (
                                <img
                                    src={user.profilePicture}
                                    alt="User"
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.currentTarget.onerror = null;
                                        e.currentTarget.src = DEFAULT_AVATAR;
                                    }}
                                />
                            ) : (
                                <div className="w-full h-full bg-[#0F172A] flex items-center justify-center text-white text-xl font-black uppercase">
                                    {user?.name?.charAt(0) || 'U'}
                                </div>
                            )}
                        </div>

                        <h2 className="text-sm text-white font-bold uppercase">
                            {user?.name || 'Client'}
                        </h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            Premium Member
                        </p>
                    </div>

                    <nav className="space-y-1 bg-white/40 rounded-xl p-6 text-white">
                        <ProfileNavLink to="info" icon={<User size={16} />} label="Personal Profile" />
                        <ProfileNavLink to="address" icon={<MapPin size={16} />} label="Saved Addresses" />
                        <ProfileNavLink to="orders" icon={<ShoppingBag size={16} />} label="My Orders" />
                        <ProfileNavLink to="wallet" icon={<Wallet size={16} />} label="Wallet" />
                        <ProfileNavLink to="referrals" icon={<Gift size={16} />} label="Referrals" />

                        <div className="pt-4 mt-4 border-t border-slate-100">
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 font-bold text-[10px] uppercase tracking-widest"
                            >
                                <LogOut size={14} /> Sign Out
                            </button>
                        </div>
                    </nav>
                </aside>

                <section className="flex-1 min-w-0">
                    <Outlet
                        context={{
                            openChangePassword: () => setIsChangePasswordOpen(true),
                            isGoogleUser,
                        }}
                    />
                </section>
            </main>

            <Footer />

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
            `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive
                ? 'bg-[#0F172A] text-white'
                : 'text-slate-200 hover:text-[#0F172A] hover:bg-slate-50'
            }`
        }
    >
        {icon}
        <span className="text-[10px] font-black uppercase tracking-[0.15em]">
            {label}
        </span>
    </NavLink>
);

export default ProfileLayout;
