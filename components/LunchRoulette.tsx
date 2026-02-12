'use client';

import { useState, useEffect } from 'react';
import { Shuffle, Check, ScanSearch, Info, MapPin, ArrowRight, RotateCcw } from 'lucide-react';
import Link from 'next/link';

type Store = {
    id: string;
    name: string;
    category: string;
    distance?: number;
};

// Fallback Data - Removed for real-data-only enforcement
const INITIAL_STORES: Store[] = [];

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
    const [menuFilter, setMenuFilter] = useState('');
    const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number }>({ lat: 37.5635, lng: 127.0035 });

    // Category & Filter State
    const [categories, setCategories] = useState<string[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

    const [selectedRadius, setSelectedRadius] = useState<number>(1000);
    const [initialLoading, setInitialLoading] = useState(true);

    // Auto-scan on mount (3km range to cover everything)
    useEffect(() => {
        initialScan();
    }, []);

    const initialScan = async () => {
        setInitialLoading(true);
        setIsScanning(true);
        setStores([]);

        // Default location: 회사 (CJ제일제당 센터)
        const latitude = 37.5635;
        const longitude = 127.0035;
        setCurrentCoords({ lat: latitude, lng: longitude });

        try {
            // Scan maximum range 3000m once
            const res = await fetch(`/api/restaurants/scan?lat=${latitude}&lng=${longitude}&radius=3000`);
            const data = await res.json();

            if (data.stores) {
                setStores(data.stores);
            }
        } catch (error) {
            console.error('Initial scan failed', error);
        } finally {
            setIsScanning(false);
            setInitialLoading(false);
        }
    };

    const selectRadiusAndProceed = (radius: number) => {
        setSelectedRadius(radius);

        // Filter stores by radius
        const inRange = stores.filter(s => {
            return (s.distance || 0) <= radius;
        });

        if (inRange.length === 0) {
            alert(`해당 반경 내에 식당이 없습니다. (현재 발견된 총 식당: ${stores.length}곳). 다른 범위를 선택해주세요.`);
            return;
        }

        // Extract Categories from filtered stores
        const uniqueCats = Array.from(new Set(inRange.map((s: any) => s.category))).filter(Boolean) as string[];
        setCategories(uniqueCats);
        setSelectedCategories(uniqueCats); // Default select all

        // Move to next step
        setStep('category');
    };

    // Keep resetFlow but adjust if needed
    const resetFlow = () => {
        setStep('intro');
        // We keep 'stores' from initial load to avoid re-scanning
        setSelectedStore(null);
        setSelectedPenalty(null);
        setIsSpinning(false);
        setIsPenalty(false);
        setMenuFilter('');
    };

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

        // Filter candidates
        let candidates = stores.filter(s => selectedCategories.includes(s.category));

        // Safety check
        if (candidates.length === 0) {
            alert('선택된 카테고리에 해당하는 식당이 없습니다.');
            return;
        }

        // Apply Penaly Logic (10% chance)
        if (useRandomPenalty && Math.random() < 0.1) {
            setIsSpinning(true);
            let duration = 0;
            const interval = setInterval(() => {
                setMenuFilter(PENALTIES[Math.floor(Math.random() * PENALTIES.length)]);
                duration += 100;
                if (duration > 3000) {
                    clearInterval(interval);
                    setIsSpinning(false);
                    setIsPenalty(true);
                    const penalty = PENALTIES[Math.floor(Math.random() * PENALTIES.length)];
                    setSelectedPenalty(penalty);
                    setSelectedStore(null);
                }
            }, 100);
            return;
        }

        // Normal Spin
        setIsSpinning(true);
        setIsPenalty(false);
        setSelectedPenalty(null);
        setSelectedStore(null);

        let duration = 0;
        let speed = 50;

        const animate = () => {
            // Pick random from filtered list
            const randomStore = candidates[Math.floor(Math.random() * candidates.length)];
            setSelectedStore(randomStore);
            duration += speed;

            if (duration < 3000) {
                if (duration > 2000) speed += 10; // Slow down
                setTimeout(animate, speed);
            } else {
                setIsSpinning(false);
                // Final Pick
                let finalStore;
                if (avoidDuplicates) {
                    finalStore = candidates[Math.floor(Math.random() * candidates.length)];
                } else {
                    finalStore = candidates[Math.floor(Math.random() * candidates.length)];
                }
                setSelectedStore(finalStore);
            }
        };
        animate();
    };

    // --------------------------------------------------------------------------------
    // RENDER: PHASE 1 - RADIUS SELECTION
    // --------------------------------------------------------------------------------
    if (step === 'intro') {
        const radii = [
            { value: 500, label: '산책 겸 500m' },
            { value: 1000, label: '가뿐한 1km' },
            { value: 1500, label: '넉넉한 1.5km' },
            { value: 2000, label: '도전! 2km' },
            { value: 2500, label: '원정 미식 2.5km' },
            { value: 3000, label: '대장정 3km' }
        ];

        return (
            <div className="w-full max-w-[30rem] mx-auto p-10 flex flex-col items-center justify-center min-h-[450px] bg-white rounded-[2.5rem] shadow-2xl shadow-orange-100/50 border border-orange-50 relative overflow-hidden">
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-orange-50 rounded-full blur-3xl opacity-50"></div>

                <div className="mb-8 w-24 h-24 bg-gradient-to-br from-orange-400 to-orange-600 rounded-3xl flex items-center justify-center shadow-lg shadow-orange-200 rotate-6 transform transition-transform hover:rotate-0 duration-300">
                    <MapPin className="w-12 h-12 text-white" />
                </div>

                <h2 className="text-3xl font-black text-slate-800 mb-3 tracking-tight">어디까지 가실래요?</h2>
                <p className="text-slate-500 text-center mb-10 break-keep font-medium leading-relaxed">
                    <span className="text-orange-600 font-bold">회사</span>를 기준으로<br />
                    맛있는 식당을 찾아볼 반경을 선택해 주세요.
                </p>

                <div className="grid grid-cols-2 gap-4 w-full relative z-10">
                    {radii.map((r) => {
                        const countInRange = stores.filter(s => (s.distance || 0) <= r.value).length;

                        return (
                            <button
                                key={r.value}
                                onClick={() => selectRadiusAndProceed(r.value)}
                                disabled={initialLoading}
                                className={`group py-5 rounded-[1.5rem] font-bold transition-all flex flex-col items-center justify-center border-2 ${initialLoading
                                    ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed'
                                    : 'bg-white border-orange-50 text-slate-700 hover:border-orange-500 hover:bg-orange-50 hover:text-orange-600 active:scale-95 shadow-sm hover:shadow-orange-100'
                                    }`}
                            >
                                <span className="text-[10px] uppercase tracking-widest font-black text-gray-400 group-hover:text-orange-400 mb-1 transition-colors">Distance</span>
                                <span className="text-lg">{r.label.split(' ')[0]}</span>
                                <div className="flex items-baseline gap-1 mt-1">
                                    <span className="text-2xl font-black leading-none">
                                        {r.value >= 1000 ? `${r.value / 1000}km` : `${r.value}m`}
                                    </span>
                                    {(!initialLoading && stores.length > 0) && (
                                        <span className="text-xs font-bold text-orange-500 animate-fade-in">{countInRange}곳</span>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {isScanning && (
                    <div className="absolute inset-0 z-20 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center gap-4 animate-enter">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-orange-100 border-t-orange-500 rounded-full animate-spin"></div>
                            <ScanSearch className="w-6 h-6 text-orange-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                        </div>
                        <div className="text-center">
                            <p className="text-slate-800 font-black text-xl mb-1">회사 주변 맛집 찾는 중</p>
                            <p className="text-orange-500 font-bold tracking-widest">{scanDots}</p>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // --------------------------------------------------------------------------------
    // RENDER: PHASE 2 - CATEGORY SELECT
    // --------------------------------------------------------------------------------
    if (step === 'category') {
        return (
            <div className="w-full max-w-[28rem] mx-auto p-6 flex flex-col bg-white/60 backdrop-blur-md rounded-3xl shadow-xl shadow-orange-100/20 border border-white/50 min-h-[500px]">
                <div className="flex items-center justify-between mb-6">
                    <button onClick={resetFlow} className="p-2 -ml-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
                        <RotateCcw className="w-5 h-5" />
                    </button>
                    <h2 className="text-xl font-bold text-slate-800">카테고리 선택</h2>
                    <div className="w-9"></div> {/* Spacer for centering */}
                </div>

                <div className="flex items-center justify-between mb-3 px-1">
                    <span className="text-sm font-bold text-slate-600">
                        총 {categories.length}개 종류 발견
                    </span>
                    <button onClick={toggleAllCategories} className="text-xs text-orange-500 font-semibold hover:underline">
                        {selectedCategories.length === categories.length ? '전체 해제' : '전체 선택'}
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto w-full mb-6 max-h-[300px] scrollbar-hide p-1">
                    <div className="flex flex-wrap gap-2 content-start pb-2 px-1">
                        {categories.map((cat, idx) => (
                            <button
                                key={idx}
                                onClick={() => toggleCategory(cat)}
                                className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 border w-[calc(50%-0.5rem)] grow-0 flex items-center justify-center ${selectedCategories.includes(cat)
                                    ? 'bg-orange-100 border-orange-200 text-orange-700 shadow-sm outline outline-1 outline-orange-300'
                                    : 'bg-white border-gray-200 text-gray-400 hover:bg-gray-50'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    onClick={goToRoulette}
                    disabled={selectedCategories.length === 0}
                    className={`w-full py-4 text-lg font-bold rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 ${selectedCategories.length > 0
                        ? 'bg-slate-800 text-white hover:bg-slate-900 active:scale-95 shadow-slate-200'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                >
                    <span>{stores.filter(s => selectedCategories.includes(s.category)).length}개 맛집으로 룰렛 돌리기</span>
                    <ArrowRight className="w-5 h-5" />
                </button>
            </div>
        );
    }

    // --------------------------------------------------------------------------------
    // RENDER: PHASE 3 - ROULETTE (SPIN)
    // --------------------------------------------------------------------------------
    return (
        <div className="flex flex-col items-center justify-center p-6 md:p-8 bg-white/60 backdrop-blur-md rounded-3xl shadow-xl shadow-orange-100/20 border border-white/50 w-full max-w-[28rem] mx-auto relative transition-transform duration-300">

            {/* Header / Reset / Edit */}
            <div className="absolute top-5 left-5 z-20 flex gap-4">
                <button onClick={resetFlow} className="flex items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors">
                    <RotateCcw className="w-4 h-4" />
                    <span className="text-xs font-semibold">처음으로</span>
                </button>
                <button onClick={() => setStep('category')} className="flex items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors">
                    <Check className="w-4 h-4" />
                    <span className="text-xs font-semibold">카테고리 수정</span>
                </button>
            </div>

            {/* Filter Info Badge */}
            <div className="absolute top-5 right-5 z-20">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 rounded-full border border-orange-100">
                    <Check className="w-3.5 h-3.5 text-orange-500" />
                    <span className="text-xs font-semibold text-orange-600">
                        {stores.filter(s => selectedCategories.includes(s.category)).length}개 후보 대기중
                    </span>
                </div>
            </div>

            {/* Roulette Display */}
            <div className={`w-full h-64 md:h-72 flex flex-col items-center justify-center rounded-[2rem] mb-8 relative overflow-hidden transition-colors duration-300 mt-8 ${isPenalty ? 'bg-red-50' : 'bg-orange-50/50'}`}>
                {/* Default State */}
                {!selectedStore && !selectedPenalty && !isSpinning && (
                    <div className="flex flex-col items-center gap-4 animate-fade-in">
                        <div className="w-24 h-24 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-inner">
                            <span className="text-5xl">🥘</span>
                        </div>
                        <p className="text-sm text-gray-500 font-medium">준비 완료! 버튼을 눌러주세요</p>
                    </div>
                )}

                {/* Display Content */}
                {(selectedStore || selectedPenalty) && (
                    <div className="relative z-10 text-center px-4 w-full animate-enter">
                        {isPenalty ? (
                            <>
                                <div className="text-5xl mb-4 animate-bounce">🚨</div>
                                <div className="text-xl font-bold text-red-500 break-keep leading-snug">
                                    {selectedPenalty}
                                </div>
                            </>
                        ) : (
                            selectedStore && (
                                <>
                                    <div className={`transition-all duration-300 ${isSpinning ? 'scale-95 opacity-50 blur-[0.5px]' : 'scale-100 opacity-100'}`}>
                                        <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2 leading-tight break-keep">
                                            {selectedStore.name}
                                        </h2>
                                        <span className="inline-block px-3 py-1 bg-orange-100 rounded-full text-sm font-bold text-orange-600">
                                            {selectedStore.category}
                                        </span>
                                    </div>
                                </>
                            )
                        )}
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="w-full space-y-6 relative z-10">
                <div className="flex items-center justify-center gap-4 select-none">
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <div className={`relative w-12 h-7 rounded-full transition-colors duration-200 ease-in-out ${useRandomPenalty ? 'bg-orange-500' : 'bg-gray-200'}`}>
                            <div className={`absolute top-1 left-1 bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${useRandomPenalty ? 'translate-x-5' : ''}`}></div>
                        </div>
                        <input type="checkbox" className="hidden" checked={useRandomPenalty} onChange={(e) => setUseRandomPenalty(e.target.checked)} />
                        <span className={`text-sm font-bold transition-colors ${useRandomPenalty ? 'text-orange-600' : 'text-gray-400'}`}>벌칙 10%</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer group">
                        <div className={`relative w-12 h-7 rounded-full transition-colors duration-200 ease-in-out ${avoidDuplicates ? 'bg-orange-500' : 'bg-gray-200'}`}>
                            <div className={`absolute top-1 left-1 bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${avoidDuplicates ? 'translate-x-5' : ''}`}></div>
                        </div>
                        <input type="checkbox" className="hidden" checked={avoidDuplicates} onChange={(e) => setAvoidDuplicates(e.target.checked)} />
                        <span className={`text-sm font-bold transition-colors ${avoidDuplicates ? 'text-orange-600' : 'text-gray-400'}`}>중복 방지</span>
                    </label>
                </div>

                <div className="relative flex justify-center mt-6">
                    <button
                        onClick={spin}
                        disabled={isSpinning}
                        className={`w-full md:w-auto md:px-12 py-4 rounded-2xl font-bold text-lg shadow-lg transform transition-all duration-200 active:scale-95 disabled:active:scale-100 ${isSpinning
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none border border-gray-200'
                            : 'bg-gradient-to-b from-[#FF8A3D] to-[#E57A30] text-white shadow-orange-200 hover:shadow-orange-300 hover:-translate-y-1 border-b-4 border-[#C96218]'
                            }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            {isSpinning ? (
                                <span className="animate-spin text-xl">↻</span>
                            ) : (
                                <Shuffle className="w-6 h-6" />
                            )}
                            <span>{isSpinning ? 'R O L L I N G ...' : 'LUNCH SPIN!'}</span>
                        </div>
                    </button>
                </div>
            </div>

            {/* Result Action */}
            {selectedStore && !isSpinning && !isPenalty && (
                <div className="mt-8 w-full animate-enter space-y-3">
                    <div className="flex gap-3">
                        <Link
                            href={`https://map.naver.com/p/search/${encodeURIComponent(selectedStore.name)}`}
                            target="_blank"
                            className="flex-1 py-3.5 px-4 bg-[#03C75A] text-white rounded-xl font-bold text-sm hover:bg-[#02b351] transition-colors flex items-center justify-center gap-2 shadow-md shadow-green-500/20"
                        >
                            <span className="font-extrabold">N</span> 네이버
                        </Link>
                        <Link
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedStore.name)}`}
                            target="_blank"
                            className="flex-1 py-3.5 px-4 bg-blue-500 text-white rounded-xl font-bold text-sm hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 shadow-md shadow-blue-500/20"
                        >
                            <span className="font-extrabold">G</span> 구글맵
                        </Link>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                const text = `🍽️ 오늘의 점심 추천: ${selectedStore.name} (${selectedStore.category})\n오늘 여기서 어때요?`;
                                if (navigator.share) {
                                    navigator.share({
                                        title: '오늘의 점심 추천',
                                        text: text,
                                        url: window.location.href,
                                    }).catch(console.error);
                                } else {
                                    navigator.clipboard.writeText(`${text}\n${window.location.href}`);
                                    alert('링크가 복사되었습니다!');
                                }
                            }}
                            className="flex-1 py-3 px-4 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                        >
                            <span>🔗 공유하기</span>
                        </button>
                        <Link
                            href={`/recommend?menu=${selectedStore.name}&lat=${currentCoords.lat}&lng=${currentCoords.lng}`}
                            className="flex-[1.5] py-3 px-4 bg-orange-50 text-[#FF8A3D] border border-orange-100 rounded-xl font-bold text-sm hover:bg-orange-100 transition-colors flex items-center justify-center gap-2"
                        >
                            <Info className="w-4 h-4" /> 맛집 상세 지도
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
