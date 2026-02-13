'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, LogOut, Settings, X } from 'lucide-react';

interface Post {
    id: string;
    title: string;
    artist: string;
    content: string;
    createdAt: string;
    author: string;
}

export default function AdminDashboard() {
    const [posts, setPosts] = useState<Post[]>([]);
    const router = useRouter();

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingPost, setEditingPost] = useState<Post | null>(null);
    const [editForm, setEditForm] = useState({ title: '', artist: '', content: '' });

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        const res = await fetch('/api/posts');
        const data = await res.json();
        setPosts(data);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('정말 삭제하시겠습니까?')) return;

        // Admin session is now handled via HttpOnly cookie
        await fetch(`/api/posts?id=${id}`, { method: 'DELETE' });
        fetchPosts();
    };

    const openEditModal = (post: Post) => {
        setEditingPost(post);
        setEditForm({
            title: post.title,
            artist: post.artist,
            content: post.content || ''
        });
        setIsEditModalOpen(true);
    };

    const closeEditModal = () => {
        setIsEditModalOpen(false);
        setEditingPost(null);
        setEditForm({ title: '', artist: '', content: '' });
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingPost) return;

        try {
            const res = await fetch('/api/posts', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editingPost.id,
                    title: editForm.title,
                    artist: editForm.artist,
                    content: editForm.content
                    // Admin session handled via cookie
                }),
            });

            if (res.ok) {
                alert('수정되었습니다.');
                fetchPosts();
                closeEditModal();
            } else {
                const err = await res.json();
                alert(err.error || '수정에 실패했습니다.');
            }
        } catch (error) {
            console.error('Update failed', error);
            alert('수정 중 오류가 발생했습니다.');
        }
    };

    const handleLogout = async () => {
        // Clear cookie via API
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/admin/login');
        router.refresh();
    };

    return (
        <>
            <div className="space-y-6 animate-fade-in-up pb-20">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900">관리자 대시보드</h1>
                    <button onClick={handleLogout} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-sm font-medium flex items-center gap-2">
                        <LogOut className="w-4 h-4" />
                        로그아웃
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h2 className="text-lg font-bold mb-4">게시글 관리 ({posts.length})</h2>
                            <div className="space-y-4">
                                {posts.map((post) => (
                                    <div key={post.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                        <div className="flex-1 min-w-0 pr-4">
                                            <h3 className="font-bold text-gray-800 truncate">{post.title}</h3>
                                            <p className="text-sm text-gray-500 truncate">{post.artist} - {new Date(post.createdAt).toLocaleDateString()}</p>
                                            {post.content && <p className="text-xs text-gray-400 mt-1 line-clamp-1">{post.content}</p>}
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => openEditModal(post)}
                                                className="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
                                                title="수정"
                                            >
                                                <Settings className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(post.id)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                                title="삭제"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {posts.length === 0 && (
                                    <p className="text-gray-400 text-center py-4">게시글이 없습니다.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Settings className="w-5 h-5" />
                                설정
                            </h2>
                            <p className="text-gray-500 mb-4 text-sm">사이트 설정을 변경합니다.</p>
                            <button className="w-full py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 font-medium text-sm">
                                준비 중
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Admin Edit Modal */}
            {isEditModalOpen && (
                <div className="fixed top-0 left-0 w-screen h-screen z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in text-left px-4">
                    <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl relative animate-scale-up">
                        <button
                            onClick={closeEditModal}
                            className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full transition-colors"
                        >
                            <X className="w-6 h-6 text-slate-400" />
                        </button>

                        <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <span className="text-primary">✏️</span> 게시글 수정 (관리자)
                        </h2>

                        <form onSubmit={handleEditSubmit} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 ml-1">노래 제목</label>
                                <input
                                    type="text"
                                    value={editForm.title}
                                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-bold text-slate-700"
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 ml-1">가수</label>
                                <input
                                    type="text"
                                    value={editForm.artist}
                                    onChange={(e) => setEditForm({ ...editForm, artist: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-bold text-slate-700"
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 ml-1">코멘트</label>
                                <textarea
                                    value={editForm.content}
                                    onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none h-24"
                                />
                            </div>

                            {/* Changed: No password field needed for admin */}
                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={closeEditModal}
                                    className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] py-3 bg-primary text-white rounded-xl font-bold hover:brightness-95 transition-all shadow-lg shadow-orange-200"
                                >
                                    수정 완료
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
