'use client';

import { useState, useEffect } from 'react';
import { Shuffle, Check, ScanSearch, Info, MapPin, ArrowRight, RotateCcw, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

type Store = {
    id: string;
    name: string;
    category: string;
    distance?: number;
};

const PENALTIES = [
    '오늘은 내가 쏜다! 🔫',
    '편의점 커피 돌리기 ☕',
    '식사 후 아이스크림 사기 🍦',
    '랜덤 메뉴 아무거나 시키기 🎲',
    '디저트 쏘기 🍰'
];

type Step = 'intro' | 'category' | 'roulette';

export default function LunchRoulette() {
    const [step, setStep] = useState<Step>('intro');

    // Result State
    const [selectedStore, setSelectedStore] = useState<Store | null>(null);
    const [selectedPenalty, setSelectedPenalty] = useState<string | null>(null);
    const [isSpinning, setIsSpinning] = useState(false);
    const [isPenalty, setIsPenalty] = useState(false);

    // Options
    const [useRandomPenalty, setUseRandomPenalty] = useState(false);
    const [avoidDuplicates, setAvoidDuplicates] = useState(false);

    // Data
    const [stores, setStores] = useState<Store[]>([]);
    const [isScanning, setIsScanning] = useState(false);
    const [scanDots, setScanDots] = useState('');
    const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number }>({ lat: 37.5635, lng: 127.0035 });

    // Category & Filter State
    const [categories, setCategories] = useState<string[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

    // Dot Animation Effect
    useEffect(() => {
        if (!isScanning) {
            setScanDots('');
            return;
        }
        const interval = setInterval(() => {
            setScanDots(prev => prev.length >= 3 ? '' : prev + '.');
        }, 500);
        return () => clearInterval(interval);
    }, [isScanning]);

    const initialScan = async () => {
        setIsScanning(true);
        setStores([]);

        // Default location: 회사 (CJ제일제당 센터)
        const latitude = 37.5635;
        const longitude = 127.0035;
        setCurrentCoords({ lat: latitude, lng: longitude });

        try {
            // Scan 3000m range to ensure we find at least 60+ stores as requested
            const res = await fetch(`/api/restaurants/scan?lat=${latitude}&lng=${longitude}&radius=3000&t=${Date.now()}`);
            const data = await res.json();

            if (data.stores) {
                setStores(data.stores);
                const uniqueCats = Array.from(new Set(data.stores.map((s: any) => s.category))).filter(Boolean) as string[];
                setCategories(uniqueCats);
                setSelectedCategories(uniqueCats);
                setStep('category');
            } else {
                alert('주변 식당을 충분히 찾을 수 없습니다.');
            }
        } catch (error) {
            console.error('Initial scan failed', error);
            alert('데이터 로드 실패');
        } finally {
            setIsScanning(false);
        }
    };

    const resetFlow = () => {
        setStep('intro');
        setSelectedStore(null);
        setSelectedPenalty(null);
        setIsSpinning(false);
        setIsPenalty(false);
    };

    const toggleCategory = (cat: string) => {
        if (selectedCategories.includes(cat)) {
            setSelectedCategories(prev => prev.filter(c => c !== cat));
        } else {
            setSelectedCategories(prev => [...prev, cat]);
        }
    };

    const toggleAllCategories = () => {
        if (selectedCategories.length === categories.length) {
            setSelectedCategories([]);
        } else {
            setSelectedCategories(categories);
        }
    };

    const goToRoulette = () => {
        if (selectedCategories.length === 0) {
            alert('최소 한 개 이상의 카테고리를 선택해주세요!');
            return;
        }
        setStep('roulette');
    };

    const spin = () => {
        if (isSpinning) return;
        let candidates = stores.filter(s => selectedCategories.includes(s.category));
        if (candidates.length === 0) {
            alert('선택된 카테고리에 해당하는 식당이 없습니다.');
            return;
        }

        if (useRandomPenalty && Math.random() < 0.1) {
            setIsSpinning(true);
            let duration = 0;
            const interval = setInterval(() => {
                duration += 100;
                if (duration > 2500) {
                    clearInterval(interval);
                    setIsSpinning(false);
                    setIsPenalty(true);
                    setSelectedPenalty(PENALTIES[Math.floor(Math.random() * PENALTIES.length)]);
                    setSelectedStore(null);
                }
            }, 100);
            return;
        }

        setIsSpinning(true);
        setIsPenalty(false);
        setSelectedPenalty(null);
        setSelectedStore(null);

        let duration = 0;
        let speed = 50;

        const animate = () => {
            const randomStore = candidates[Math.floor(Math.random() * candidates.length)];
            setSelectedStore(randomStore);
            duration += speed;

            if (duration < 2500) {
                if (duration > 1500) speed += 20;
                setTimeout(animate, speed);
            } else {
                setIsSpinning(false);
                const finalStore = candidates[Math.floor(Math.random() * candidates.length)];
                setSelectedStore(finalStore);
            }
        };
        animate();
    };

    // --- RENDER ---

    if (step === 'intro') {
        return (
            <div className="w-full max-w-[30rem] mx-auto p-12 flex flex-col items-center justify-center min-h-[480px] bg-white rounded-[3rem] shadow-2xl shadow-orange-100/50 border border-orange-50 relative overflow-hidden animate-fade-in">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-56 h-56 bg-orange-50 rounded-full blur-3xl opacity-60"></div>

                <div className="mb-10 w-28 h-28 bg-gradient-to-br from-orange-400 to-orange-600 rounded-[2rem] flex items-center justify-center shadow-xl shadow-orange-200 rotate-6 transform hover:rotate-0 transition-transform duration-500 cursor-pointer">
                    <MapPin className="w-14 h-14 text-white" />
                </div>

                <div className="text-center space-y-4 mb-12 relative z-10">
                    <h2 className="text-4xl font-black text-slate-900 tracking-tighter">오늘 뭐 먹지?</h2>
                    <p className="text-slate-500 font-medium leading-relaxed break-keep px-4">
                        주변의 맛있는 식당들을<br />
                        빠르게 찾아보러 갈까요?
                    </p>
                </div>

                <button
                    onClick={initialScan}
                    disabled={isScanning}
                    className="w-full py-5 bg-slate-900 text-white rounded-2xl font-bold text-xl shadow-2xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 relative group overflow-hidden"
                >
                    <span className="relative z-10">{isScanning ? `탐색 중${scanDots}` : '시작하기'}</span>
                    <div className="absolute inset-0 bg-primary translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                </button>
            </div>
        );
    }

    if (step === 'category') {
        return (
            <div className="w-full max-w-[30rem] mx-auto p-8 flex flex-col bg-white rounded-[2.5rem] shadow-2xl shadow-orange-100/30 border border-orange-50 min-h-[500px] animate-fade-in-up">
                <div className="flex items-center justify-between mb-8">
                    <button onClick={resetFlow} className="p-3 -ml-2 text-slate-400 hover:text-primary rounded-full hover:bg-orange-50 transition-all">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h2 className="text-2xl font-black text-slate-800">카테고리 선택</h2>
                    <div className="w-10"></div>
                </div>

                <div className="flex items-center justify-between mb-4 px-1 text-sm font-bold">
                    <p className="text-slate-500">주변 <span className="text-primary">{stores.length}곳</span> 발견!</p>
                    <button onClick={toggleAllCategories} className="text-orange-600 hover:underline">
                        {selectedCategories.length === categories.length ? '전체 해제' : '전체 선택'}
                    </button>
                </div>

                {/* Denser Chip Layout to minimize scrolling */}
                <div className="flex-1 overflow-y-auto pr-1 mb-8 custom-scrollbar">
                    <div className="flex flex-wrap gap-2.5">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => toggleCategory(cat)}
                                className={`px-4 py-3 rounded-xl font-bold text-sm transition-all border-2 flex items-center gap-2 ${selectedCategories.includes(cat)
                                    ? 'bg-orange-50 border-primary text-primary shadow-sm'
                                    : 'bg-slate-50 border-slate-50 text-slate-500 hover:border-slate-200'
                                    }`}
                            >
                                <span>{selectedCategories.includes(cat) ? '✅' : '🍴'}</span>
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    onClick={goToRoulette}
                    disabled={selectedCategories.length === 0}
                    className="w-full py-5 bg-primary text-white rounded-2xl font-bold text-xl shadow-xl shadow-orange-200 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                    선택 완료 <ArrowRight className="w-6 h-6" />
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center p-8 bg-white/80 backdrop-blur-md rounded-[2.5rem] shadow-2xl border border-orange-50 w-full max-w-[30rem] mx-auto relative animate-fade-in">
            <div className="absolute top-6 left-6 flex gap-4 z-20">
                <button onClick={resetFlow} className="flex items-center gap-1 text-gray-400 hover:text-primary transition-colors">
                    <RotateCcw className="w-4 h-4" /> <span className="text-xs font-bold">처음으로</span>
                </button>
                <button onClick={() => setStep('category')} className="flex items-center gap-1 text-gray-400 hover:text-primary transition-colors">
                    <Check className="w-4 h-4" /> <span className="text-xs font-bold">카테고리 수정</span>
                </button>
            </div>

            <div className={`w-full h-64 flex flex-col items-center justify-center rounded-[2rem] mb-8 relative overflow-hidden mt-12 ${isPenalty ? 'bg-red-50' : 'bg-orange-50/50'}`}>
                {!selectedStore && !selectedPenalty && !isSpinning && (
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-inner text-4xl">🥘</div>
                        <p className="text-sm text-gray-500 font-bold">버튼을 눌러주세요!</p>
                    </div>
                )}
                {(selectedStore || selectedPenalty) && (
                    <div className="text-center px-4 animate-enter">
                        {isPenalty ? (
                            <><div className="text-5xl mb-4 animate-bounce">🚨</div><div className="text-xl font-black text-red-500">{selectedPenalty}</div></>
                        ) : (
                            selectedStore && (
                                <div className={isSpinning ? 'opacity-50 blur-sm scale-95' : 'scale-100 opacity-100'}>
                                    <h2 className="text-3xl font-black text-slate-800 mb-2 break-keep">{selectedStore.name}</h2>
                                    <span className="px-3 py-1 bg-orange-100 rounded-full text-xs font-bold text-orange-600">{selectedStore.category}</span>
                                </div>
                            )
                        )}
                    </div>
                )}
            </div>

            <div className="w-full space-y-6">
                <div className="flex justify-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="w-4 h-4 accent-primary" checked={useRandomPenalty} onChange={(e) => setUseRandomPenalty(e.target.checked)} />
                        <span className="text-xs font-bold text-slate-500">벌칙 10%</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="w-4 h-4 accent-primary" checked={avoidDuplicates} onChange={(e) => setAvoidDuplicates(e.target.checked)} />
                        <span className="text-xs font-bold text-slate-500">중복 방지</span>
                    </label>
                </div>
                <button
                    onClick={spin}
                    disabled={isSpinning}
                    className="w-full py-5 bg-gradient-to-b from-orange-400 to-orange-600 text-white rounded-2xl font-black text-xl shadow-xl shadow-orange-200 hover:-translate-y-1 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    <Shuffle className="w-6 h-6" />
                    {isSpinning ? 'G O !' : 'LUNCH SPIN!'}
                </button>
            </div>

            {selectedStore && !isSpinning && !isPenalty && (
                <div className="mt-8 w-full grid grid-cols-2 gap-3 animate-enter">
                    <Link href={`https://map.naver.com/p/search/${encodeURIComponent(selectedStore.name)}`} target="_blank" className="py-3 bg-[#03C75A] text-white rounded-xl font-bold text-center text-sm">네이버 지도</Link>
                    <Link href={`/recommend?menu=${selectedStore.name}&lat=${currentCoords.lat}&lng=${currentCoords.lng}`} className="py-3 bg-orange-50 text-primary border border-orange-100 rounded-xl font-bold text-center text-sm flex items-center justify-center gap-2"><Info className="w-4 h-4" /> 맛집 상세</Link>
                </div>
            )}
        </div>
    );
}
