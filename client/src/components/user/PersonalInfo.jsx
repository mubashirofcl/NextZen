import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { 
    Edit2, ShieldCheck, Mail, Phone, User, Wallet, 
    Users, Lock, ArrowRight, Copy, Share2, Check, 
    Tag, Gift, Info
} from 'lucide-react';

import EditProfileModal from './EditProfileModal';
import { updateProfile, getUserMe } from '../../api/user/user.api';
import { setUser } from '../../store/user/authSlice';
import { nxToast } from '../../utils/userToast';

const PersonalInfo = () => {
    const { user } = useSelector((state) => state.userAuth);
    const { openChangePassword } = useOutletContext();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    useEffect(() => {
        const syncProfile = async () => {
            try {
                const response = await getUserMe();
                if (response.data.user) {
                    dispatch(setUser(response.data.user));
                }
            } catch (err) {
                console.error("Profile Sync Error:", err);
            }
        };
        syncProfile();
    }, [dispatch]);

    const glassStyle = "bg-gradient-to-br from-white/[0.08] to-transparent backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl";

    const walletBalance = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
    }).format(user?.walletBalance ?? user?.wallet?.balance ?? 0);

    // 🟢 Referral Logic with Fallback Protection
    const referralLink = user?.referralCode 
        ? `${window.location.origin}/signup?ref=${user.referralCode}`
        : "Generating your link...";

    const copyToClipboard = (text) => {
        if (!user?.referralCode) return nxToast.error("Wait...", "Generating your unique code.");
        
        navigator.clipboard.writeText(text);
        setCopied(true);
        nxToast.success("Link Copied", "Share it with your friends to earn rewards.");
        setTimeout(() => setCopied(false), 2000);
    };

    const handleUpdateProfile = async (data) => {
        try {
            const response = await updateProfile(data);
            if (response.data.requiresVerification) {
                nxToast.success("Verification code sent to your Email");
                navigate("/verify-otp", {
                    state: { email: response.data.tempEmail, flow: 'email_change' },
                });
            } else {
                dispatch(setUser(response.data.user));
                nxToast.success("Profile Updated", "Your information has been successfully saved.");
                setIsEditModalOpen(false);
            }
        } catch (error) {
            nxToast.error("Update Failed", "Could not update profile information.");
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            {/* PROFILE CARD */}
            <div className={`${glassStyle} p-10`}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6">
                    <div>
                        <h3 className="text-2xl font-black uppercase italic text-white tracking-tighter">My Profile</h3>
                        <p className="text-[9px] text-[#7a6af6] font-black uppercase tracking-[0.4em] mt-1">
                            {user?.googleId ? 'Sign-in Method: Google' : 'Sign-in Method: Email & Password'}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        {!user?.googleId && (
                            <button onClick={openChangePassword} className="flex items-center gap-2 bg-white text-black hover:bg-[#7a6af6] hover:text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg">
                                <Lock size={12} /> Change Password
                            </button>
                        )}
                        <button onClick={() => setIsEditModalOpen(true)} className="flex items-center gap-2 border border-white/20 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                            <Edit2 size={12} /> Edit Profile
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <ProfileField label="Full Name" value={user?.name} icon={<User size={14} />} />
                    <ProfileField label="Email Address" value={user?.email} icon={<Mail size={14} />} />
                    <ProfileField label="Phone Number" value={user?.phone || "Not linked"} icon={<Phone size={14} />} />
                    <ProfileField label="Your Invite Code" value={user?.referralCode || "Loading..."} icon={<Tag size={14} />} isStatus />
                </div>
            </div>

            {/* 🟢 REFERRAL PROGRAM CARD */}
            <div className={`${glassStyle} p-10 relative overflow-hidden group`}>
                <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                    <Share2 size={180} />
                </div>
                <div className="relative z-10">
                    <div className="flex flex-col lg:flex-row justify-between items-start mb-8 gap-6">
                        <div>
                            <h3 className="text-2xl font-black uppercase italic text-white tracking-tighter">Refer & Earn</h3>
                            <p className="text-[9px] text-[#7a6af6] font-black uppercase tracking-[0.4em] mt-1">Grow the community, reap the rewards</p>
                        </div>
                        
                        {/* 🎁 REWARD DETAILS BOX */}
                        <div className="flex gap-4">
                            <div className="bg-white/5 border border-white/10 px-5 py-3 rounded-2xl">
                                <p className="text-[7px] font-black text-[#7a6af6] uppercase tracking-[0.2em] mb-1">Your Reward</p>
                                <p className="text-lg font-black text-white italic">₹100 <span className="text-[9px] font-medium not-italic text-white/40">per friend</span></p>
                            </div>
                            <div className="bg-white/5 border border-white/10 px-5 py-3 rounded-2xl">
                                <p className="text-[7px] font-black text-green-400 uppercase tracking-[0.2em] mb-1">Friend Gets</p>
                                <p className="text-lg font-black text-white italic">₹50 <span className="text-[9px] font-medium not-italic text-white/40">on signup</span></p>
                            </div>
                            <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-2xl">
                                <p className="text-[7px] font-black text-white/40 uppercase tracking-widest mb-1">Total Referrals</p>
                                <p className="text-lg font-black text-white italic text-center">{user?.referralCount || 0}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#7a6af6]/5 border border-[#7a6af6]/20 p-4 rounded-2xl mb-6 flex items-start gap-3">
                        <Info size={16} className="text-[#7a6af6] mt-0.5 shrink-0" />
                        <p className="text-[10px] text-white/70 leading-relaxed font-medium">
                            Share your link below. When a friend signs up using your code, they immediately get <span className="text-white font-bold">₹50</span> in their wallet, and you'll receive <span className="text-white font-bold">₹100</span> once they join!
                        </p>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="flex-1 bg-black/20 border border-white/5 p-4 rounded-2xl flex justify-between items-center group/link hover:border-white/20 transition-all">
                            <code className="text-[10px] text-white/60 truncate mr-4 select-all">{referralLink}</code>
                            <button 
                                onClick={() => copyToClipboard(referralLink)}
                                className="p-2 text-[#7a6af6] hover:bg-[#7a6af6] hover:text-white rounded-xl transition-all flex-shrink-0"
                            >
                                {copied ? <Check size={16} /> : <Copy size={16} />}
                            </button>
                        </div>
                        <button 
                            onClick={() => copyToClipboard(user?.referralCode)}
                            className="bg-[#7a6af6] text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2 shadow-xl shadow-[#7a6af6]/20"
                        >
                            <Share2 size={14} /> Copy My Code
                        </button>
                    </div>
                </div>
            </div>

            {/* WALLET DISPLAY */}
            <div className='grid grid-cols-1 gap-6'>
                <div onClick={() => navigate('/profile/wallet')} className="group cursor-pointer bg-gradient-to-br from-white/[0.08] to-transparent backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 shadow-xl hover:border-[#7a6af6]/40 transition-all relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity"><Wallet size={120} /></div>
                    <div className="flex justify-between items-start mb-3">
                        <p className="flex items-center gap-2 text-[9px] font-black uppercase text-[#7a6af6] tracking-[0.4em]"><Wallet size={16} /> My Wallet Balance</p>
                        <ArrowRight size={14} className="text-white/20 group-hover:text-[#7a6af6] group-hover:translate-x-1 transition-all" />
                    </div>
                    <h4 className="text-3xl font-black italic text-white tracking-tighter mb-4">{walletBalance}</h4>
                    <button className="text-[8px] font-black uppercase tracking-widest text-white/40 group-hover:text-white border border-white/10 group-hover:border-[#7a6af6] px-3 py-1 rounded-lg transition-all">Transactions Details</button>
                </div>
            </div>

            <EditProfileModal isOpen={isEditModalOpen} user={user} onClose={() => setIsEditModalOpen(false)} onUpdate={handleUpdateProfile} />
        </div>
    );
};

const ProfileField = ({ label, value, icon, isStatus }) => (
    <div className="space-y-2">
        <p className="flex items-center gap-2 text-[9px] font-black uppercase text-white/30 tracking-[0.2em]">{icon} {label}</p>
        <p className={`text-sm font-bold tracking-tight ${isStatus ? 'text-[#7a6af6]' : 'text-white'}`}>{value}</p>
    </div>
);

export default PersonalInfo;