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
import AddressModal from "./AddressModal";

const Addresses = () => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [addresses, setAddresses] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // ==================== LOAD ADDRESSES ====================
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

    // ==================== DELETE ====================
    const handleDelete = (id) => {
        nxToast.confirm(
            "Delete Address?",
            "This address will be permanently removed.",
            async () => {
                try {
                    await deleteAddress(id);
                    setAddresses((prev) => prev.filter((addr) => addr._id !== id));
                    nxToast.success("Address removed", "The address was deleted successfully.");
                } catch {
                    nxToast.security("Delete Failed", "Unable to remove the address.");
                }
            }
        );
    };

    // ==================== SET DEFAULT ====================
    const handleSetDefault = async (id) => {
        try {
            const { data } = await setDefaultAddress(id);

            setAddresses((prev) =>
                prev.map((addr) => ({
                    ...addr,
                    isDefault: addr._id === data._id,
                }))
            );

            nxToast.success("Primary address updated");
        } catch {
            nxToast.error("Failed to set default address");
        }
    };

    return (
        <div className="max-w-[800px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-10 pb-6 border-b border-slate-100">
                <div>
                    <h2 className="text-2xl font-black text-[#ffffff] uppercase tracking-tighter">
                        Addresses
                    </h2>
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">
                        Shipping coordinates
                    </p>
                </div>

                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-[#ffffff] text-black rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#cbcbcb] transition-all active:scale-95"
                >
                    <Plus size={14} /> Add New
                </button>
            </div>

            {isLoading && (
                <div className="py-20 text-center">
                    <Loader2 className="animate-spin mx-auto text-slate-400" />
                </div>
            )}

            {/* ==================== ADDRESS LIST ==================== */}
            {!isLoading && addresses.length > 0 && (
                <div className="space-y-4">
                    {addresses.map((addr) => (
                        <div
                            key={addr._id}
                            className={`group bg-white border-2 rounded-2xl p-6 transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-6 ${addr.isDefault
                                ? "border-[#7a6af6]/20 bg-[#7a6af6]/[0.02]"
                                : "border-slate-50 hover:border-slate-200"
                                }`}
                        >

                            <div className="flex items-start gap-4 flex-1">
                                <div
                                    className={`p-3 rounded-xl shrink-0 ${addr.isDefault
                                        ? "bg-[#7a6af6] text-white"
                                        : "bg-slate-50 text-slate-400"
                                        }`}
                                >
                                    {addr.addressType === "Home" ? (
                                        <Home size={18} />
                                    ) : (
                                        <Briefcase size={18} />
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-sm font-black text-[#0F172A] uppercase tracking-tight">
                                            {addr.fullName}
                                        </h4>
                                        {addr.isDefault && (
                                            <span className="text-[8px] font-black bg-[#7a6af6] text-white px-2 py-0.5 rounded-full uppercase tracking-widest">
                                                Default
                                            </span>
                                        )}
                                    </div>

                                    <p className="text-xs font-bold text-slate-500 leading-relaxed">
                                        {addr.addressLine}, {addr.city}, {addr.state} -{" "}
                                        {addr.pincode}
                                    </p>

                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Contact:{" "}
                                        <span className="text-[#0F172A]">
                                            +91 {addr.phone}
                                        </span>
                                    </p>
                                </div>
                            </div>


                            <div className="flex items-center gap-2 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                                {!addr.isDefault && (
                                    <button
                                        onClick={() => handleSetDefault(addr._id)}
                                        className="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-[#7a6af6] transition-all"
                                    >
                                        Set Default
                                    </button>
                                )}

                                <button
                                    onClick={() => {
                                        setSelectedAddress(addr);
                                        setIsEditModalOpen(true);
                                    }}
                                    className="p-2.5 text-slate-400 hover:text-[#0F172A] hover:bg-slate-50 rounded-lg transition-all"
                                >
                                    <Edit2 size={15} />
                                </button>

                                <button
                                    onClick={() => handleDelete(addr._id)}
                                    className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                >
                                    <Trash2 size={15} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ==================== EMPTY STATE ==================== */}
            {!isLoading && addresses.length === 0 && (
                <div className="py-20 text-center bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
                    <MapPin size={32} className="mx-auto text-slate-200 mb-3" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        No deployment points detected
                    </p>
                </div>
            )}

            {/* ==================== MODALS ==================== */}
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
