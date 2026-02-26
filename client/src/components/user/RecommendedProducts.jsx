import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Percent } from 'lucide-react';

const RecommendedSection = ({ products = [] }) => {
    const navigate = useNavigate();

    if (!products || products.length === 0) return null;

    return (
        <section className="mt-24 space-y-10 pb-20">
            <h3 className="text-[clamp(1.5rem,4vw,2.5rem)] font-black uppercase tracking-tighter italic text-white/90 text-center">
                You might also like
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-10">
                {products.slice(0, 4).map((p) => {
                    const activeDiscount = Number(p.discountValue || 0);
                    const hasOffer = activeDiscount > 0;

                    return (
                        <div
                            key={p._id}
                            onClick={() => navigate(`/product/${p._id}`)}
                            className="group cursor-pointer space-y-4"
                        >

                            <div className="aspect-[3/4] bg-white/[0.02] border border-white/10 rounded-[2rem] overflow-hidden relative shadow-2xl transition-all duration-500 hover:border-[#7a6af6]/40">
                                <img 
                                    src={p.thumbnail} 
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100" 
                                    alt={p.name} 
                                />

                                {hasOffer && (
                                    <div className="absolute top-4 left-4 z-20 animate-in slide-in-from-left-2 duration-500">
                                        <div className="bg-[#7a6af6] text-white px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-[0_0_20px_rgba(122,106,246,0.4)] border border-white/20">
                                            <Percent size={10} strokeWidth={4} />
                                            <span className="text-[9px] font-black italic tracking-tighter">
                                                {activeDiscount}% DROP
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
      
                            <div className="px-2 space-y-1">
                                <h4 className="text-[11px] font-black uppercase tracking-tight text-white/60 group-hover:text-[#7a6af6] transition-colors truncate italic">
                                    {p.name}
                                </h4>
                                
                                <div className="flex items-center gap-3">
                                    <p className={`text-[15px] font-black italic ${hasOffer ? 'text-[#7a6af6]' : 'text-white'}`}>
                                        ₹{(p.minSalePrice || p.minPrice)?.toLocaleString()}
                                    </p>
                                    
                                    {hasOffer && (
                                        <span className="text-[10px] font-bold text-white/20 line-through">
                                            ₹{p.minOriginalPrice?.toLocaleString()}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
};

export default RecommendedSection;