import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const PublicNavbar = () => {
    const [scrolled, setScrolled] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const isHome = location.pathname === '/';

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-background/80 backdrop-blur-md border-b border-white/10 py-4' : 'bg-transparent py-6'}`}>
            <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2 group">
                    <img src="/logo.png" className="size-10 rounded-xl group-hover:scale-110 transition-transform object-cover" alt="Logo" />
                    <span className="text-xl font-display font-bold text-white tracking-tight">BESTPOKER.CASH</span>
                </Link>

                <div className="hidden md:flex items-center gap-8">
                    <Link to="/" className="text-slate-300 hover:text-white transition-colors text-sm font-medium">Home</Link>
                    <Link to="/features" className="text-slate-300 hover:text-white transition-colors text-sm font-medium">Features</Link>
                    <Link to="/testimonials" className="text-slate-300 hover:text-white transition-colors text-sm font-medium">Testimonials</Link>
                    <Link to="/faq" className="text-slate-300 hover:text-white transition-colors text-sm font-medium">FAQ</Link>
                </div>

                <div className="flex items-center gap-4">
                    <Link to="/login" className="text-slate-300 hover:text-white font-medium text-sm hidden md:block">Log In</Link>
                    <Link to="/register" className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-full font-bold text-sm transition-all hover:shadow-lg hover:shadow-primary/25">
                        Start Playing
                    </Link>
                </div>
            </div>
        </nav>
    );
};

const Footer = () => {
    return (
        <footer className="bg-surface border-t border-white/5 pt-16 pb-8">
            <div className="container mx-auto px-4 md:px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <img src="/logo.png" className="size-10 rounded-xl object-cover" alt="Logo" />
                            <span className="text-xl font-display font-bold text-white">BESTPOKER.CASH</span>
                        </div>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            The most advanced poker platform for professionals and enthusiasts. Experience the thrill of the game with state-of-the-art technology at BestPoker.Cash.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-white font-bold mb-4">Platform</h3>
                        <ul className="space-y-2">
                            <li><Link to="/" className="text-slate-400 hover:text-primary text-sm transition-colors">Home</Link></li>
                            <li><Link to="/tournaments" className="text-slate-400 hover:text-primary text-sm transition-colors">Tournaments</Link></li>
                            <li><Link to="/features" className="text-slate-400 hover:text-primary text-sm transition-colors">Features</Link></li>
                            <li><Link to="/download" className="text-slate-400 hover:text-primary text-sm transition-colors">Download App</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-white font-bold mb-4">Support</h3>
                        <ul className="space-y-2">
                            <li><Link to="/faq" className="text-slate-400 hover:text-primary text-sm transition-colors">Help Center</Link></li>
                            <li><Link to="/contact" className="text-slate-400 hover:text-primary text-sm transition-colors">Contact Us</Link></li>
                            <li><Link to="/terms" className="text-slate-400 hover:text-primary text-sm transition-colors">Terms of Service</Link></li>
                            <li><Link to="/privacy" className="text-slate-400 hover:text-primary text-sm transition-colors">Privacy Policy</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-white font-bold mb-4">Community</h3>
                        <div className="flex items-center gap-3">
                            {/* Discord */}
                            <a href="#" className="bg-[#5865F2] hover:bg-[#4752C4] p-2.5 rounded-lg transition-all hover:scale-110 shadow-lg" title="Discord Server">
                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                                </svg>
                            </a>

                            {/* Twitter / X */}
                            <a href="#" className="bg-black hover:bg-gray-900 p-2.5 rounded-lg transition-all hover:scale-110 shadow-lg" title="Twitter / X">
                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                </svg>
                            </a>

                            {/* Instagram */}
                            <a href="#" className="bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] hover:opacity-90 p-2.5 rounded-lg transition-all hover:scale-110 shadow-lg" title="Instagram">
                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                </svg>
                            </a>

                            {/* YouTube */}
                            <a href="#" className="bg-[#FF0000] hover:bg-[#CC0000] p-2.5 rounded-lg transition-all hover:scale-110 shadow-lg" title="YouTube">
                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>

                {/* Payment Methods Section */}
                <div className="border-t border-white/5 pt-8 pb-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex flex-col items-center md:items-start gap-3">
                            <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Accepted Payment Methods</span>
                            <div className="flex items-center gap-3 flex-wrap justify-center md:justify-start">
                                {/* Credit Cards */}
                                <div className="bg-white px-3 py-2 rounded-md flex items-center gap-1.5 shadow-sm">
                                    <span className="text-blue-600 font-black text-sm">VISA</span>
                                </div>
                                <div className="bg-gradient-to-r from-red-600 to-orange-500 px-3 py-2 rounded-md flex items-center gap-1.5 shadow-sm">
                                    <span className="text-white font-black text-sm">MC</span>
                                </div>

                                {/* Crypto */}
                                <div className="bg-orange-500 px-3 py-2 rounded-md flex items-center gap-1.5 shadow-sm">
                                    <span className="text-white font-black text-xs">₿</span>
                                    <span className="text-white font-bold text-xs">BTC</span>
                                </div>
                                <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-3 py-2 rounded-md flex items-center gap-1.5 shadow-sm">
                                    <span className="text-white font-black text-xs">◆</span>
                                    <span className="text-white font-bold text-xs">ETH</span>
                                </div>
                                <div className="bg-green-600 px-3 py-2 rounded-md flex items-center gap-1.5 shadow-sm">
                                    <span className="text-white font-black text-xs">₮</span>
                                    <span className="text-white font-bold text-xs">USDT</span>
                                </div>

                                {/* E-wallets */}
                                <div className="bg-blue-600 px-3 py-2 rounded-md shadow-sm">
                                    <span className="text-white font-black text-sm">PayPal</span>
                                </div>
                                <div className="bg-purple-600 px-3 py-2 rounded-md shadow-sm">
                                    <span className="text-white font-black text-sm">Skrill</span>
                                </div>
                                <div className="bg-green-700 px-3 py-2 rounded-md shadow-sm">
                                    <span className="text-white font-black text-sm">Neteller</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-center md:items-end gap-2">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-green-500 text-sm">verified</span>
                                <span className="text-slate-400 text-xs">SSL Secured</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-gold text-sm">workspace_premium</span>
                                <span className="text-slate-400 text-xs">Licensed & Regulated</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-slate-500 text-xs text-center md:text-left">
                        © {new Date().getFullYear()} BestPoker.Cash. All rights reserved.
                    </p>
                    <div className="flex items-center gap-6">
                        <span className="text-slate-500 text-xs">18+ Play Responsibly</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export const PublicLayout = () => {
    return (
        <div className="min-h-screen bg-background text-slate-100 font-sans selection:bg-primary/30 selection:text-white">
            <PublicNavbar />
            <main>
                <Outlet />
            </main>
            <Footer />
        </div>
    );
};
