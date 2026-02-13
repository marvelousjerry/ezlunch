'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, LogOut, Settings } from 'lucide-react';

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

    const handleEdit = async (post: Post) => {
        const newTitle = prompt('노래 제목 수정', post.title);
        const newArtist = prompt('가수명 수정', post.artist);
        const newContent = prompt('코멘트 수정', post.content || '');

        if (newTitle === null || newArtist === null) return;

        try {
            const res = await fetch('/api/posts', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: post.id,
                    title: newTitle,
                    artist: newArtist,
                    content: newContent
                    // Admin session handled via cookie
                }),
            });

            if (res.ok) {
                alert('수정되었습니다.');
                fetchPosts();
            } else {
                const err = await res.json();
                alert(err.error || '수정에 실패했습니다.');
            }
        } catch (error) {
            console.error('Update failed', error);
        }
    };

    const handleLogout = async () => {
        // Clear cookie via API
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/admin/login');
        router.refresh();
    };

    return (
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
                                            onClick={() => handleEdit(post)}
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
    );
}
