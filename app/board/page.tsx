'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Music, Send } from 'lucide-react';

interface Post {
    id: string;
    title: string;
    artist: string;
    content: string;
    createdAt: string;
    author: string;
}

export default function BoardPage() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({ title: '', artist: '', content: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            const res = await fetch('/api/posts');
            const data = await res.json();
            setPosts(data);
        } catch (error) {
            console.error('Failed to fetch posts', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const res = await fetch('/api/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                setFormData({ title: '', artist: '', content: '' });
                fetchPosts();
            }
        } catch (error) {
            console.error('Failed to submit post', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in-up pb-20">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/" className="p-2.5 hover:bg-orange-50 rounded-full transition-colors border border-transparent hover:border-orange-100 group">
                        <ArrowLeft className="w-6 h-6 text-slate-600 group-hover:text-primary transition-colors" />
                    </Link>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                        <span className="text-primary">플레이</span>리스트
                    </h1>
                </div>
            </div>

            <div className="bg-white p-6 rounded-[1.5rem] shadow-xl shadow-orange-100/30 border border-orange-100">
                <h2 className="text-lg font-bold mb-5 flex items-center gap-2 text-slate-800">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 text-primary flex items-center justify-center">
                        <Music className="w-5 h-5" />
                    </div>
                    함께 듣고 싶은 노래 추천
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 ml-1">노래 제목</label>
                            <input
                                type="text"
                                placeholder="예: Hype Boy"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-gray-400"
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 ml-1">가수</label>
                            <input
                                type="text"
                                placeholder="예: 뉴진스"
                                value={formData.artist}
                                onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-gray-400"
                                required
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 ml-1">코멘트 (선택)</label>
                        <textarea
                            placeholder="이 노래를 추천하는 이유를 들려주세요!"
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none h-24 placeholder:text-gray-400"
                        />
                    </div>
                    <div className="flex justify-end pt-2">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex items-center gap-2 px-8 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 shadow-lg shadow-gray-200 font-bold"
                        >
                            <Send className="w-4 h-4" />
                            {isSubmitting ? '등록 중...' : '추천하기'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="space-y-5">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    최신 추천곡 <span className="text-primary">{posts.length}</span>
                </h2>
                {loading ? (
                    <div className="text-center py-16">
                        <div className="w-8 h-8 border-4 border-orange-100 border-t-primary rounded-full animate-spin mx-auto"></div>
                    </div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-[1.5rem] border border-dashed border-gray-300 text-gray-500">
                        아직 등록된 노래가 없어요.<br />첫 번째 DJ가 되어보세요! 🎧
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {posts.map((post) => (
                            <div key={post.id} className="bg-white p-5 rounded-[1.25rem] shadow-sm border border-orange-50 hover:shadow-md hover:shadow-orange-100/50 transition-all group flex gap-4 items-start">
                                {/* Thumbnail Placeholder (Simulated logic would go here) */}
                                <div className="w-24 h-24 bg-gray-200 rounded-xl flex-shrink-0 overflow-hidden relative group-hover:scale-105 transition-transform">
                                    <img
                                        src={`https://img.youtube.com/vi/${post.id.split('-')[0]}/0.jpg`} // Assuming Mock ID is loosely based on timestamp, this won't work for simulation. Using placeholder.
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${post.artist}&background=random`
                                        }}
                                        alt="Album Art"
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors"></div>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="font-bold text-slate-900 text-lg group-hover:text-primary transition-colors truncate">{post.title}</h3>
                                        <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                                            {new Date(post.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-primary font-semibold text-sm mb-3 truncate">{post.artist}</p>

                                    {post.content ? (
                                        <p className="text-gray-600 text-sm line-clamp-2 bg-orange-50/50 p-2 rounded-lg">
                                            "{post.content}"
                                        </p>
                                    ) : (
                                        <div className="h-8"></div>
                                    )}

                                    <div className="mt-3 flex justify-end">
                                        <a
                                            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(post.artist + ' ' + post.title)}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-colors"
                                        >
                                            <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse"></span>
                                            유튜브에서 듣기
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
