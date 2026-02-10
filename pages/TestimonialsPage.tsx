import React, { useState } from 'react';
import { motion } from 'framer-motion';

// Generate 1000 testimonials
const generateTestimonials = (count: number) => {
    const firstNames = ['Alex', 'Sarah', 'Mike', 'Emily', 'David', 'Jessica', 'Chris', 'Amanda', 'Ryan', 'Lisa', 'Tom', 'Rachel', 'Kevin', 'Nicole', 'Brian', 'Megan', 'Jason', 'Ashley', 'Daniel', 'Lauren'];
    const lastInitials = ['K', 'J', 'T', 'R', 'L', 'M', 'S', 'W', 'B', 'C', 'H', 'P', 'G', 'D', 'F', 'N', 'V', 'A', 'E', 'Z'];
    const roles = ['Pro Player', 'Casual Player', 'Tournament Grinder', 'Newbie', 'High Roller', 'Weekend Warrior', 'Cash Game Specialist', 'Sit & Go Expert', 'Poker Enthusiast', 'Semi-Pro'];
    const testimonialTexts = [
        'The interface is slick with basically zero lag. Best platform I\'ve used in years.',
        'I love the community features. Learning from others has improved my game significantly.',
        'The tournament structures are fantastic. Great prize pools and smooth gameplay.',
        'Very beginner friendly. The academia section helped me understand the basics quickly.',
        'Security is top notch. I feel safe depositing large amounts here.',
        'Fast withdrawals and excellent customer support. Highly recommended!',
        'The mobile experience is seamless. I can play anywhere, anytime.',
        'Great variety of stakes. Perfect for both beginners and pros.',
        'The analytics dashboard helps me track my progress and improve my strategy.',
        'Best poker platform I\'ve ever used. Clean design and fair gameplay.',
        'Love the rewards program. I\'ve earned so many bonuses!',
        'The anti-cheat system gives me confidence that every game is fair.',
        'Instant deposits and quick withdrawals. No hassle at all.',
        'The community is friendly and helpful. Great place to learn.',
        'Professional platform with top-tier security. I trust them completely.',
    ];

    const testimonials = [];
    for (let i = 0; i < count; i++) {
        const firstName = firstNames[i % firstNames.length];
        const lastInitial = lastInitials[Math.floor(i / firstNames.length) % lastInitials.length];
        const role = roles[i % roles.length];
        const text = testimonialTexts[i % testimonialTexts.length];
        const avatarSeed = `user${i}`;

        testimonials.push({
            id: i + 1,
            name: `${firstName} ${lastInitial}.`,
            role,
            text,
            avatar: `https://i.pravatar.cc/150?u=${avatarSeed}`,
            rating: 5,
        });
    }
    return testimonials;
};

const ALL_TESTIMONIALS = generateTestimonials(1000);

const TestimonialCard = ({ testimonial }: { testimonial: typeof ALL_TESTIMONIALS[0] }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.4 }}
            className="p-6 rounded-2xl bg-surface border border-white/5 hover:border-primary/20 transition-all h-full flex flex-col"
        >
            <div className="flex items-center gap-4 mb-4">
                <img src={testimonial.avatar} alt={testimonial.name} className="w-12 h-12 rounded-full border border-primary/20" />
                <div>
                    <h4 className="text-white font-bold">{testimonial.name}</h4>
                    <p className="text-xs text-primary">{testimonial.role}</p>
                </div>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed italic flex-1">"{testimonial.text}"</p>
            <div className="mt-4 flex gap-1 text-gold text-xs">
                {"★★★★★".split("").map((s, i) => <span key={i}>{s}</span>)}
            </div>
        </motion.div>
    );
};

const TestimonialsPage = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 24;
    const totalPages = Math.ceil(ALL_TESTIMONIALS.length / itemsPerPage);

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentTestimonials = ALL_TESTIMONIALS.slice(startIndex, endIndex);

    const goToPage = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 7;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 4) {
                for (let i = 1; i <= 5; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 3) {
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
            } else {
                pages.push(1);
                pages.push('...');
                for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            }
        }
        return pages;
    };

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
                            Player Testimonials
                        </h1>
                        <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-2">
                            Join thousands of satisfied players who trust Poker Pro.
                        </p>
                        <p className="text-primary font-bold">
                            {ALL_TESTIMONIALS.length.toLocaleString()} reviews and counting!
                        </p>
                    </motion.div>
                </div>

                {/* Stats */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 max-w-4xl mx-auto"
                >
                    <div className="bg-surface border border-white/5 rounded-xl p-6 text-center">
                        <div className="text-3xl font-bold text-white mb-2">5.0</div>
                        <div className="text-gold mb-2">★★★★★</div>
                        <div className="text-sm text-slate-400">Average Rating</div>
                    </div>
                    <div className="bg-surface border border-white/5 rounded-xl p-6 text-center">
                        <div className="text-3xl font-bold text-white mb-2">{ALL_TESTIMONIALS.length.toLocaleString()}</div>
                        <div className="text-sm text-slate-400">Total Reviews</div>
                    </div>
                    <div className="bg-surface border border-white/5 rounded-xl p-6 text-center">
                        <div className="text-3xl font-bold text-white mb-2">100%</div>
                        <div className="text-sm text-slate-400">Recommended</div>
                    </div>
                </motion.div>

                {/* Testimonials Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
                    {currentTestimonials.map((testimonial) => (
                        <div key={testimonial.id}>
                            <TestimonialCard testimonial={testimonial} />
                        </div>
                    ))}
                </div>

                {/* Pagination */}
                <div className="flex flex-col items-center gap-6">
                    <div className="flex items-center gap-2 flex-wrap justify-center">
                        <button
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-4 py-2 rounded-lg bg-surface border border-white/5 text-white hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            <span className="material-symbols-outlined text-sm">chevron_left</span>
                        </button>

                        {getPageNumbers().map((page, index) => (
                            page === '...' ? (
                                <span key={`ellipsis-${index}`} className="px-2 text-slate-500">...</span>
                            ) : (
                                <button
                                    key={page}
                                    onClick={() => goToPage(page as number)}
                                    className={`px-4 py-2 rounded-lg border transition-all ${currentPage === page
                                        ? 'bg-primary border-primary text-white'
                                        : 'bg-surface border-white/5 text-white hover:bg-white/5'
                                        }`}
                                >
                                    {page}
                                </button>
                            )
                        ))}

                        <button
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 rounded-lg bg-surface border border-white/5 text-white hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            <span className="material-symbols-outlined text-sm">chevron_right</span>
                        </button>
                    </div>

                    <p className="text-slate-500 text-sm">
                        Page {currentPage} of {totalPages} ({startIndex + 1}-{Math.min(endIndex, ALL_TESTIMONIALS.length)} of {ALL_TESTIMONIALS.length} reviews)
                    </p>
                </div>
            </div>
        </div>
    );
};

export default TestimonialsPage;
