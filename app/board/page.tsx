'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Music, Send, Heart } from 'lucide-react';
import HeartExplosion from '@/components/HeartExplosion';

interface Post {
    id: string;
    videoId?: string;
    title: string;
    artist: string;
    content: string;
    createdAt: string;
    author: string;
    likes: number;
    liked?: boolean;
}

export default function BoardPage() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({ title: '', artist: '', content: '', password: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Heart Effect State
    const [heartEffect, setHeartEffect] = useState<{ active: boolean; x: number; y: number }>({ active: false, x: 0, y: 0 });

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

    const handleLike = async (postId: string, e: React.MouseEvent) => {
        // Trigger Heart Effect
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setHeartEffect({ active: true, x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
        setTimeout(() => setHeartEffect(prev => ({ ...prev, active: false })), 600);

        try {
            const res = await fetch('/api/posts/like', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ postId }),
            });
            if (res.ok) {
                const result = await res.json();
                setPosts(prev => prev.map(p =>
                    p.id === postId ? { ...p, likes: result.likes, liked: result.liked } : p
                ));
            }
        } catch (error) {
            console.error('Like failed', error);
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
                setFormData({ title: '', artist: '', content: '', password: '' });
                fetchPosts();
            } else {
                const err = await res.json();
                alert(err.error || '등록에 실패했습니다.');
            }
        } catch (error) {
            console.error('Failed to submit post', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (post: Post) => {
        const password = prompt('비밀번호를 입력해주세요.');
        if (!password) return;

        try {
            const res = await fetch(`/api/posts?id=${post.id}&password=${password}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                alert('삭제되었습니다.');
                fetchPosts();
            } else {
                const err = await res.json();
                alert(err.error || '삭제에 실패했습니다.');
            }
        } catch (error) {
            console.error('Delete failed', error);
        }
    };

    const handleEdit = async (post: Post) => {
        const password = prompt('비밀번호를 입력해주세요.');
        if (!password) return;

        const newTitle = prompt('새 노래 제목', post.title);
        const newArtist = prompt('새 가수 이름', post.artist);
        const newContent = prompt('새 코멘트', post.content);

        if (newTitle === null || newArtist === null) return;

        try {
            const res = await fetch('/api/posts', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: post.id,
                    title: newTitle,
                    artist: newArtist,
                    content: newContent,
                    password: password
                }),
            });

            if (res.ok) {
                alert('수정되었습니다.');
                fetchPosts();
            } else {
                const err = await res.json();
                alert(err.error || '수정 결과: 실패');
            }
        } catch (error) {
            console.error('Update failed', error);
        }
    };

    const bestPosts = posts.filter(p => p.likes >= 10);
    const normalPosts = posts.filter(p => p.likes < 10);

    const PostCard = ({ post }: { post: Post }) => (
        <div key={post.id} className="bg-white p-5 rounded-[1.25rem] shadow-sm border border-orange-50 hover:shadow-md hover:shadow-orange-100/50 transition-all group flex gap-4 items-start relative">
            <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button onClick={() => handleEdit(post)} className="px-2 py-1 text-blue-600 hover:text-white hover:bg-blue-500 bg-blue-50 border border-blue-100 rounded-md transition-all shadow-sm">
                    <span className="text-[10px] font-bold">수정</span>
                </button>
                <button onClick={() => handleDelete(post)} className="px-2 py-1 text-red-600 hover:text-white hover:bg-red-500 bg-red-50 border border-red-100 rounded-md transition-all shadow-sm">
                    <span className="text-[10px] font-bold">삭제</span>
                </button>
            </div>
            <div className="w-24 h-24 bg-gray-200 rounded-xl flex-shrink-0 overflow-hidden relative group-hover:scale-105 transition-transform shadow-inner">
                <img
                    src={`https://img.youtube.com/vi/${post.videoId}/0.jpg`}
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
                    <h3 className="font-bold text-slate-900 text-lg group-hover:text-primary transition-colors truncate pr-4">{post.title}</h3>
                    <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2 opacity-100 group-hover:opacity-0 transition-opacity">
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

                <div className="mt-3 flex justify-between items-center">
                    <div className="flex items-center gap-1">
                        <button
                            onClick={(e) => handleLike(post.id, e)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${post.liked
                                ? 'bg-orange-500 text-white shadow-orange-200 shadow-lg'
                                : 'bg-slate-50 text-slate-400 hover:bg-orange-50 hover:text-orange-500'
                                }`}
                        >
                            <Heart className={`w-3.5 h-3.5 ${post.liked ? 'fill-current' : ''}`} />
                            {post.likes}
                        </button>
                    </div>
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
    );

    return (
        <div className="space-y-8 animate-fade-in-up pb-20">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/" className="p-2.5 hover:bg-orange-50 rounded-full transition-colors border border-transparent hover:border-orange-100 group">
                        <ArrowLeft className="w-6 h-6 text-slate-600 group-hover:text-primary transition-colors" />
                    </Link>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                        노래 추천 <span className="text-primary">게시판</span>
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 ml-1">비밀번호 (4자리)</label>
                            <input
                                type="password"
                                maxLength={4}
                                placeholder="0000"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
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

            {bestPosts.length > 0 && (
                <div className="space-y-5">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        🔥 Best DJ 추천곡 <span className="text-orange-500">{bestPosts.length}</span>
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        {bestPosts.map(post => <PostCard key={post.id} post={post} />)}
                    </div>
                </div>
            )}

            <div className="space-y-5">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    최신 추천곡 <span className="text-primary">{normalPosts.length}</span>
                </h2>
                {loading ? (
                    <div className="text-center py-16">
                        <div className="w-8 h-8 border-4 border-orange-100 border-t-primary rounded-full animate-spin mx-auto"></div>
                    </div>
                ) : normalPosts.length === 0 && bestPosts.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-[1.5rem] border border-dashed border-gray-300 text-gray-500">
                        아직 등록된 노래가 없어요.<br />첫 번째 DJ가 되어보세요! 🎧
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {normalPosts.map((post) => (
                            <PostCard key={post.id} post={post} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
