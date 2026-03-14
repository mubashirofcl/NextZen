import React, { useState, useEffect } from "react";
import {
    MapPin,
    Plus,
    Edit2,
    Trash2,
    Home,
    Briefcase,
    Loader2,
} from "lucide-react";
import { toast } from "sonner";

import {
    fetchAddresses,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
} from "../../api/user/address.api";
import { nxToast } from "../../utils/userToast";
import TOAST_MESSAGES from "../../utils/toastMessages";
import AddressModal from "./AddressModal";

const Addresses = () => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [addresses, setAddresses] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Common Glass Style for internal sections
    const glassStyle = "bg-gradient-to-br from-white/[0.08] to-transparent backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl";

    useEffect(() => {
        const loadAddresses = async () => {
            try {
                setIsLoading(true);
                const { data } = await fetchAddresses();
                setAddresses(data);
            } catch (err) {
                toast.error("Failed to load addresses");
            } finally {
                setIsLoading(false);
            }
        };
        loadAddresses();
    }, []);

    const handleDelete = (id) => {
        nxToast.confirm(
            "Delete Address?",
            "Are you sure you want to remove this shipping address permanently?",
            async () => {
                try {
                    await deleteAddress(id);
                    setAddresses((prev) => prev.filter((addr) => addr._id !== id));
                    nxToast.success(TOAST_MESSAGES.PROFILE.ADDRESS_REMOVED.title, TOAST_MESSAGES.PROFILE.ADDRESS_REMOVED.message);
                } catch {
                    nxToast.security(TOAST_MESSAGES.SYSTEM.ACTION_FAILED.title, TOAST_MESSAGES.SYSTEM.ACTION_FAILED.message);
                }
            }
        );
    };

    const handleSetDefault = async (id) => {
        try {
            const { data } = await setDefaultAddress(id);
            setAddresses((prev) =>
                prev.map((addr) => ({
                    ...addr,
                    isDefault: addr._id === data._id,
                }))
            );
            nxToast.success(TOAST_MESSAGES.PROFILE.ADDRESS_DEFAULT_UPDATED.title, TOAST_MESSAGES.PROFILE.ADDRESS_DEFAULT_UPDATED.message);
        } catch {
            nxToast.error(TOAST_MESSAGES.SYSTEM.ACTION_FAILED.title, "Protocol error");
        }
    };

    return (
        <div className="max-w-full lg:max-w-[900px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* HEADER GLASS PLATE */}
            <div className={`${glassStyle} p-8 mb-8 flex items-center justify-between`}>
                <div className="space-y-1">
                    <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">
                        Addresses
                    </h2>
                    <p className="text-[9px] text-[#7a6af6] font-black uppercase tracking-[0.4em]">
                        Shipping Locations // Archive
                    </p>
                </div>

                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-3 px-6 py-3 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#7a6af6] hover:text-white transition-all active:scale-95"
                >
                    <Plus size={14} /> Add Address
                </button>
            </div>

            {isLoading && (
                <div className="py-20 text-center">
                    <Loader2 className="animate-spin mx-auto text-[#7a6af6]" size={32} />
                </div>
            )}

            {/* ==================== ADDRESS LIST ==================== */}
            {!isLoading && addresses.length > 0 && (
                <div className="space-y-4">
                    {addresses.map((addr) => (
                        <div
                            key={addr._id}
                            className={`group p-6 transition-all duration-500 flex flex-col md:flex-row md:items-center justify-between gap-6 ${glassStyle} ${
                                addr.isDefault 
                                ? "border-[#7a6af6]/40 shadow-[#7a6af6]/5 bg-white/[0.12]" 
                                : "hover:border-white/20"
                            }`}
                        >
                            <div className="flex items-start gap-5 flex-1">
                                <div className={`p-4 rounded-2xl shrink-0 transition-colors ${
                                    addr.isDefault ? "bg-[#7a6af6] text-white shadow-lg shadow-[#7a6af6]/30" : "bg-white/5 text-white/20"
                                }`}>
                                    {addr.addressType === "Home" ? <Home size={20} /> : <Briefcase size={20} />}
                                </div>

                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <h4 className="text-sm font-black text-white uppercase italic tracking-tight">
                                            {addr.fullName}
                                        </h4>
                                        {addr.isDefault && (
                                            <span className="text-[8px] font-black bg-[#7a6af6] text-white px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">
                                                Default
                                            </span>
                                        )}
                                    </div>

                                    <p className="text-xs font-bold text-white/50 leading-relaxed max-w-md">
                                        {addr.addressLine}, {addr.city}, {addr.state} - {addr.pincode}
                                    </p>

                                    <div className="flex items-center gap-4 mt-2">
                                        <p className="text-[9px] font-black text-[#7a6af6] uppercase tracking-widest">
                                            Contact: <span className="text-white">+91 {addr.phone}</span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 border-t md:border-t-0 pt-4 md:pt-0 border-white/5">
                                {!addr.isDefault && (
                                    <button
                                        onClick={() => handleSetDefault(addr._id)}
                                        className="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-white/30 hover:text-[#7a6af6] transition-all"
                                    >
                                        Set Default
                                    </button>
                                )}

                                <button
                                    onClick={() => {
                                        setSelectedAddress(addr);
                                        setIsEditModalOpen(true);
                                    }}
                                    className="p-3 text-white/20 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                                >
                                    <Edit2 size={14} />
                                </button>

                                <button
                                    onClick={() => handleDelete(addr._id)}
                                    className="p-3 text-white/20 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ==================== EMPTY STATE ==================== */}
            {!isLoading && addresses.length === 0 && (
                <div className="py-32 text-center bg-white/[0.02] backdrop-blur-md rounded-[2.5rem] border border-white/5 border-dashed">
                    <MapPin size={40} className="mx-auto text-white/5 mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20 italic">
                        No saved addresses found
                    </p>
                </div>
            )}

            {/* MODALS */}
            <AddressModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                mode="add"
                onSubmit={async (data) => {
                    const res = await createAddress(data);
                    setAddresses((prev) => [...prev, res.data]);
                }}
            />

            <AddressModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                mode="edit"
                initialData={selectedAddress}
                onSubmit={async (data) => {
                    const res = await updateAddress(selectedAddress._id, data);
                    setAddresses((prev) =>
                        prev.map((a) => (a._id === selectedAddress._id ? res.data : a))
                    );
                }}
            />
        </div>
    );
};

export default Addresses;