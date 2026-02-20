import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Extended FAQ data
const ALL_FAQS = [
    // Getting Started
    { category: "Getting Started", q: "Is this platform free to play?", a: "Yes! Every new player starts with 10,000 free chips. You can earn more through daily bonuses, missions, and winning at the tables." },
    { category: "Getting Started", q: "How do I create an account?", a: "Click 'Start Playing' on the homepage, fill in your details, verify your email, and you're ready to go!" },
    { category: "Getting Started", q: "What poker variants are available?", a: "Currently we support No-Limit Texas Hold'em. Omaha and Short Deck are in development." },
    { category: "Getting Started", q: "Can I play on mobile?", a: "Yes, BestPoker.Cash is fully responsive and works directly in your mobile browser. Native apps coming soon." },
    { category: "Getting Started", q: "Do I need to download software?", a: "No downloads required! Play directly in your browser on any device." },

    // Account & Security
    { category: "Account & Security", q: "How do I verify my account?", a: "Go to your profile settings and upload a government-issued ID. Verification typically takes 24 hours." },
    { category: "Account & Security", q: "Is my personal information safe?", a: "Absolutely. We use bank-grade encryption and never share your data with third parties." },
    { category: "Account & Security", q: "What if I forget my password?", a: "Click 'Forgot Password' on the login page and follow the email instructions to reset it." },
    { category: "Account & Security", q: "Can I change my username?", a: "Usernames can be changed once every 30 days from your profile settings." },
    { category: "Account & Security", q: "How do I enable two-factor authentication?", a: "Go to Settings > Security and enable 2FA using your preferred authenticator app." },

    // Virtual Chips & Shop
    { category: "Virtual Chips & Shop", q: "How do I get more chips?", a: "You can claim free chips daily, complete missions, or top up your balance by purchasing chip packs in our virtual shop." },
    { category: "Virtual Chips & Shop", q: "What payment methods do you accept?", a: "Our shop supports all major credit cards and app store payments for chip pack purchases." },
    { category: "Virtual Chips & Shop", q: "Are chips worth real money?", a: "No. Chips are virtual currency for entertainment purposes only and have no real-world monetary value." },
    { category: "Virtual Chips & Shop", q: "Can I transfer chips to friends?", a: "Currently, chips cannot be transferred between accounts to ensure fair play and prevent farming." },
    { category: "Virtual Chips & Shop", q: "Does ranking affect my chips?", a: "Higher ranks provide larger daily bonuses and better multipliers, helping you grow your chip stack faster!" },

    // Gameplay
    { category: "Gameplay", q: "Is the game fair?", a: "Absolutely. We use a certified RNG (Random Number Generator) and have 24/7 anti-cheat monitoring." },
    { category: "Gameplay", q: "Can I play multiple tables at once?", a: "Yes! Premium members can play up to 6 tables simultaneously." },
    { category: "Gameplay", q: "What are the blinds and buy-ins?", a: "We offer tables from micro stakes (10/20 chips) to high-roller tables (25,000/50,000 chips) to suit all players." },
    { category: "Gameplay", q: "What are the rules of the house?", a: "We follow standard TDA rules. Our focus is on providing a fun, competitive, and fair environment for everyone." },
    { category: "Gameplay", q: "Can I chat with other players?", a: "Yes, each table has a chat feature. Please keep it respectful - our moderators monitor all conversations." },

    // Technical Support
    { category: "Technical Support", q: "The game is lagging, what should I do?", a: "Try refreshing your browser, clearing cache, or switching to a wired connection. Contact support if issues persist." },
    { category: "Technical Support", q: "I got disconnected during a hand, what happens?", a: "You'll be automatically set to 'sit out' and can rejoin. Your chips remain safe at the table." },
    { category: "Technical Support", q: "Which browsers are supported?", a: "We recommend Chrome, Firefox, Safari, or Edge (latest versions) for the best experience." },
    { category: "Technical Support", q: "How do I report a bug?", a: "Use the 'Report Bug' button in the settings menu or email support@pokerpro.com with details." },
    { category: "Technical Support", q: "Can I play from any country?", a: "We're available in most countries. Check our Terms of Service for the complete list of restricted regions." },
];

const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border border-white/5 rounded-xl bg-surface overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-white/5 transition-colors"
            >
                <span className="font-bold text-white pr-4">{question}</span>
                <span className={`material-symbols-outlined text-slate-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}>
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
        </div>
    );
};

const FAQPage = () => {
    const categories = Array.from(new Set(ALL_FAQS.map(faq => faq.category)));

    return (
        <div className="min-h-screen bg-background pt-32 pb-20">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="text-4xl lg:text-5xl font-display font-bold text-white mb-4">
                            Frequently Asked Questions
                        </h1>
                        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                            Find answers to common questions about BestPoker.Cash. Can't find what you're looking for? Contact our support team.
                        </p>
                    </motion.div>
                </div>

                {/* FAQ Categories */}
                <div className="max-w-4xl mx-auto space-y-12">
                    {categories.map((category, catIndex) => (
                        <motion.div
                            key={category}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: catIndex * 0.1 }}
                        >
                            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                                <span className="w-1 h-8 bg-primary rounded-full"></span>
                                {category}
                            </h2>
                            <div className="space-y-4">
                                {ALL_FAQS.filter(faq => faq.category === category).map((faq, i) => (
                                    <div key={`${category}-${i}`}>
                                        <FAQItem question={faq.q} answer={faq.a} />
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Contact Support CTA */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    className="mt-20 text-center"
                >
                    <div className="bg-surface border border-white/5 rounded-2xl p-10 max-w-2xl mx-auto">
                        <h3 className="text-2xl font-bold text-white mb-4">Still have questions?</h3>
                        <p className="text-slate-400 mb-6">Our support team is available 24/7 to help you.</p>
                        <a
                            href="mailto:support@pokerpro.com"
                            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-full font-bold transition-all"
                        >
                            <span className="material-symbols-outlined">mail</span>
                            Contact Support
                        </a>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default FAQPage;
