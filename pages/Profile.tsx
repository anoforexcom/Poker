import React, { useState, useRef } from 'react';
import { useGame } from '../contexts/GameContext';

const AVATAR_PRESETS = [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Zack',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Milo',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Tina',
    'https://api.dicebear.com/7.x/bottts/svg?seed=Bot1',
    'https://api.dicebear.com/7.x/bottts/svg?seed=Bot2',
];

const Profile: React.FC = () => {
    const { user, updateUser } = useGame();
    const [name, setName] = useState(user.name);
    const [isEditing, setIsEditing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSaveName = () => {
        if (name.trim()) {
            updateUser({ name });
            setIsEditing(false);
        }
    };

    const handleAvatarClick = (url: string) => {
        updateUser({ avatar: url });
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            alert("File is too large! Please choose an image under 2MB.");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const maxSize = 200;

                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxSize) {
                        height *= maxSize / width;
                        width = maxSize;
                    }
                } else {
                    if (height > maxSize) {
                        width *= maxSize / height;
                        height = maxSize;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                ctx?.drawImage(img, 0, 0, width, height);

                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                updateUser({ avatar: dataUrl });
            };
            img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="flex h-full flex-col overflow-y-auto custom-scrollbar p-4 md:p-8">
            <h2 className="text-3xl font-bold text-white tracking-tight font-display mb-8">User Profile</h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Profile Card */}
                <div className="lg:col-span-1">
                    <div className="bg-surface border border-border-dark rounded-2xl p-6 flex flex-col items-center text-center shadow-xl">
                        <div className="relative group mb-4">
                            <img
                                src={user.avatar}
                                alt={user.name}
                                className="size-32 rounded-full border-4 border-primary object-cover shadow-lg"
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-white text-3xl">upload</span>
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileUpload}
                            />
                        </div>

                        {isEditing ? (
                            <div className="flex items-center gap-2 mb-2 w-full">
                                <input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="bg-black/20 border border-primary rounded px-2 py-1 text-white text-center font-bold font-display text-xl w-full outline-none focus:ring-2 ring-primary/50"
                                    autoFocus
                                />
                                <button onClick={handleSaveName} className="text-green-500 hover:text-green-400">
                                    <span className="material-symbols-outlined">check</span>
                                </button>
                            </div>
                        ) : (
                            <h3 className="text-2xl font-bold text-white font-display mb-1 flex items-center gap-2">
                                {user.name}
                                <button onClick={() => setIsEditing(true)} className="text-slate-500 hover:text-white transition-colors">
                                    <span className="material-symbols-outlined text-sm">edit</span>
                                </button>
                            </h3>
                        )}

                        <p className="text-gold font-bold uppercase tracking-wider text-sm mb-6">{user.rank}</p>

                        <div className="grid grid-cols-2 gap-4 w-full">
                            <div className="bg-black/20 rounded-xl p-3">
                                <p className="text-slate-400 text-xs uppercase font-bold">Balance</p>
                                <p className="text-white font-mono font-bold text-lg">${user.balance.toLocaleString()}</p>
                            </div>
                            <div className="bg-black/20 rounded-xl p-3">
                                <p className="text-slate-400 text-xs uppercase font-bold">Level</p>
                                <p className="text-white font-mono font-bold text-lg">42</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Edit & Settings */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Avatar Selection */}
                    <section>
                        <h3 className="text-xl font-bold text-white mb-4">Choose Avatar</h3>
                        <div className="bg-surface/50 border border-border-dark rounded-xl p-6">
                            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
                                {AVATAR_PRESETS.map((url, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleAvatarClick(url)}
                                        className={`rounded-full overflow-hidden border-2 transition-all hover:scale-110 ${user.avatar === url ? 'border-primary ring-2 ring-primary/50' : 'border-transparent hover:border-white/50'}`}
                                    >
                                        <img src={url} className="w-full h-full bg-slate-800" alt={`Avatar ${i}`} />
                                    </button>
                                ))}
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="aspect-square rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center text-slate-500 hover:text-white hover:border-white transition-colors"
                                >
                                    <span className="material-symbols-outlined">add_photo_alternate</span>
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* Account Settings Placeholder */}
                    <section>
                        <h3 className="text-xl font-bold text-white mb-4">Account Settings</h3>
                        <div className="bg-surface/50 border border-border-dark rounded-xl p-6 space-y-4">
                            <div className="flex items-center justify-between p-3 bg-black/10 rounded-lg">
                                <div>
                                    <p className="text-white font-bold">Email Notifications</p>
                                    <p className="text-slate-400 text-xs">Receive updates about tournaments and promotions</p>
                                </div>
                                <div className="w-10 h-6 bg-poker-green rounded-full relative cursor-pointer">
                                    <div className="absolute right-1 top-1 size-4 bg-white rounded-full shadow-sm"></div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-black/10 rounded-lg">
                                <div>
                                    <p className="text-white font-bold">Sound Effects</p>
                                    <p className="text-slate-400 text-xs">Play sounds during game interactions</p>
                                </div>
                                <div className="w-10 h-6 bg-poker-green rounded-full relative cursor-pointer">
                                    <div className="absolute right-1 top-1 size-4 bg-white rounded-full shadow-sm"></div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default Profile;
