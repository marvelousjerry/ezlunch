'use client';

import { useState, useEffect } from 'react';
import { Shuffle, Check, ScanSearch, Info, MapPin, ArrowRight, RotateCcw } from 'lucide-react';
import Link from 'next/link';

type Store = {
    id: string;
    name: string;
    category: string;
};

// Fallback Data
const INITIAL_STORES: Store[] = [
    { id: 'init-1', name: '김밥천국', category: '분식' },
    { id: 'init-2', name: '스타벅스', category: '카페' },
    { id: 'init-3', name: '맥도날드', category: '패스트푸드' },
    { id: 'init-4', name: '홍콩반점', category: '중식' },
    { id: 'init-5', name: '교촌치킨', category: '치킨' }
];

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

    // Category & Filter State
    const [categories, setCategories] = useState<string[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

    // Reset everything to start over
    const resetFlow = () => {
        setStep('intro');
        setStores([]);
        setCategories([]);
        setSelectedCategories([]);
        setSelectedStore(null);
        setSelectedPenalty(null);
        setIsSpinning(false);
        setIsPenalty(false);
        setMenuFilter('');
    };

    const scanNearbyStores = async (keyword: string = '') => {
        if (!navigator.geolocation) {
            console.error("Geolocation not supported");
            return;
        }

        setIsScanning(true);
        setStores([]);

        try {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;

                    // Reverse Geocoding for User Feedback
                    try {
                        const addrRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
                        const addrData = await addrRes.json();
                        if (addrData.display_name) {
                            alert(`현재 위치 확인: ${addrData.display_name.split(',').slice(0, 3).join(' ')} 근처`);
                        }
                    } catch (e) {
                        console.error("Address fetch failed", e);
                    }

                    const res = await fetch(`/api/restaurants/scan?lat=${latitude}&lng=${longitude}&menu=${keyword}`);
                    const data = await res.json();

                    if (data.stores && data.stores.length > 0) {
                        setStores(data.stores);

                        // Check source for warning
                        if (data.source && data.source.includes('mock')) {
                            alert('⚠️ 주의: 현재 위치 주변에 데이터가 부족하여 가상(예시) 식당 정보가 표시됩니다.');
                        }

                        // Extract Categories
                        const uniqueCats = Array.from(new Set(data.stores.map((s: Store) => s.category))).filter(Boolean) as string[];
                        setCategories(uniqueCats);
                        setSelectedCategories(uniqueCats); // Default select all

                        // Move to next step
                        setStep('category');
                    } else {
                        alert('주변에 식당이 없습니다. 범위를 넓히거나 직접 입력해보세요.');
                    }
                    setIsScanning(false);
                },
                (error) => {
                    console.error("Location error:", error);
                    setIsScanning(false);
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            alert('위치 정보 제공을 허용해주세요.');
                            break;
                        case error.POSITION_UNAVAILABLE:
                            alert('위치 정보를 가져올 수 없습니다. GPS 신호를 확인해주세요.');
                            break;
                        case error.TIMEOUT:
                            alert('위치 정보 요청 시간이 초과되었습니다.');
                            break;
                        default:
                            alert('위치 정보를 가져오는 중 오류가 발생했습니다.');
                    }
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        } catch (error) {
            console.error(error);
            setIsScanning(false);
        }
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
    // RENDER: PHASE 1 - INTRO / SCAN
    // --------------------------------------------------------------------------------
    if (step === 'intro') {
        return (
            <div className="w-full max-w-[28rem] mx-auto p-6 flex flex-col items-center justify-center min-h-[400px] bg-white/60 backdrop-blur-md rounded-3xl shadow-xl shadow-orange-100/20 border border-white/50">
                <div className="mb-6 w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center animate-pulse-slow">
                    <MapPin className="w-10 h-10 text-orange-500" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">주변 맛집 스캔하기</h2>
                <p className="text-gray-500 text-center mb-8 break-keep">
                    현재 위치를 기반으로 주변의 식당들을<br />빠르게 스캔하여 리스트를 만듭니다.
                </p>

                <button
                    onClick={() => scanNearbyStores('')}
                    disabled={isScanning}
                    className="w-full py-4 text-lg font-bold text-white bg-orange-500 rounded-2xl hover:bg-orange-600 active:scale-95 transition-all shadow-lg shadow-orange-200 flex items-center justify-center gap-2"
                >
                    {isScanning ? (
                        <>
                            <ScanSearch className="w-6 h-6 animate-pulse" />
                            <span className="w-24 text-left">스캔 중{scanDots}</span>
                        </>
                    ) : (
                        <>
                            <ScanSearch className="w-6 h-6" />
                            <span>내 주변 맛집 찾기</span>
                        </>
                    )}
                </button>
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

            {/* Header / Reset */}
            <div className="absolute top-5 left-5 z-20">
                <button onClick={resetFlow} className="flex items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors">
                    <RotateCcw className="w-4 h-4" />
                    <span className="text-xs font-semibold">처음으로</span>
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
                            href={`/recommend?menu=${selectedStore.name}`}
                            className="flex-[1.5] py-3 px-4 bg-orange-50 text-[#FF8A3D] border border-orange-100 rounded-xl font-bold text-sm hover:bg-orange-100 transition-colors flex items-center justify-center gap-2"
                        >
                            <Info className="w-4 h-4" /> 내 취향 더 찾기
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
