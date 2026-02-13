'use client';

import { useState, useEffect } from 'react';
import { Shuffle, Check, ScanSearch, Info, MapPin, ArrowRight, RotateCcw, ArrowLeft, MessageSquare } from 'lucide-react';
import Link from 'next/link';

type Store = {
    id: string;
    name: string;
    category: string;
    distance?: number;
    url?: string;
    address?: string;
};

const PENALTIES = [
    '오늘은 내가 쏜다! 🔫',
    '편의점 커피 돌리기 ☕',
    '식사 후 아이스크림 사기 🍦',
    '랜덤 메뉴 아무거나 시키기 🎲',
    '디저트 쏘기 🍰'
];

const LUNCH_CATEGORIES = ['한식', '양식', '중식', '일식', '분식', '아시안', '패스트푸드', '치킨', '배달'];

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
    const [history, setHistory] = useState<string[]>([]); // Recently selected store IDs

    // Data
    const [stores, setStores] = useState<Store[]>([]);
    const [isScanning, setIsScanning] = useState(false);
    const [scanDots, setScanDots] = useState('');
    const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number }>({ lat: 37.5635, lng: 127.0035 });

    // Slot Machine Animation State
    const [currentCandidate, setCurrentCandidate] = useState<string>('오늘의 메뉴는?');

    // Store Details & Reviews
    const [storeDetails, setStoreDetails] = useState<{
        imageUrl: string | null;
        description: string | null;
        rating?: string | null;
        reviewCount?: string | null;
        blogReviewUrl?: string | null;
        menuInfo?: { name: string; price: string }[];
    } | null>(null);
    const [isDetailsLoading, setIsDetailsLoading] = useState(false);
    const [reviews, setReviews] = useState<any[]>([]);
    const [isReviewsLoading, setIsReviewsLoading] = useState(false);

    // Category & Filter State
    const [categories, setCategories] = useState<string[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

    const fetchStoreDetails = async (store: Store) => {
        if (!store.url) return;
        setIsDetailsLoading(true);
        try {
            const res = await fetch(`/api/restaurants/details?id=${store.id}&url=${encodeURIComponent(store.url)}&name=${encodeURIComponent(store.name)}&address=${encodeURIComponent(store.address || '')}`);
            const data = await res.json();
            setStoreDetails(data);
        } catch (error) {
            console.error('Failed to fetch store details', error);
        } finally {
            setIsDetailsLoading(false);
        }
    };

    const fetchReviews = async (name: string, address?: string) => {
        setIsReviewsLoading(true);
        try {
            const res = await fetch(`/api/restaurants/reviews?name=${encodeURIComponent(name)}&address=${encodeURIComponent(address || '')}`);
            const data = await res.json();
            setReviews(data.reviews || []);
        } catch (error) {
            console.error('Failed to fetch reviews', error);
        } finally {
            setIsReviewsLoading(false);
        }
    };

    useEffect(() => {
        if (selectedStore && !isSpinning && !isPenalty) {
            fetchStoreDetails(selectedStore);
            fetchReviews(selectedStore.name, selectedStore.address);
        } else {
            setStoreDetails(null);
            setReviews([]);
        }
    }, [selectedStore, isSpinning, isPenalty]);

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

    // Auto-start scanning
    useEffect(() => {
        initialScan();
    }, []);

    const initialScan = async () => {
        setIsScanning(true);
        // Don't clear stores immediately to avoid flicker if re-scanning
        if (stores.length === 0) setStores([]);

        const latitude = 37.5635;
        const longitude = 127.0035;
        setCurrentCoords({ lat: latitude, lng: longitude });

        try {
            // Fetch both Standard (Lunch/Dinner) and Delivery-specific
            const [resStandard, resDelivery] = await Promise.all([
                fetch(`/api/restaurants/scan?lat=${latitude}&lng=${longitude}&radius=1500&t=${Date.now()}`),
                fetch(`/api/restaurants/scan?lat=${latitude}&lng=${longitude}&radius=1500&menu=배달&t=${Date.now()}`)
            ]);

            const dataStandard = await resStandard.json();
            const dataDelivery = await resDelivery.json();

            let allStores = [...(dataStandard.stores || [])];

            // Merge Delivery stores if not already present
            const existingIds = new Set(allStores.map(s => s.id));
            if (dataDelivery.stores) {
                dataDelivery.stores.forEach((s: any) => {
                    if (!existingIds.has(s.id)) {
                        allStores.push(s);
                    }
                });
            }

            if (allStores.length > 0) {
                setStores(allStores);
                const uniqueCats = Array.from(new Set(allStores.map((s: any) => s.category))).filter(Boolean) as string[];
                setCategories(uniqueCats.sort());

                // Default Select ONLY Lunch Categories
                const defaultSelected = uniqueCats.filter(cat => LUNCH_CATEGORIES.includes(cat));
                setSelectedCategories(defaultSelected.length > 0 ? defaultSelected : uniqueCats);

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
        setStep('category'); // Go back to category instead of intro
        setSelectedStore(null);
        setSelectedPenalty(null);
        setIsSpinning(false);
        setIsPenalty(false);
        setStoreDetails(null);
        setReviews([]);
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

    // Spin Logic
    const spin = () => {
        if (isSpinning) return;
        let candidates = stores.filter(s => selectedCategories.includes(s.category));

        // Apply "Avoid Duplicates" if enabled
        if (avoidDuplicates && history.length > 0 && history.length < candidates.length) {
            const filtered = candidates.filter(c => !history.includes(c.id));
            if (filtered.length > 0) {
                candidates = filtered;
            }
        }

        if (candidates.length === 0) {
            alert('선택된 카테고리에 해당하는 식당이 없습니다.');
            return;
        }

        // Random Penalty Logic (10%)
        if (useRandomPenalty && Math.random() < 0.1) {
            setIsSpinning(true);
            let duration = 0;
            const interval = setInterval(() => {
                duration += 100;
                // Slot Machine Text Effect
                setCurrentCandidate(PENALTIES[Math.floor(Math.random() * PENALTIES.length)]);

                if (duration > 2500) {
                    clearInterval(interval);
                    setIsSpinning(false);
                    setIsPenalty(true);
                    setSelectedPenalty(PENALTIES[Math.floor(Math.random() * PENALTIES.length)]);
                    setSelectedStore(null);
                }
            }, 80);
            return;
        }

        setIsSpinning(true);
        setIsPenalty(false);
        setSelectedPenalty(null);
        setSelectedStore(null);

        let duration = 0;
        let speed = 50;
        let intervalId: NodeJS.Timeout;

        // Slot Machine Animation Loop
        const runAnimation = () => {
            // 1. visual update
            const randomStore = candidates[Math.floor(Math.random() * candidates.length)];
            setCurrentCandidate(randomStore.name);

            duration += speed;
            if (duration < 2500) {
                if (duration > 1500) speed += 10; // Slow down
                intervalId = setTimeout(runAnimation, speed);
            } else {
                setIsSpinning(false);
                const finalStore = candidates[Math.floor(Math.random() * candidates.length)];
                setSelectedStore(finalStore);
                setCurrentCandidate(finalStore.name);

                // Update History
                setHistory(prev => {
                    const next = [finalStore.id, ...prev];
                    return next.slice(0, 5);
                });
            }
        };
        runAnimation();
    };

    // Re-Spin Logic (Instant Restart)
    const reSpin = () => {
        // Reset results but keep categories
        setSelectedStore(null);
        setSelectedPenalty(null);
        setIsPenalty(false);
        setStoreDetails(null);
        // Trigger spin immediately
        setTimeout(() => spin(), 0);
    };

    // --- RENDER ---

    // 1. Initial Loading State (Intro)
    if ((isScanning && stores.length === 0)) {
        return (
            <div className="w-full max-w-[30rem] mx-auto p-12 flex flex-col items-center justify-center min-h-[480px] bg-white rounded-[3rem] shadow-2xl shadow-orange-100/50 border border-orange-50 relative overflow-hidden animate-fade-in">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-56 h-56 bg-orange-50 rounded-full blur-3xl opacity-60"></div>
                <div className="relative z-10 flex flex-col items-center gap-6">
                    <div className="w-20 h-20 border-4 border-orange-100 border-t-primary rounded-full animate-spin"></div>
                    <div className="text-center space-y-2">
                        <h2 className="text-2xl font-black text-slate-900">맛집 탐색 중...</h2>
                        <p className="text-slate-500 font-medium">주변의 맛집 정보를<br />불러오고 있습니다.</p>
                    </div>
                </div>
            </div>
        );
    }

    // 2. Main Single View (Categories + Roulette)
    return (
        <div className="flex flex-col items-center justify-start bg-white rounded-[2.5rem] shadow-xl w-full max-w-[32rem] mx-auto relative animate-fade-in overflow-hidden border border-orange-50">

            {/* Header / Top Controls */}
            <div className="w-full px-6 pt-6 pb-2 flex justify-end items-center z-10 bg-white">
                <button
                    onClick={toggleAllCategories}
                    className="text-xs font-bold text-slate-400 hover:text-primary transition-colors bg-slate-50 px-3 py-1.5 rounded-full hover:bg-orange-50"
                >
                    {selectedCategories.length === categories.length ? '전체 해제' : '전체 선택'}
                </button>
            </div>

            {/* Category Grid */}
            <div className="w-full px-6 pb-6 pt-2">
                <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => toggleCategory(cat)}
                            className={`px-3 py-2 rounded-xl font-bold text-xs transition-all border ${selectedCategories.includes(cat)
                                ? 'bg-orange-50 border-primary text-primary shadow-sm scale-105'
                                : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
                <div className="mt-3 text-right">
                    <p className="text-[10px] font-bold text-slate-400">
                        선택된 카테고리: <span className="text-primary text-sm">{stores.filter(s => selectedCategories.includes(s.category)).length}</span> 곳
                    </p>
                </div>
            </div>

            <div className="w-full h-px bg-slate-100"></div>

            {/* Roulette / Result Section */}
            <div className="w-full p-6 bg-slate-50/50 flex-1 min-h-[400px] flex flex-col items-center">

                {/* 1. Roulette Idle / Spinning State */}
                {(!selectedStore && !selectedPenalty) && (
                    <div className="w-full flex-1 flex flex-col items-center justify-center gap-6 py-8">
                        <div className="flex flex-col items-center gap-6">
                            {isSpinning ? (
                                <>
                                    <div className="w-20 h-20 border-4 border-orange-100 border-t-primary rounded-full animate-spin"></div>
                                    <div className="text-center space-y-2">
                                        <h2 className="text-2xl font-black text-slate-900">{currentCandidate}</h2>
                                        <p className="text-slate-500 font-medium text-sm">메뉴 고르는 중...</p>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center space-y-4">
                                    <div className="text-6xl">🎲</div>
                                    <p className="text-slate-400 font-bold">버튼을 눌러주세요</p>
                                </div>
                            )}
                        </div>

                        <div className="w-full space-y-4 max-w-xs">
                            <div className="flex justify-center gap-4 select-none">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <div className={`relative w-10 h-5 rounded-full transition-colors ${useRandomPenalty ? 'bg-orange-500' : 'bg-slate-200'}`}>
                                        <div className={`absolute top-1 left-1 bg-white w-3 h-3 rounded-full transition-transform ${useRandomPenalty ? 'translate-x-5' : ''}`}></div>
                                    </div>
                                    <input type="checkbox" className="hidden" checked={useRandomPenalty} onChange={(e) => setUseRandomPenalty(e.target.checked)} />
                                    <span className={`text-xs font-bold ${useRandomPenalty ? 'text-orange-600' : 'text-slate-400'}`}>벌칙 10%</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <div className={`relative w-10 h-5 rounded-full transition-colors ${avoidDuplicates ? 'bg-orange-500' : 'bg-slate-200'}`}>
                                        <div className={`absolute top-1 left-1 bg-white w-3 h-3 rounded-full transition-transform ${avoidDuplicates ? 'translate-x-5' : ''}`}></div>
                                    </div>
                                    <input type="checkbox" className="hidden" checked={avoidDuplicates} onChange={(e) => setAvoidDuplicates(e.target.checked)} />
                                    <span className={`text-xs font-bold ${avoidDuplicates ? 'text-orange-600' : 'text-slate-400'}`}>중복 방지</span>
                                </label>
                            </div>

                            <button
                                onClick={spin}
                                disabled={isSpinning || selectedCategories.length === 0}
                                className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl font-black text-xl shadow-xl shadow-orange-200 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:scale-100"
                            >
                                <Shuffle className="w-6 h-6" />
                                {isSpinning ? '돌라는 중...' : '오늘의 메뉴는?'}
                            </button>
                            {selectedCategories.length === 0 && (
                                <p className="text-xs text-red-500 font-bold text-center animate-pulse">카테고리를 먼저 선택해주세요!</p>
                            )}
                        </div>
                    </div>
                )}

                {/* 2. Result State */}
                {!isSpinning && (selectedStore || selectedPenalty) && (
                    <div className="w-full relative animate-scale-up">
                        {isPenalty ? (
                            <div className="bg-white rounded-[2rem] p-8 text-center shadow-lg border-2 border-red-100">
                                <div className="text-6xl mb-4 animate-bounce">🚨</div>
                                <h3 className="text-2xl font-black text-red-500 mb-2">벌칙 당첨!</h3>
                                <p className="text-xl font-bold text-slate-800 break-keep">{selectedPenalty}</p>
                                <button
                                    onClick={reSpin}
                                    className="mt-6 w-full py-3 bg-slate-100 text-slate-500 rounded-xl font-bold hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                                >
                                    <RotateCcw className="w-4 h-4" /> 다시 돌리기
                                </button>
                            </div>
                        ) : selectedStore && (
                            <div className="flex flex-col gap-4">
                                <div className="bg-white rounded-[2rem] overflow-hidden shadow-lg border border-slate-100">
                                    {/* Image */}
                                    <div className="relative w-full h-56 bg-gray-100 group">
                                        {isDetailsLoading ? (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <div className="w-8 h-8 border-4 border-orange-200 border-t-primary rounded-full animate-spin"></div>
                                            </div>
                                        ) : storeDetails?.imageUrl ? (
                                            <img
                                                src={storeDetails.imageUrl}
                                                alt={selectedStore.name}
                                                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-orange-100 to-yellow-50 text-orange-300">
                                                <div className="text-6xl mb-2 opacity-50 drop-shadow-sm">
                                                    {selectedStore.category === '한식' ? '🍚' :
                                                        selectedStore.category === '중식' ? '🥟' :
                                                            selectedStore.category === '일식' ? '🍣' :
                                                                selectedStore.category === '양식' ? '🍝' :
                                                                    selectedStore.category === '치킨' ? '🍗' : '🍽️'}
                                                </div>
                                                <p className="text-xs font-bold text-orange-400/80">이미지 검색 실패</p>
                                            </div>
                                        )}
                                        <div className="absolute top-4 left-4">
                                            <span className="px-2.5 py-1 bg-white/90 backdrop-blur-sm text-primary rounded-lg text-xs font-black shadow-sm">
                                                {selectedStore.category}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="p-5">
                                        <div className="flex justify-between items-start mb-2">
                                            <h2 className="text-2xl font-black text-slate-800 leading-tight">{selectedStore.name}</h2>
                                            <div className="flex items-center gap-1 bg-yellow-400/10 px-2 py-1 rounded-lg text-yellow-700 font-bold text-xs">
                                                <span>⭐</span> {storeDetails?.rating || '-'}
                                            </div>
                                        </div>

                                        <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mb-4">
                                            <MapPin className="w-3.5 h-3.5" />
                                            {selectedStore.address}
                                        </p>

                                        <div className="mt-4">
                                            <Link href={`https://www.google.com/maps/search/${encodeURIComponent(selectedStore.name + ' ' + selectedStore.address)}`} target="_blank" className="block w-full py-3 bg-slate-800 text-white rounded-xl font-bold text-center text-xs hover:bg-slate-700 transition-all shadow-md flex items-center justify-center gap-2">
                                                <Info className="w-4 h-4" /> 매장 정보
                                            </Link>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={reSpin}
                                    className="w-full py-4 bg-slate-800 text-white rounded-2xl font-bold text-lg shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                                >
                                    <RotateCcw className="w-5 h-5" /> 다시 돌리기
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

