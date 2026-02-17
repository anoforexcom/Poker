import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login, continueAsGuest } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            await login(email, password);
            // Redirect to lobby after successful login
            navigate('/play');
        } catch (err: any) {
            setError(err.message || 'Failed to login');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-background flex items-center justify-center p-4 md:py-20 relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-poker-green/10 rounded-full blur-3xl"></div>
            </div>

            <div className="max-w-md w-full bg-surface border border-border-dark rounded-2xl shadow-2xl relative z-10 p-8 sm:p-10">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center mb-4">
                        <img src="/logo.png" className="size-16 rounded-full shadow-lg border border-primary/20 object-cover" alt="Logo" />
                    </div>
                    <h1 className="text-3xl font-black text-white font-display mb-2">BESTPOKER.CASH</h1>
                    <p className="text-slate-400">Welcome back. Ready to fold 'em?</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-lg mb-6 text-sm font-bold flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg">error</span> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email</label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">mail</span>
                            <input
                                type="email"
                                required
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-600"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Password</label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">lock</span>
                            <input
                                type="password"
                                required
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-600"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                        <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-300">
                            <input type="checkbox" className="rounded bg-slate-800 border-slate-600 accent-primary" />
                            <span>Remember me</span>
                        </label>
                        <a href="#" className="text-primary hover:text-blue-400 font-bold">Forgot Password?</a>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-primary hover:bg-blue-600 text-white font-black py-4 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <>
                                <span className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                LOGGING IN...
                            </>
                        ) : (
                            <>
                                LOGIN TO TABLE
                                <span className="material-symbols-outlined">login</span>
                            </>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            continueAsGuest();
                            navigate('/play');
                        }}
                        className="w-full bg-gold hover:bg-yellow-600 text-slate-900 font-black py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                        TRY DEMO
                        <span className="material-symbols-outlined">play_circle</span>
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <Link to="/" className="text-slate-400 hover:text-white text-sm flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-sm">arrow_back</span>
                        Back to Home
                    </Link>
                </div>

                <p className="mt-6 text-center text-slate-400 text-sm">
                    Don't have an account? <Link to="/register" className="text-white font-bold hover:underline">Register Free</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
