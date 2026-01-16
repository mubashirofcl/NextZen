import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { X, Layers, Edit3, Loader2, Plus, CheckCircle2, ShieldAlert, Trash2 } from "lucide-react";

import { useAdminSubCategories } from "../../hooks/admin/useAdminSubCategories";
import {
    useCreateCategory,
    useDeleteCategory,
    useUpdateCategory,
} from "../../hooks/admin/useAdminCategoryMutations";
import { adminToast } from "../../utils/adminToast";

const SubCategoryModal = ({ isOpen, onClose, parentCategory }) => {
    const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();
    const [editItem, setEditItem] = useState(null);

    const { data, isLoading } = useAdminSubCategories({
        parentId: parentCategory?._id,
    });

    const { mutateAsync: createCategory } = useCreateCategory();
    const { mutateAsync: updateCategory } = useUpdateCategory();
    const { mutateAsync: deleteCategory } = useDeleteCategory();


    useEffect(() => {
        if (!isOpen) {
            setEditItem(null);
            reset({ name: "", isActive: true });
        }
    }, [isOpen, reset]);

    if (!isOpen || !parentCategory?._id) return null;

    const toggleSubCategoryStatus = async (sub) => {
        try {
            await updateCategory({
                id: sub._id,
                isActive: !sub.isActive,
            });
            adminToast.success("Status Updated", `Subcategory is now ${!sub.isActive ? 'Active' : 'Disabled'}`);
        } catch (err) {
            adminToast.error("Update Failed");
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
            adminToast.error("Operation Failed");
        }
    };

    const handleDeleteSubCategory = (sub) => {
        adminToast.confirm(
            "Delete Subcategory?",
            "This subcategory will be removed. You can restore it later.",
            async () => {
                try {
                    await deleteCategory(sub._id);
                    adminToast.success("Subcategory Deleted");
                } catch {
                    adminToast.error("Delete Failed");
                }
            }
        );
    };



    // NEXTZEN Standardized Styles
    const labelStyle = "text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block";
    const inputStyle = "w-full px-4 py-3 bg-slate-50 rounded-xl text-sm font-bold border-2 border-transparent outline-none focus:border-[#7a6af6]/20 focus:bg-white transition-all";

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-[#0F172A]/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-[500px] rounded-[28px] shadow-2xl p-10 relative animate-in zoom-in duration-300">
                {/* CLOSE */}
                <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-[#0F172A] transition-colors">
                    <X size={22} />
                </button>

                {/* HEADER */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-1">
                        <Layers size={18} className="text-[#0F172A]" />
                        <h3 className="text-xl font-black text-[#0F172A] uppercase tracking-tight">Manage Sub-Segments</h3>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest ml-7">
                        Parent: <span className="text-[#0F172A]">{parentCategory.name}</span>
                    </p>
                </div>

                {/* LIST SECTION - ENHANCED SIZE */}
                <div className="mb-8 border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/30">
                    <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex justify-between">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Existing Subcategories</span>
                        <span className="text-[9px] font-black text-[#0F172A] uppercase tracking-widest">{data?.items?.length || 0} Total</span>
                    </div>

                    <div className="max-h-56 overflow-y-auto custom-scrollbar p-2 space-y-2">
                        {isLoading ? (
                            <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-slate-300" /></div>
                        ) : data?.items?.length === 0 ? (
                            <div className="py-10 text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest">No sub-segments found</div>
                        ) : (
                            data?.items?.map((sub) => (
                                <div
                                    key={sub._id}
                                    className={`group flex justify-between items-center p-3 rounded-xl border bg-white transition-all hover:shadow-sm ${!sub.isActive ? "bg-slate-50/50 border-slate-100" : "border-slate-100"
                                        }`}
                                >

                                    <div className="flex flex-col gap-1">
                                        <p className={`font-bold text-xs uppercase tracking-tight transition-colors ${sub.isActive ? "text-[#0F172A]" : "text-slate-400"
                                            }`}>
                                            {sub.name}
                                        </p>
                                        <span className={`w-fit text-[8px] font-black uppercase px-2 py-0.5 rounded-md border ${sub.isActive
                                            ? "text-green-600 bg-green-50 border-green-100"
                                            : "text-red-600 bg-red-50 border-red-100"
                                            }`}>
                                            {sub.isActive ? "Live" : "Disabled"}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => { setEditItem(sub); reset({ name: sub.name }); }}
                                            className="p-2 text-slate-400 hover:text-[#7a6af6] hover:bg-purple-50 rounded-lg transition-all active:scale-90"
                                            title="Edit Name"
                                        >
                                            <Edit3 size={14} strokeWidth={2.5} />
                                        </button>

                                        <button
                                            onClick={() => toggleSubCategoryStatus(sub)}
                                            className={`p-2 rounded-lg transition-all ${sub.isActive
                                                ? "text-slate-400 hover:text-orange-500 hover:bg-orange-50"
                                                : "text-slate-400 hover:text-green-500 hover:bg-green-50"
                                                }`}
                                            title={sub.isActive ? "Deactivate" : "Activate"}
                                        >
                                            <CheckCircle2 size={14} strokeWidth={2.5} />
                                        </button>

                                        <button
                                            onClick={() => handleDeleteSubCategory(sub)}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all active:scale-90"
                                            title="Delete Permanently"
                                        >
                                            <Trash2 size={14} strokeWidth={2.5} />
                                        </button>
                                    </div>
                                </div>
                            ))


                        )}
                    </div>
                </div>

                {/* FORM SECTION */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="relative group">
                        <label className={labelStyle}>{editItem ? "Update Name" : "New Subcategory Name"}</label>
                        <input
                            {...register("name", { required: true })}
                            placeholder="e.g., Oversized T-Shirts"
                            className={inputStyle}
                        />
                        {editItem && (
                            <button type="button" onClick={() => { setEditItem(null); reset({ name: "" }); }} className="absolute right-4 bottom-3 text-[9px] font-black text-red-500 uppercase tracking-widest hover:underline">Cancel Edit</button>
                        )}
                    </div>

                    <button
                        disabled={isSubmitting}
                        className={`w-full py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 ${editItem ? "bg-[#0F172A] text-white hover:bg-black" : "bg-[#0F172A] text-white hover:bg-[#152447] shadow-[#7a6af6]/20"
                            }`}
                    >
                        {isSubmitting ? (
                            <Loader2 className="animate-spin" size={16} />
                        ) : (
                            <>{editItem ? <CheckCircle2 size={16} /> : <Plus size={16} />} {editItem ? "Update Sub-Segment" : "Deploy Subcategory"}</>
                        )}
                    </button>
                </form>
            </div>
        </div >
    );
};

export default SubCategoryModal;