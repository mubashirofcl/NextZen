import React from 'react';
import { useNavigate } from 'react-router-dom';

const RecommendedSection = ({ products = [] }) => {
    const navigate = useNavigate();

    if (!products || products.length === 0) return null;

    return (
        <section className="mt-24 space-y-10 pb-20">
            <h3 className="text-[clamp(1.5rem,4vw,2.5rem)] font-black uppercase tracking-tighter italic text-white/90 text-center">
                You might also like
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-10">
                {products.slice(0, 4).map((p) => (
                    <div
                        key={p._id}
                        onClick={() => navigate(`/product/${p._id}`)}
                        className="group cursor-pointer space-y-4"
                    >
                        {/* Image Container matching your Nextgen design */}
                        <div className="aspect-[3/4] bg-white/[0.02] border border-white/10 rounded-[2rem] overflow-hidden relative shadow-2xl transition-all duration-500 hover:border-[#7a6af6]/40">
                            <img 
                                src={p.thumbnail} 
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100" 
                                alt={p.name} 
                            />
                        </div>
                        
                        {/* Text Details matching your Shop Card style */}
                        <div className="px-2 space-y-1">
                            <h4 className="text-[11px] font-black uppercase tracking-tight text-white/60 group-hover:text-[#7a6af6] transition-colors truncate italic">
                                {p.name}
                            </h4>
                            {/* Using minSalePrice to match your Repository computation */}
                            <p className="text-[15px] font-black italic text-white">
                                ₹{p.minSalePrice || p.minPrice}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default RecommendedSection;