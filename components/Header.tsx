'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MapPin, Music, Shield } from 'lucide-react';

export default function Header() {
    const pathname = usePathname();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <header className="fixed top-0 w-full z-40 bg-[#FFFBF7]/80 backdrop-blur-md border-b border-orange-100 transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-10 h-10 bg-[#FF8A3D] rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-sm group-hover:bg-[#E57A30] transition-colors">
                            E
                        </div>
                        <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-[#FF8A3D] transition-colors">EzLunch</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center space-x-1 bg-orange-50 px-4 py-2 rounded-full">
                        <Link href="/" className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${pathname === '/' ? 'bg-white text-[#FF8A3D] shadow-sm' : 'text-slate-600 hover:text-[#FF8A3D]'}`}>
                            홈
                        </Link>
                        <Link href="/board" className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${pathname === '/board' ? 'bg-white text-[#FF8A3D] shadow-sm' : 'text-slate-600 hover:text-[#FF8A3D]'}`}>
                            노래 추천 게시판
                        </Link>
                    </nav>

                    {/* Mobile/Admin Action */}
                    <div className="flex items-center gap-2">
                        <Link href="/admin" className="p-2 text-slate-400 hover:text-[#FF8A3D] transition-colors hidden md:block" title="관리자">
                            <Shield className="w-5 h-5" />
                        </Link>
                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="md:hidden p-2 text-slate-600 hover:bg-orange-50 rounded-lg transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {isMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {isMenuOpen && (
                <div className="md:hidden bg-white/95 backdrop-blur-md border-b border-orange-100 animate-fade-in-down">
                    <nav className="flex flex-col p-4 space-y-2">
                        <Link
                            href="/"
                            onClick={() => setIsMenuOpen(false)}
                            className={`p-3 rounded-xl font-bold flex items-center gap-3 ${pathname === '/' ? 'bg-orange-50 text-orange-600' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            <Home className="w-5 h-5" /> 홈
                        </Link>
                        <Link
                            href="/board"
                            onClick={() => setIsMenuOpen(false)}
                            className={`p-3 rounded-xl font-bold flex items-center gap-3 ${pathname === '/board' ? 'bg-orange-50 text-orange-600' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            <Music className="w-5 h-5" /> 노래 추천 게시판
                        </Link>
                        <Link
                            href="/admin"
                            onClick={() => setIsMenuOpen(false)}
                            className="p-3 rounded-xl font-bold flex items-center gap-3 text-slate-400 hover:bg-slate-50"
                        >
                            <Shield className="w-5 h-5" /> 관리자 로그인
                        </Link>
                    </nav>
                </div>
            )}
        </header>
    );
}
