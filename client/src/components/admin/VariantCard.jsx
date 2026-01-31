import React, { useState } from "react";
import { Upload, Trash2, AlertCircle } from "lucide-react";
import CropModal from "./ImageCropModal";
import { cropAndResizeImage } from "../../utils/imageProcessor";
import { adminToast } from "../../utils/adminToast";

const MAX_IMAGES = 6;
const MIN_IMAGES = 3;
const MAX_FILE_MB = 5;

const VariantCard = ({ index, register, watch, onRemove, setValue, errors }) => {
    const hexColor = watch(`variants.${index}.hex`);
    const images = watch(`variants.${index}.images`) || [];
    const sizes = watch(`variants.${index}.sizes`) || [];

    const [cropSrc, setCropSrc] = useState(null);

    const imageError = errors?.variants?.[index]?.images;

    const handleFiles = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) return adminToast.warn("Invalid File", "Images only");
        if (file.size > MAX_FILE_MB * 1024 * 1024) return adminToast.warn("Too Large", "Max 5MB");
        if (images.length >= MAX_IMAGES) return adminToast.warn("Limit", "Max 6 images");

        const reader = new FileReader();
        reader.onload = () => setCropSrc(reader.result);
        reader.readAsDataURL(file);
        e.target.value = "";
    };

    return (
        <div className={`bg-white rounded-[24px] p-6 shadow-xl border relative mt-3 animate-in zoom-in-95 ${imageError ? 'border-red-200 ring-4 ring-red-50' : 'border-slate-100'}`}>

            {/* REGISTER HIDDEN IMAGE ARRAY FOR VALIDATION */}
            <input
                type="hidden"
                {...register(`variants.${index}.images`, {
                    validate: (val) => val?.length >= MIN_IMAGES || `At least ${MIN_IMAGES} images are required`
                })}
            />
            <input type="hidden" {...register(`variants.${index}._id`)} />

            {cropSrc && (
                <CropModal
                    src={cropSrc}
                    onCancel={() => setCropSrc(null)}
                    onConfirm={async (p) => {
                        const b64 = await cropAndResizeImage(cropSrc, p);
                        setValue(`variants.${index}.images`, [...images, b64], { shouldValidate: true });
                        setCropSrc(null);
                    }}
                />
            )}

            <button type="button" onClick={onRemove} className="absolute top-6 right-6 p-1.5 text-slate-300 hover:text-red-500 rounded-lg transition-all"><Trash2 size={16} /></button>

            {/* COLOR SECTION */}
            <div className="flex flex-col lg:flex-row lg:items-center gap-6 mb-6 pb-6 border-b border-slate-50">
                <div className="w-20 h-20 rounded-[12px] shadow-lg border-4 border-white flex-shrink-0" style={{ backgroundColor: hexColor }} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Color Name</label>
                        <input {...register(`variants.${index}.color`, { required: "Color name required" })} className="w-full bg-white border-2 border-slate-100 focus:border-[#7a6af6] rounded-xl px-4 py-2 text-xs font-bold text-[#0F172A] outline-none shadow-sm" placeholder="Color Name" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Hex Code</label>
                        <div className="flex gap-2">
                            <input value={hexColor} disabled className="flex-1 bg-slate-50 border-2 border-slate-50 rounded-xl px-4 py-2 text-[10px] font-black uppercase text-slate-400 outline-none" />
                            <input type="color" {...register(`variants.${index}.hex`)} className="w-10 h-10 rounded-xl cursor-pointer bg-white border-2 border-slate-100 p-1 hover:border-[#7a6af6] transition-all" />
                        </div>
                    </div>
                </div>
            </div>

            {/* SIZE TABLE */}
            <div className="bg-white border border-slate-100 rounded-[16px] overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-[#0F172A] text-[8px] font-black uppercase tracking-widest text-white/90">
                        <tr>
                            <th className="px-4 py-3 text-center w-16 border-r border-white/10">Size</th>
                            <th className="px-4 py-3 text-center border-r border-white/10">Stock</th>
                            <th className="px-4 py-3 text-center border-r border-white/10">Market (₹)</th>
                            <th className="px-4 py-3 text-center">Retail (₹)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {sizes.map((s, sIdx) => {
                            const path = `variants.${index}.sizes.${sIdx}`;
                            const stockVal = watch(`${path}.stock`);
                            const isDirty = stockVal !== "" && stockVal != null;
                            const sizeError = errors?.variants?.[index]?.sizes?.[sIdx];

                            return (
                                <tr key={sIdx} className="hover:bg-slate-50/50">
                                    <td className="px-4 py-3 text-center bg-slate-50/50 border-r border-slate-100">
                                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[10px] font-black text-[#0F172A] mx-auto shadow-sm">{s.size}</div>
                                    </td>
                                    <td className="px-4 py-3 text-center border-r border-slate-100">
                                        <input type="number" {...register(`${path}.stock`)} className={`w-20 bg-white border-2 rounded-lg px-2 py-1.5 text-center text-xs font-bold outline-none ${sizeError?.stock ? 'border-red-500 bg-red-50' : 'border-slate-100 focus:border-[#7a6af6]'}`} />
                                    </td>
                                    <td className="px-4 py-3 text-center border-r border-slate-100">
                                        <input type="number" step="0.01" {...register(`${path}.originalPrice`)} className={`w-24 bg-white border-2 rounded-lg px-2 py-1.5 text-center text-xs font-bold outline-none ${sizeError?.originalPrice ? 'border-red-500 bg-red-50' : 'border-slate-100 focus:border-[#7a6af6]'}`} />
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <input type="number" step="0.01" {...register(`${path}.salePrice`)} className={`w-24 bg-white border-2 rounded-lg px-2 py-1.5 text-center text-xs font-bold text-[#7a6af6] outline-none ${sizeError?.salePrice ? 'border-red-500' : 'border-slate-100 focus:border-[#7a6af6]'}`} />
                                    </td>
                                    <input type="hidden" {...register(`${path}.size`)} value={s.size} />
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* ASSET UPLOAD */}
            <div className="mt-6 pt-6 border-t border-slate-50">
                <div className="flex justify-between items-center mb-3 px-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Variant Gallery (Min 3)</label>
                    {imageError && (
                        <span className="flex items-center gap-1 text-[9px] font-black text-red-500 uppercase animate-pulse">
                            <AlertCircle size={10} /> {imageError.message}
                        </span>
                    )}
                </div>

                <div className="flex flex-wrap gap-4">
                    {images.map((img, i) => (
                        <div key={i} className="group relative w-24 h-24 rounded-[16px] border-2 border-white overflow-hidden shadow-lg transition-all hover:scale-105">
                            <img src={img} className="w-full h-full object-cover" alt="preview" />
                            <button
                                type="button"
                                onClick={() => {
                                    const filtered = images.filter((_, idx) => idx !== i);
                                    setValue(`variants.${index}.images`, filtered, { shouldValidate: true });
                                }}
                                className="absolute inset-0 bg-red-500/80 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    ))}
                    {images.length < MAX_IMAGES && (
                        <label className={`w-24 h-24 border-2 border-dashed rounded-[16px] flex flex-col items-center justify-center cursor-pointer transition-all active:scale-95 shadow-sm group ${imageError ? 'border-red-300 bg-red-50/50 text-red-400' : 'border-slate-200 text-slate-300 hover:border-[#7a6af6] hover:bg-white'}`}>
                            <Upload size={20} className="mb-1 group-hover:animate-bounce" />
                            <span className="text-[7px] font-black uppercase text-center px-1">Add Asset<br />({images.length}/{MAX_IMAGES})</span>
                            <input type="file" hidden onChange={handleFiles} />
                        </label>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VariantCard;