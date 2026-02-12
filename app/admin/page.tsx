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

        await fetch(`/api/posts?id=${id}`, { method: 'DELETE' });
        fetchPosts();
    };

    const handleLogout = async () => {
        // In a real app, call logout API to clear cookie
        // For now, simple redirect
        document.cookie = 'admin_token=; Max-Age=0; path=/;';
        router.push('/admin/login');
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
                                    <div>
                                        <h3 className="font-bold text-gray-800">{post.title}</h3>
                                        <p className="text-sm text-gray-500">{post.artist} - {new Date(post.createdAt).toLocaleDateString()}</p>
                                        {post.content && <p className="text-xs text-gray-400 mt-1">{post.content}</p>}
                                    </div>
                                    <button
                                        onClick={() => handleDelete(post.id)}
                                        className="p-2 text-red-500 hover:bg-red-100 rounded-full transition-colors"
                                        title="삭제"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
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
