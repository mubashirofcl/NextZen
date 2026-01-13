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
        <div className="space-y-6">
            {/* ==================== PROFILE CARD ==================== */}
            <div className=" bg-white rounded-xl p-8 shadow-sm">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h3 className="text-xl font-black uppercase">Account Security</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            {user.googleId ? 'Google Linked Account' : 'NEXTZEN Account'}
                        </p>
                    </div>

                    <div className="flex gap-3">
                        {!user.googleId && (
                            <button
                                onClick={openChangePassword}
                                className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase"
                            >
                                <Lock size={12} /> Change Password
                            </button>
                        )}

                        <button
                            onClick={() => setIsEditModalOpen(true)}
                            className="flex items-center gap-2 border px-4 py-2 rounded-lg text-[10px] font-black uppercase hover:bg-black hover:text-white"
                        >
                            <Edit2 size={12} /> Edit Profile
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <ProfileField label="Name" value={user?.name} icon={<User size={14} />} />
                    <ProfileField label="Email" value={user?.email} icon={<Mail size={14} />} />
                    <ProfileField label="Phone" value={user?.phone || "Not Added"} icon={<Phone size={14} />} />
                    <ProfileField
                        label="Status"
                        value={user?.isVerified ? "Verified" : "Active"}
                        icon={<ShieldCheck size={14} />}
                        isStatus
                    />
                </div>
            </div>

            {/* ==================== STATS ==================== */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div className=" bg-white rounded-xl">
                    <StatCard title="Wallet Balance" value={walletBalance} icon={<Wallet size={16} />} />
                </div>
                <div className=" bg-white rounded-xl">
                    <StatCard title="Referrals" value={user?.referralCount || 0} icon={<Users size={16} />} />
                </div>
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
    <div>
        <p className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400">
            {icon} {label}
        </p>
        <p className={`text-sm font-bold ${isStatus ? 'text-green-600' : ''}`}>
            {value}
        </p>
    </div>
);

const StatCard = ({ title, value, icon }) => (
    <div className="border rounded-xl p-6">
        <p className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400">
            {icon} {title}
        </p>
        <h4 className="text-2xl font-black">{value}</h4>
    </div>
);

export default PersonalInfo;
