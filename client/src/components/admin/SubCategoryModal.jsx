import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { X, Layers, Edit3, Loader2, Plus, CheckCircle2, Ban, RotateCcw, Percent, Info } from "lucide-react";

import {
    useCreateCategory,
    useUpdateCategory,
} from "../../hooks/admin/useAdminCategoryMutations";
import { adminToast } from "../../utils/adminToast";
import { useAdminSubCategories } from "../../hooks/admin/useAdminCategories";
import { useOffers } from "../../hooks/admin/useOffers";

const SubCategoryModal = ({ isOpen, onClose, parentCategory }) => {
    const {
        register,
        handleSubmit,
        reset,
        setError,
        watch,
        formState: { isSubmitting, errors },
    } = useForm({
        mode: "onBlur"
    });

    const [editItem, setEditItem] = useState(null);

    const { data, isLoading } = useAdminSubCategories({
        parentId: parentCategory?._id,
    });

    const { offers } = useOffers();
    const subCatOffers = offers.filter(o => o.applyFor === "SUBCATEGORY" && o.isActive);

    const { mutateAsync: createCategory } = useCreateCategory();
    const { mutateAsync: updateCategory } = useUpdateCategory();

    useEffect(() => {
        if (!isOpen) {
            setEditItem(null);
            reset({ name: "", isActive: true, offerId: "" });
        }
    }, [isOpen, reset]);

    if (!isOpen || !parentCategory?._id) return null;

    const toggleSubCategoryStatus = async (sub) => {
        try {
            const newStatus = !sub.isActive;
            await updateCategory({
                id: sub._id,
                isActive: newStatus,
            });
            adminToast.success("Registry Updated", `Segment has been successfully ${newStatus ? 'activated' : 'restricted'}.`);
        } catch (err) {
            adminToast.error("Update Failed", "System was unable to modify the segment status.");
        }
    };

    const onSubmit = async (formData) => {
        try {
            const payload = {
                name: formData.name.trim(),
                offerId: formData.offerId || null,
            };

            if (editItem) {
                await updateCategory({
                    id: editItem._id,
                    ...payload
                });
                adminToast.success("Success", "Sub-segment parameters refined successfully.");
                setEditItem(null);
            } else {
                await createCategory({
                    ...payload,
                    level: 2,
                    parentId: parentCategory._id,
                    isActive: true,
                });
                adminToast.success("Success", "New sub-segment deployed to archive.");
            }
            reset({ name: "", isActive: true, offerId: "" });
        } catch (err) {
            const serverMsg = err.response?.data?.message || "Internal registry error occurred.";
            setError("name", { type: "server", message: serverMsg });
            adminToast.error("Operation Denied", serverMsg);
        }
    };

    const inputStyle = `w-full px-4 py-3 bg-slate-50 rounded-xl text-sm font-bold border-2 outline-none transition-all ${errors.name ? "border-red-500/50 bg-red-50" : "border-transparent focus:border-[#7a6af6]/20 focus:bg-white"}`;

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-[#0F172A]/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-[500px] rounded-[28px] shadow-2xl p-10 relative animate-in zoom-in duration-300">
                <button type="button" onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-[#0F172A] transition-colors">
                    <X size={22} />
                </button>

                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 bg-slate-100 rounded-lg">
                            <Layers size={18} className="text-[#0F172A]" />
                        </div>
                        <h3 className="text-xl font-black text-[#0F172A] uppercase tracking-tight">Archive Segments</h3>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest ml-11">
                        Parent: <span className="text-[#7a6af6]">{parentCategory.name}</span>
                    </p>
                </div>

                <div className="mb-8 border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/30">
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Database Registry</span>
                        <span className="text-[9px] font-black text-[#7a6af6] bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                            {data?.length || 0} Records
                        </span>
                    </div>

                    <div className="max-h-60 overflow-y-auto custom-scrollbar p-3 space-y-2">
                        {isLoading ? (
                            <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-slate-300" /></div>
                        ) : data?.length === 0 ? (
                            <div className="py-10 text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">No segments found in archive</div>
                        ) : (
                            data?.map((sub) => (
                                <div key={sub._id} className={`group flex justify-between items-center p-3 rounded-xl border transition-all ${!sub.isActive
                                        ? "bg-slate-50/80 border-slate-200 opacity-75 shadow-inner"
                                        : "bg-white border-slate-100 hover:border-[#7a6af6]/30 hover:shadow-md"
                                    }`}>
                                    <div className="flex flex-col gap-0.5">
                                        <p className={`font-black text-xs uppercase tracking-tight transition-colors ${sub.isActive ? "text-[#0F172A]" : "text-slate-400 line-through"}`}>
                                            {sub.name}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[7px] font-black uppercase px-2 py-0.5 rounded-md border ${sub.isActive ? "text-green-600 bg-green-50 border-green-100" : "text-red-500 bg-red-50 border-red-100"}`}>
                                                {sub.isActive ? "Active" : "Blocked"}
                                            </span>
                                            {sub.offerId && (
                                                <span className="text-[7px] font-black uppercase px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center gap-1">
                                                    <Percent size={8} /> {sub.offerId?.title || 'Promo'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() => { 
                                                setEditItem(sub); 
                                                reset({ 
                                                    name: sub.name, 
                                                    offerId: sub.offerId?._id || sub.offerId || "" 
                                                }); 
                                            }}
                                            className="p-2 text-slate-400 hover:text-[#7a6af6] hover:bg-white rounded-lg transition-all active:scale-90 shadow-sm border border-transparent hover:border-slate-100"
                                            title="Edit Segment"
                                        >
                                            <Edit3 size={14} strokeWidth={2.5} />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => toggleSubCategoryStatus(sub)}
                                            className={`p-2 rounded-lg transition-all shadow-sm border ${sub.isActive
                                                    ? "text-slate-400 hover:text-red-500 hover:bg-white border-transparent hover:border-red-100"
                                                    : "text-[#7a6af6] bg-white border-slate-200 hover:text-green-500 hover:border-green-100"
                                                }`}
                                            title={sub.isActive ? "Block Subcategory" : "Unblock Subcategory"}
                                        >
                                            {sub.isActive ? <Ban size={14} strokeWidth={2.5} /> : <RotateCcw size={14} strokeWidth={2.5} />}
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2 border-t border-slate-100">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic ml-1">
                                {editItem ? "Refine segment" : "Add segment"}
                            </label>
                            <input
                                {...register("name", {
                                    required: "Name is required",
                                    minLength: { value: 3, message: "Min 3 characters" },
                                    maxLength: { value: 25, message: "Max 25 characters" },
                                    validate: {
                                        notEmpty: (val) => val.trim().length > 0 || "Cannot be empty",
                                        validChars: (val) => /^[A-Za-z0-9\s&-]+$/.test(val) || "Invalid characters"
                                    }
                                })}
                                placeholder="e.g. Footwear"
                                className={inputStyle}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic ml-1">
                                Link Offer rule
                            </label>
                            <div className="relative">
                                <select
                                    {...register("offerId")}
                                    className="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm font-bold border-2 border-transparent outline-none focus:border-[#7a6af6]/20 focus:bg-white transition-all appearance-none pr-8"
                                >
                                    <option value="">Standard Pricing (None)</option>
                                    {subCatOffers.map(offer => (
                                        <option key={offer._id} value={offer._id}>
                                            {offer.title} ({offer.discountValue}%)
                                        </option>
                                    ))}
                                </select>
                                <Percent size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {errors.name && (
                        <p className="text-[9px] font-black text-red-500 uppercase px-1 flex items-center gap-1">
                            <Info size={10} /> Validation Error: {errors.name.message}
                        </p>
                    )}

                    <div className="flex gap-2">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.25em] shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed ${editItem
                                    ? "bg-[#7a6af6] text-white hover:bg-[#6858e0] shadow-purple-200"
                                    : "bg-[#0F172A] text-white hover:bg-black shadow-slate-200"
                                }`}
                        >
                            {isSubmitting ? (
                                <Loader2 className="animate-spin" size={16} />
                            ) : (
                                <>
                                    {editItem ? <CheckCircle2 size={16} /> : <Plus size={16} />}
                                    {editItem ? "Authorize Changes" : "Deploy Segment"}
                                </>
                            )}
                        </button>
                        
                        {editItem && (
                             <button
                                type="button"
                                onClick={() => { setEditItem(null); reset({ name: "", offerId: "" }); }}
                                className="px-4 bg-slate-100 text-slate-400 rounded-xl hover:bg-slate-200 transition-all border border-transparent hover:border-slate-300"
                                title="Cancel Edit"
                            >
                                <RotateCcw size={16} />
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SubCategoryModal;