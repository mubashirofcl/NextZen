import React, { useState } from 'react';
import { Instagram, Twitter, Facebook, Youtube, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUserCategories } from '../../hooks/user/useUserCategories';
import userAxios from '../../api/user/userAxios';
import { nxToast } from '../../utils/userToast.jsx';

const Footer = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle'); // idle | loading | success

    const { data: categories = [] } = useUserCategories();

    const handleCategoryClick = (category) => {
        navigate(`/shop?category=${category._id}`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleNavigate = (path) => {
        navigate(path);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleNewsletterSubmit = async (e) => {
        e.preventDefault();

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            nxToast.security("Invalid Email", "Please enter a valid email address.");
            return;
        }

        setStatus('loading');
        try {
            const { data } = await userAxios.post('/newsletter/subscribe', { email });
            if (data.success) {
                nxToast.success("Subscribed!", data.message);
                setEmail('');
                setStatus('success');
                setTimeout(() => setStatus('idle'), 3000);
            }
        } catch (err) {
            const message = err.response?.data?.message || "Something went wrong. Try again.";
            if (err.response?.status === 409) {
                nxToast.success("Already Subscribed", message);
            } else {
                nxToast.security("Subscription Failed", message);
            }
            setStatus('idle');
        }
    };

    return (
        <footer className="bg-transparent text-white pt-16 pb-8 px-6 md:px-12 border-t border-white/10 rounded-t-[1.2rem] mt-20 relative z-10">
            <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">

                <div className="space-y-6 text-center md:text-left">
                    <h2 className="text-2xl font-black tracking-tighter uppercase italic leading-none cursor-pointer" onClick={() => handleNavigate('/')}>
                        NEXT<span className="text-[#7a6af6]">ZEN</span>
                    </h2>
                    <p className="text-white/20 text-[10px] font-bold uppercase tracking-[0.2em] leading-relaxed max-w-[280px] mx-auto md:mx-0">
                        The premium archive for bold craftsmanship and streetwear aesthetics.
                    </p>
                    <div className="flex justify-center md:justify-start gap-5">
                        {[
                            { Icon: Instagram, url: 'https://instagram.com' },
                            { Icon: Twitter, url: 'https://twitter.com' },
                            { Icon: Facebook, url: 'https://facebook.com' },
                            { Icon: Youtube, url: 'https://youtube.com' },
                        ].map(({ Icon, url }, i) => (
                            <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                                <Icon
                                    size={16}
                                    className="text-white/30 cursor-pointer hover:text-[#7a6af6] transition-all duration-300 hover:-translate-y-1"
                                />
                            </a>
                        ))}
                    </div>
                </div>

                <div className="text-center md:text-left">
                    <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-[#7a6af6] mb-6">Archive</h3>
                    <ul className="space-y-3 text-[10px] font-bold uppercase tracking-widest text-white/30">
                        {categories.slice(0, 4).map((cat) => (
                            <li
                                key={cat._id}
                                className="hover:text-white cursor-pointer transition-colors"
                                onClick={() => handleCategoryClick(cat)}
                            >
                                {cat.name}
                            </li>
                        ))}
                        <li className="hover:text-white cursor-pointer transition-colors italic border-t border-white/5 pt-2 mt-2" onClick={() => handleNavigate('/shop')}>
                            View All Segments
                        </li>
                    </ul>
                </div>

                <div className="text-center md:text-left">
                    <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-[#7a6af6] mb-6">Manifest</h3>
                    <ul className="space-y-3 text-[10px] font-bold uppercase tracking-widest text-white/30">
                        <li className="hover:text-white cursor-pointer transition-colors" onClick={() => handleNavigate('/shop')}>Shop All</li>
                        <li className="hover:text-white cursor-pointer transition-colors" onClick={() => handleNavigate('/profile/orders')}>Track Order</li>
                        <li className="hover:text-white cursor-pointer transition-colors" onClick={() => handleNavigate('/profile/wallet')}>Digital Wallet</li>
                        <li className="hover:text-white cursor-pointer transition-colors" onClick={() => handleNavigate('/profile/address')}>Logistics Address</li>
                        <li className="hover:text-white cursor-pointer transition-colors" onClick={() => handleNavigate('/wishlist')}>Wishlist</li>
                    </ul>
                </div>

                <div className="text-center md:text-left">
                    <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-[#7a6af6] mb-6">Newsletter</h3>
                    <p className="text-white/20 text-[10px] font-bold uppercase tracking-widest mb-5 leading-relaxed">
                        Secure early access to limited segments.
                    </p>
                    <form onSubmit={handleNewsletterSubmit} className="relative max-w-[300px] mx-auto md:mx-0 group">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="EMAIL ADDRESS"
                            disabled={status === 'loading'}
                            className="bg-white/5 border border-white/10 rounded-full px-5 py-3 text-[9px] font-bold w-full outline-none focus:border-[#7a6af6]/40 transition-all placeholder:text-white/15 uppercase tracking-widest disabled:opacity-50"
                        />
                        <button
                            type="submit"
                            disabled={status === 'loading'}
                            className={`absolute right-1 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all shadow-lg active:scale-90 disabled:opacity-50 ${
                                status === 'success'
                                    ? 'bg-green-500'
                                    : 'bg-[#7a6af6] hover:bg-white hover:text-black'
                            }`}
                        >
                            {status === 'loading' ? (
                                <Loader2 size={12} className="animate-spin" />
                            ) : status === 'success' ? (
                                <CheckCircle2 size={12} />
                            ) : (
                                <ArrowRight size={12} />
                            )}
                        </button>
                    </form>
                </div>
            </div>

            <div className="max-w-[1400px] mx-auto border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center text-[8px] text-white/10 font-black uppercase tracking-[0.3em] gap-6">
                <p>© {new Date().getFullYear()} NextZen Outfit // Crafted for the Bold.</p>
                <div className="flex gap-8">
                    <span className="cursor-pointer hover:text-white transition-colors" onClick={() => handleNavigate('/shop')}>Browse Shop</span>
                    <span className="cursor-pointer hover:text-white transition-colors" onClick={() => handleNavigate('/profile/info')}>My Account</span>
                </div>
            </div>
        </footer>
    );
};

export default Footer;