import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Edit2, ShieldCheck, Mail, Phone, User, Wallet, Users, Lock } from 'lucide-react';

import EditProfileModal from './EditProfileModal';
import { updateProfile } from '../../api/user/user.api';
import { setUser } from '../../store/user/authSlice';
import { nxToast } from '../../utils/userToast';

const PersonalInfo = () => {
    const { user } = useSelector((state) => state.userAuth);
    const { openChangePassword } = useOutletContext();

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // Common Glass Style to match the theme
    const glassStyle = "bg-gradient-to-br from-white/[0.08] to-transparent backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl";

    const walletBalance = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
    }).format(user?.walletBalance || 0);

    const handleUpdateProfile = async (data) => {
        const response = await updateProfile(data);

        if (response.data.requiresVerification) {
            nxToast.success("Verification code sent to your Email");
            navigate("/verify-otp", {
                state: { email: response.data.tempEmail, flow: 'email_change' },
            });
        } else {
            dispatch(setUser(response.data.user));
            nxToast.success(
                "Profile Info Updated",
                "Your Profile info has been successfully updated."
            );
            setIsEditModalOpen(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            {/* ==================== PROFILE CARD ==================== */}
            <div className={`${glassStyle} p-10`}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6">
                    <div>
                        <h3 className="text-2xl font-black uppercase italic  text-white tracking-tighter">Account Security</h3>
                        <p className="text-[9px] text-[#7a6af6] font-black uppercase tracking-[0.4em] mt-1">
                            {user.googleId ? 'Protocol: Google Authentication' : 'Protocol: NEXTZEN Native'}
                        </p>
                    </div>

                    <div className="flex gap-3">
                        {!user.googleId && (
                            <button
                                onClick={openChangePassword}
                                className="flex items-center gap-2 bg-white text-black hover:bg-[#7a6af6] hover:text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg"
                            >
                                <Lock size={12} /> Change Password
                            </button>
                        )}

                        <button
                            onClick={() => setIsEditModalOpen(true)}
                            className="flex items-center gap-2 border border-white/20 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                        >
                            <Edit2 size={12} /> Edit Profile
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <ProfileField label="Registry Name" value={user?.name} icon={<User size={14} />} />
                    <ProfileField label="Communication Channel" value={user?.email} icon={<Mail size={14} />} />
                    <ProfileField label="Secure Line" value={user?.phone || "Unlinked"} icon={<Phone size={14} />} />
                    <ProfileField
                        label="Verification Status"
                        value={user?.isVerified ? "Verified" : "Active"}
                        icon={<ShieldCheck size={14} />}
                        isStatus
                    />
                </div>
            </div>

            {/* ==================== STATS ==================== */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <StatCard title="Total Credits" value={walletBalance} icon={<Wallet size={16} />} />
                <StatCard title="Network Referrals" value={user?.referralCount || 0} icon={<Users size={16} />} />
            </div>

            <EditProfileModal
                isOpen={isEditModalOpen}
                user={user}
                onClose={() => setIsEditModalOpen(false)}
                onUpdate={handleUpdateProfile}
            />
        </div>
    );
};

const ProfileField = ({ label, value, icon, isStatus }) => (
    <div className="space-y-2">
        <p className="flex items-center gap-2 text-[9px] font-black uppercase text-white/30 tracking-[0.2em]">
            {icon} {label}
        </p>
        <p className={`text-sm font-bold tracking-tight ${isStatus ? 'text-[#7a6af6]' : 'text-white'}`}>
            {value}
        </p>
    </div>
);

const StatCard = ({ title, value, icon }) => (
    <div className="bg-gradient-to-br from-white/[0.08] to-transparent backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 shadow-xl">
        <p className="flex items-center gap-2 text-[9px] font-black uppercase text-[#7a6af6] tracking-[0.4em] mb-3">
            {icon} {title}
        </p>
        <h4 className="text-3xl font-black italic  text-white tracking-tighter">{value}</h4>
    </div>
);

export default PersonalInfo;