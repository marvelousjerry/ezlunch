'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MapPin, Music, Shield } from 'lucide-react';

export default function Header() {
    const pathname = usePathname();

    return (
        <header className="fixed top-0 w-full z-50 bg-[#FFFBF7]/80 backdrop-blur-md border-b border-orange-100 transition-all duration-300">
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
                        <Link href="/admin" className="p-2 text-slate-400 hover:text-[#FF8A3D] transition-colors" title="관리자">
                            <Shield className="w-5 h-5" />
                        </Link>
                    </div>
                </div>
            </div>
        </header>
    );
}
