import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { X, Layers, Edit3, Loader2, Plus, CheckCircle2, Ban, RotateCcw } from "lucide-react";

import {
    useCreateCategory,
    useUpdateCategory,
} from "../../hooks/admin/useAdminCategoryMutations";
import { adminToast } from "../../utils/adminToast";
import { useAdminSubCategories } from "../../hooks/admin/useAdminCategories";

const SubCategoryModal = ({ isOpen, onClose, parentCategory }) => {
    const {
        register,
        handleSubmit,
        reset,
        setError,
        formState: { isSubmitting, errors },
    } = useForm();

    const [editItem, setEditItem] = useState(null);

    // Note: Ensure useAdminSubCategories does NOT filter by isActive:true on the backend
    const { data, isLoading } = useAdminSubCategories({
        parentId: parentCategory?._id,
    });

    const { mutateAsync: createCategory } = useCreateCategory();
    const { mutateAsync: updateCategory } = useUpdateCategory();

    useEffect(() => {
        if (!isOpen) {
            setEditItem(null);
            reset({ name: "", isActive: true });
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
            adminToast.success(newStatus ? "Sub-segment Activated" : "Sub-segment Blocked");
        } catch (err) {
            adminToast.warn("Status Update Failed");
        }
    };

    const onSubmit = async (formData) => {
        try {
            if (editItem) {
                await updateCategory({
                    id: editItem._id,
                    name: formData.name,
                });
                adminToast.success("Subcategory Refined");
                setEditItem(null);
            } else {
                await createCategory({
                    name: formData.name,
                    level: 2,
                    parentId: parentCategory._id,
                    isActive: true,
                });
                adminToast.success("Subcategory Deployed");
            }
            reset({ name: "", isActive: true });
        } catch (err) {
            const serverMsg = err.response?.data?.message || "Operation Failed";
            setError("name", { type: "server", message: serverMsg });
        }
    };

    const inputStyle = `w-full px-4 py-3 bg-slate-50 rounded-xl text-sm font-bold border-2 outline-none transition-all ${errors.name ? "border-red-500/50 bg-red-50" : "border-transparent focus:border-[#7a6af6]/20 focus:bg-white"
        }`;

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-[#0F172A]/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-[500px] rounded-[28px] shadow-2xl p-10 relative animate-in zoom-in duration-300">
                <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-[#0F172A] transition-colors">
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

                {/* LIST SECTION */}
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
                                    <div className="flex flex-col gap-1">
                                        <p className={`font-black text-xs uppercase tracking-tight transition-colors ${sub.isActive ? "text-[#0F172A]" : "text-slate-400 line-through"}`}>
                                            {sub.name}
                                        </p>
                                        <div className="flex gap-2">
                                            <span className={`text-[7px] font-black uppercase px-2 py-0.5 rounded-md border ${sub.isActive ? "text-green-600 bg-green-50 border-green-100" : "text-red-500 bg-red-50 border-red-100"}`}>
                                                {sub.isActive ? "Active" : "Blocked"}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {/* Edit Button - Only allow if active (optional logic) */}
                                        <button
                                            onClick={() => { setEditItem(sub); reset({ name: sub.name }); }}
                                            className="p-2 text-slate-400 hover:text-[#7a6af6] hover:bg-white rounded-lg transition-all active:scale-90 shadow-sm border border-transparent hover:border-slate-100"
                                            title="Edit Name"
                                        >
                                            <Edit3 size={14} strokeWidth={2.5} />
                                        </button>

                                        {/* 🔥 Toggle Block/Unblock Button */}
                                        <button
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

                {/* FORM SECTION */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2 border-t border-slate-100">
                    <div className="relative">
                        <div className="flex justify-between items-center mb-1.5 px-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">
                                {editItem ? "Refining segment" : "Add new segment"}
                            </label>
                            {errors.name && (
                                <p className="text-[9px] font-black text-red-500 uppercase animate-pulse">
                                    {errors.name.message}
                                </p>
                            )}
                        </div>

                        <input
                            {...register("name", {
                                required: "Identifier required",
                                validate: (val) => val.trim().length > 0 || "Void input detected"
                            })}
                            placeholder="Enter segment name..."
                            className={inputStyle}
                        />

                        {editItem && (
                            <button
                                type="button"
                                onClick={() => { setEditItem(null); reset({ name: "" }); }}
                                className="absolute right-4 bottom-3 text-[8px] font-black text-[#7a6af6] uppercase tracking-tighter hover:underline"
                            >
                                Reset Form
                            </button>
                        )}
                    </div>

                    <button
                        disabled={isSubmitting}
                        className={`w-full py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.25em] shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 ${editItem
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
                </form>
            </div>
        </div>
    );
};

export default SubCategoryModal;