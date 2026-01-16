import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { X, Plus, Tag, Loader2, CheckCircle2, ShieldAlert } from "lucide-react";
import { nxToast } from "../../utils/userToast";
import { adminToast } from "../../utils/adminToast";

const CategoryModal = ({
    isOpen,
    onClose,
    onSubmit,
    onOpenSub,
    mode = "add",
    initialData = null,
}) => {
    const { register, handleSubmit, reset, formState: { isSubmitting, errors } } = useForm();
    const [backendError, setBackendError] = useState("");

    useEffect(() => {
        if (!isOpen) return;

        if (mode === "edit" && initialData) {
            reset({
                name: initialData.name,
                description: initialData.description || "",
                isActive: initialData.isActive ?? true
            });
        } else {
            reset({ name: "", description: "", isActive: true });
        }
        setBackendError("");
    }, [isOpen, mode, initialData, reset]);

    if (!isOpen) return null;

    const submitHandler = async (data) => {
        setBackendError("");
        try {
            const payload =
                mode === "add"
                    ? {
                        name: data.name,
                        description: data.description,
                        isActive: data.isActive,
                        level: 1,
                        parentId: null,
                    }
                    : {
                        id: initialData._id,
                        name: data.name,
                        description: data.description,
                        isActive: data.isActive,
                    };

            await onSubmit(payload);
            adminToast.success(mode === "add" ? "Category Created" : "Category Updated");
            onClose();
        } catch (err) {
            setBackendError(err?.response?.data?.message || "Operation failed");
        }
    };

    const labelStyle = "text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block";
    const inputStyle = "w-full px-4 py-3 bg-slate-50 rounded-xl text-sm font-bold border-2 border-transparent outline-none focus:border-[#7a6af6]/20 focus:bg-white transition-all";

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-[#0F172A]/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-[400px] rounded-[24px] shadow-2xl p-8 relative animate-in zoom-in duration-300">
                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 text-slate-400 hover:text-[#0F172A] transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="mb-6 text-center sm:text-left">
                    <h3 className="text-xl font-black text-[#0F172A] uppercase tracking-tight">
                        {mode === "add" ? "New Category" : "Edit Category"}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                        Primary Catalog Segment
                    </p>
                </div>

                <div className="flex justify-center mb-8">
                    <div className="w-16 h-16 bg-[#0F172A] rounded-2xl flex items-center justify-center shadow-xl shadow-[#0F172A]/20 text-white">
                        <Tag size={28} strokeWidth={2.5} />
                    </div>
                </div>

                {backendError && (
                    <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 flex items-center gap-2">
                        <ShieldAlert size={14} className="text-red-500" />
                        <p className="text-[9px] font-black text-red-700 uppercase leading-none">{backendError}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit(submitHandler)} className="space-y-4">
                    <div>
                        <label className={labelStyle}>Category Name *</label>
                        <input
                            {...register("name", { required: "Name is required" })}
                            placeholder="e.g., Apparel"
                            className={`${inputStyle} ${errors.name ? "border-red-500" : ""}`}
                        />
                    </div>

                    <div>
                        <label className={labelStyle}>Description</label>
                        <textarea
                            {...register("description")}
                            placeholder="Brief details about this segment..."
                            className={`${inputStyle} h-24 resize-none py-3`}
                        />
                    </div>

                    <div className="space-y-3 pt-2">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-4 bg-[#0F172A] text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <Loader2 className="animate-spin" size={16} />
                            ) : (
                                <>
                                    <CheckCircle2 size={16} />
                                    {mode === "add" ? "Save Category" : "Update Category"}
                                </>
                            )}
                        </button>

                        {mode === "edit" && (
                            <button
                                type="button"
                                onClick={() => onOpenSub(initialData)}
                                className="w-full py-3 border-2 border-dashed border-black-200 rounded-xl text-[10px] font-black uppercase text-slate-800 hover:border-[#142858] hover:text-[#0F172A] hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                            >
                                <Plus size={14} /> Manage Subcategories
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CategoryModal;