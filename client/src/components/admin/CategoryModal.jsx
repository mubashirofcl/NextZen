import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { X, Plus, Tag, Loader2, CheckCircle2, ShieldAlert, Percent } from "lucide-react";
import { adminToast } from "../../utils/adminToast";
import { useOffers } from "../../hooks/admin/useOffers"; // Import your offer hook

const CategoryModal = ({
    isOpen,
    onClose,
    onSubmit,
    onOpenSub,
    mode = "add",
    initialData = null,
}) => {
    const { register, handleSubmit, reset, clearErrors, formState: { isSubmitting, errors } } = useForm();
    const [backendError, setBackendError] = useState("");

    // Fetch available Category-level offers
    const { offers } = useOffers();
    const categoryOffers = offers.filter(o => o.applyFor === "CATEGORY" && o.isActive);

    useEffect(() => {
        if (!isOpen) return;

        if (mode === "edit" && initialData) {
            // Logic: If offerId is an object, take the _id. If it's already a string, use it.
            const currentOfferId = initialData.offerId?._id || initialData.offerId || "";

            reset({
                name: initialData.name,
                description: initialData.description || "",
                isActive: initialData.isActive ?? true,
                offerId: currentOfferId
            });
        } else {
            reset({ name: "", description: "", isActive: true, offerId: "" });
        }
        setBackendError("");
        clearErrors();
    }, [isOpen, mode, initialData, reset, clearErrors]);

    if (!isOpen) return null;

    const submitHandler = async (data) => {
        setBackendError("");
        try {
            const payload = mode === "add"
                ? { ...data, level: 1, parentId: null }
                : { ...data, id: initialData._id };

            await onSubmit(payload);
            adminToast.success(mode === "add" ? "Category Created" : "Category Updated");
            onClose();
        } catch (err) {
            setBackendError(err?.response?.data?.message || err?.message || "Operation failed");
        }
    };

    const labelStyle = "text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block";
    const inputStyle = "w-full px-4 py-3 bg-slate-50 rounded-xl text-sm font-bold border-2 border-transparent outline-none focus:border-[#7a6af6]/20 focus:bg-white transition-all";

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-[#0F172A]/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-[400px] rounded-[24px] shadow-2xl p-8 relative animate-in zoom-in duration-300">
                <button onClick={onClose} className="absolute top-5 right-5 text-slate-400 hover:text-[#0F172A] transition-colors">
                    <X size={20} />
                </button>

                <div className="mb-6">
                    <h3 className="text-xl font-black text-[#0F172A] uppercase tracking-tight">
                        {mode === "add" ? "New Category" : "Edit Category"}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Primary Catalog Segment</p>
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
                    {/* --- NAME FIELD --- */}
                    <div>
                        <label className={labelStyle}>Category Name *</label>
                        <input
                            {...register("name", {
                                required: "Name is required",
                                validate: {
                                    notEmpty: (val) => val.trim().length > 0 || "Name cannot be empty",
                                    noLeadingSpace: (val) => !/^\s/.test(val) || "Name cannot start with a space",
                                    notOnlySpecialChars: (val) => /[A-Za-z0-9]/.test(val) || "Name must contain meaningful text",
                                    allowedCharacters: (val) => /^[A-Za-z0-9 .,()\-\/&]+$/.test(val) || "Name contains invalid characters",
                                }
                            })}
                            placeholder="e.g., Apparel"
                            className={`${inputStyle} ${errors.name ? "border-red-500 bg-red-50" : ""}`}
                        />
                        {errors.name && <p className="text-[9px] font-black text-red-500 uppercase ml-2 mt-1">{errors.name.message}</p>}
                    </div>

                    {/* --- DESCRIPTION FIELD --- */}
                    <div>
                        <label className={labelStyle}>Description</label>
                        <textarea
                            {...register("description", {
                                required: "Description is required",
                                validate: {
                                    notEmpty: (val) => val.trim().length > 0 || "Description cannot be empty",
                                    noLeadingSpace: (val) => !/^\s/.test(val) || "Description cannot start with a space",
                                    notOnlySpecialChars: (val) => /[A-Za-z0-9]/.test(val) || "Description must contain meaningful text",
                                }
                            })}
                            placeholder="Brief details about this segment..."
                            className={`${inputStyle} h-24 resize-none py-3 ${errors.description ? "border-red-500 bg-red-50" : ""}`}
                        />
                        {errors.description && <p className="text-[9px] font-black text-red-500 uppercase ml-2 mt-1">{errors.description.message}</p>}
                    </div>

                    {/* --- OFFER SELECTION (NEW) --- */}
                    <div>
                        <label className={labelStyle}>Campaign / Offer Rule</label>
                        <div className="relative">
                            <select
                                {...register("offerId")}
                                className={`${inputStyle} appearance-none cursor-pointer pr-10`}
                            >
                                <option value="">Standard Pricing (No Offer)</option>
                                {categoryOffers.map((offer) => (
                                    <option key={offer._id} value={offer._id}>
                                        {offer.title} — {offer.discountValue}% OFF
                                    </option>
                                ))}
                            </select>
                            <Percent size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                        <p className="text-[7px] text-slate-400 font-bold uppercase mt-1 ml-1 tracking-widest italic">Applied to all products in this category</p>
                    </div>

                    {/* --- STATUS TOGGLE --- */}
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Status</span>
                        <input
                            type="checkbox"
                            {...register("isActive")}
                            className="w-4 h-4 accent-[#0F172A] cursor-pointer"
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
                                className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-600 hover:border-[#0F172A] hover:text-[#0F172A] hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
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