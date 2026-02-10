import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const FeaturesPage = () => {
    const features = [
        {
            icon: 'security',
            title: 'Bank-Grade Security',
            description: 'Your funds and data are protected with 256-bit SSL encryption, the same technology used by major financial institutions.',
            benefits: [
                'Two-factor authentication',
                'Cold storage for crypto assets',
                'Regular security audits',
                'PCI DSS compliant'
            ]
        },
        {
            icon: 'speed',
            title: 'Lightning Fast Performance',
            description: 'Experience zero-lag gameplay with our optimized servers distributed globally for the best connection.',
            benefits: [
                'Sub-100ms response time',
                'CDN-powered delivery',
                '99.9% uptime guarantee',
                'Real-time hand updates'
            ]
        },
        {
            icon: 'verified_user',
            title: 'Certified Fair Play',
            description: 'Our RNG (Random Number Generator) is certified by independent auditors to ensure every hand is completely random.',
            benefits: [
                'iTech Labs certified RNG',
                '24/7 anti-cheat monitoring',
                'Hand history verification',
                'Transparent algorithms'
            ]
        },
        {
            icon: 'payments',
            title: 'Instant Transactions',
            description: 'Deposit and withdraw your funds instantly with multiple payment methods including crypto, cards, and bank transfers.',
            benefits: [
                'Instant crypto withdrawals',
                'No deposit fees',
                'Multiple currencies supported',
                'Automated KYC verification'
            ]
        },
        {
            icon: 'groups',
            title: 'Thriving Community',
            description: 'Join thousands of players from around the world. Create clans, compete in leaderboards, and make friends.',
            benefits: [
                'Global player base',
                'Clan tournaments',
                'Live chat support',
                'Community forums'
            ]
        },
        {
            icon: 'school',
            title: 'Poker Academy',
            description: 'Learn from the pros with our comprehensive poker academy featuring tutorials, strategy guides, and video lessons.',
            benefits: [
                'Beginner to advanced courses',
                'Video tutorials',
                'Hand analysis tools',
                'Pro player insights'
            ]
        },
        {
            icon: 'analytics',
            title: 'Advanced Analytics',
            description: 'Track your performance with detailed statistics, hand histories, and AI-powered insights to improve your game.',
            benefits: [
                'Real-time statistics',
                'Hand replay system',
                'Win rate tracking',
                'AI-powered recommendations'
            ]
        },
        {
            icon: 'devices',
            title: 'Multi-Platform',
            description: 'Play seamlessly across all your devices. Start on desktop, continue on mobile - your progress syncs automatically.',
            benefits: [
                'Web, iOS, Android support',
                'Cross-device sync',
                'Responsive design',
                'Native app performance'
            ]
        },
        {
            icon: 'emoji_events',
            title: 'Tournaments & Events',
            description: 'Compete in daily tournaments with guaranteed prize pools, special events, and exclusive high-roller tables.',
            benefits: [
                'Daily freerolls',
                'Guaranteed prize pools',
                'Satellite qualifiers',
                'VIP exclusive events'
            ]
        },
        {
            icon: 'support_agent',
            title: '24/7 Support',
            description: 'Our dedicated support team is available around the clock to help you with any questions or issues.',
            benefits: [
                'Live chat support',
                'Email support',
                'Comprehensive FAQ',
                'Video tutorials'
            ]
        },
        {
            icon: 'workspace_premium',
            title: 'VIP Rewards Program',
            description: 'Earn points with every hand you play and unlock exclusive rewards, cashback, and special privileges.',
            benefits: [
                'Tiered rewards system',
                'Cashback on every hand',
                'Exclusive tournaments',
                'Personal account manager'
            ]
        },
        {
            icon: 'language',
            title: 'Multi-Language Support',
            description: 'Play in your preferred language with support for 20+ languages and localized customer service.',
            benefits: [
                '20+ languages',
                'Localized support',
                'Regional payment methods',
                'Currency conversion'
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-background">
            {/* Hero Section */}
            <section className="relative pt-32 pb-20 overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 via-background to-background" />
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] animate-pulse" />
                </div>

                <div className="container mx-auto px-4 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center max-w-4xl mx-auto"
                    >
                        <h1 className="text-5xl lg:text-6xl font-display font-black text-white mb-6">
                            Everything You Need to <span className="text-primary">Win</span>
                        </h1>
                        <p className="text-xl text-slate-400 mb-8">
                            Poker Pro combines cutting-edge technology with player-first features to deliver the ultimate online poker experience.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                to="/register"
                                className="bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-full font-bold text-lg transition-all hover:scale-105 shadow-xl shadow-primary/25 inline-flex items-center justify-center gap-2"
                            >
                                Get Started Free
                                <span className="material-symbols-outlined">arrow_forward</span>
                            </Link>
                            <Link
                                to="/login"
                                className="px-8 py-4 rounded-full font-bold text-lg text-white border border-white/10 hover:bg-white/5 transition-all inline-flex items-center justify-center gap-2"
                            >
                                Try Demo
                                <span className="material-symbols-outlined">play_circle</span>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-20 bg-surface/30">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{ duration: 0.4, delay: index * 0.05 }}
                                className="bg-surface border border-white/5 rounded-2xl p-8 hover:border-primary/50 transition-all group"
                            >
                                <div className="bg-background/50 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <span className="material-symbols-outlined text-4xl text-primary">{feature.icon}</span>
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-3">{feature.title}</h3>
                                <p className="text-slate-400 mb-6 leading-relaxed">{feature.description}</p>
                                <ul className="space-y-2">
                                    {feature.benefits.map((benefit, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                                            <span className="material-symbols-outlined text-primary text-sm mt-0.5">check_circle</span>
                                            {benefit}
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-32 relative overflow-hidden">
                <div className="absolute inset-0 bg-primary/10"></div>
                <div className="container mx-auto px-4 relative z-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2 className="text-4xl lg:text-5xl font-display font-black text-white mb-8">
                            Ready to Experience the Difference?
                        </h2>
                        <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
                            Join thousands of players who have already discovered the best poker platform.
                        </p>
                        <Link
                            to="/register"
                            className="inline-block bg-white text-primary px-10 py-5 rounded-full font-bold text-xl hover:scale-105 transition-transform shadow-2xl"
                        >
                            Start Playing Now
                        </Link>
                    </motion.div>
                </div>
            </section>
        </div>
    );
};

export default FeaturesPage;
