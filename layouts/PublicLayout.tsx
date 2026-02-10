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
                    <div className="bg-primary p-2 rounded-lg group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-white">style</span>
                    </div>
                    <span className="text-xl font-display font-bold text-white tracking-tight">POKER PRO</span>
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
                            <span className="material-symbols-outlined text-primary text-3xl">style</span>
                            <span className="text-xl font-display font-bold text-white">POKER PRO</span>
                        </div>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            The most advanced poker platform for professionals and enthusiasts. Experience the thrill of the game with state-of-the-art technology.
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
                        <ul className="space-y-2">
                            <li><a href="#" className="text-slate-400 hover:text-primary text-sm transition-colors">Discord Server</a></li>
                            <li><a href="#" className="text-slate-400 hover:text-primary text-sm transition-colors">Twitter / X</a></li>
                            <li><a href="#" className="text-slate-400 hover:text-primary text-sm transition-colors">Instagram</a></li>
                            <li><a href="#" className="text-slate-400 hover:text-primary text-sm transition-colors">YouTube</a></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-slate-500 text-xs text-center md:text-left">
                        © {new Date().getFullYear()} Poker Pro Platform. All rights reserved.
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
