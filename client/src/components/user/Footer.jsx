import React from 'react';
import { Instagram, Twitter, Facebook, Youtube, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Footer = () => {
    const navigate = useNavigate();

    return (
        <footer className="bg-transparent text-white pt-16 pb-8 px-6 md:px-12 border-t border-white/10 rounded-t-[1.2rem] mt-20">
            <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">

                {/* BRAND BLOCK */}
                <div className="space-y-6 text-center md:text-left">
                    <h2 className="text-2xl font-black tracking-tighter uppercase italic leading-none cursor-pointer" onClick={() => navigate('/')}>
                        NEXT<span className="text-[#7a6af6]">ZEN</span>
                    </h2>
                    <p className="text-white/20 text-[10px] font-bold uppercase tracking-[0.2em] leading-relaxed max-w-[280px] mx-auto md:mx-0">
                        The premium archive for bold craftsmanship and streetwear aesthetics.
                    </p>
                    <div className="flex justify-center md:justify-start gap-5">
                        {[Instagram, Twitter, Facebook, Youtube].map((Icon, i) => (
                            <Icon
                                key={i}
                                size={16}
                                className="text-white/30 cursor-pointer hover:text-[#7a6af6] transition-all duration-300 hover:-translate-y-1"
                            />
                        ))}
                    </div>
                </div>

                {/* CATEGORIES */}
                <div className="text-center md:text-left">
                    <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-[#7a6af6] mb-6">Archive</h3>
                    <ul className="space-y-3 text-[10px] font-bold uppercase tracking-widest text-white/30">
                        <li className="hover:text-white cursor-pointer transition-colors" onClick={() => navigate('/shop')}>Apparel</li>
                        <li className="hover:text-white cursor-pointer transition-colors" onClick={() => navigate('/shop')}>Hoodies</li>
                        <li className="hover:text-white cursor-pointer transition-colors" onClick={() => navigate('/shop')}>Accessories</li>
                    </ul>
                </div>

                {/* SERVICE */}
                <div className="text-center md:text-left">
                    <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-[#7a6af6] mb-6">Service</h3>
                    <ul className="space-y-3 text-[10px] font-bold uppercase tracking-widest text-white/30">
                        <li className="hover:text-white cursor-pointer transition-colors">Track Order</li>
                        <li className="hover:text-white cursor-pointer transition-colors">Logistics</li>
                        <li className="hover:text-white cursor-pointer transition-colors">Size Guide</li>
                    </ul>
                </div>

                {/* NEWSLETTER */}
                <div className="text-center md:text-left">
                    <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-[#7a6af6] mb-6">Newsletter</h3>
                    <p className="text-white/20 text-[10px] font-bold uppercase tracking-widest mb-5 leading-relaxed">
                        Secure early access to limited segments.
                    </p>
                    <div className="relative max-w-[300px] mx-auto md:mx-0 group">
                        <input
                            type="email"
                            placeholder="EMAIL ADDRESS"
                            className="bg-white/5 border border-white/10 rounded-full px-5 py-3 text-[9px] font-bold w-full outline-none focus:border-[#7a6af6]/40 transition-all placeholder:text-white/5 uppercase tracking-widest"
                        />
                        <button className="absolute right-1 top-1/2 -translate-y-1/2 bg-[#7a6af6] p-2 rounded-full hover:bg-white hover:text-black transition-all shadow-lg">
                            <ArrowRight size={12} />
                        </button>
                    </div>
                </div>
            </div>

            {/* COPYRIGHT BAR */}
            <div className="max-w-[1400px] mx-auto border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center text-[8px] text-white/10 font-black uppercase tracking-[0.3em] gap-6">
                <p>© 2026 NextZen Outfit // Crafted for the Bold.</p>
                <div className="flex gap-8">
                    <span className="cursor-pointer hover:text-white transition-colors">Privacy</span>
                    <span className="cursor-pointer hover:text-white transition-colors">Terms</span>
                </div>
            </div>
        </footer>
    );
};

export default Footer;