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

                // Update History
                setHistory(prev => {
                    const next = [finalStore.id, ...prev];
                    return next.slice(0, 5); // Keep last 5 selected
                });
            }
        };
        animate();
    };

    // --- RENDER ---

    if (step === 'intro' || (step === 'category' && isScanning && stores.length === 0)) {
        return (
            <div className="w-full max-w-[30rem] mx-auto p-12 flex flex-col items-center justify-center min-h-[480px] bg-white rounded-[3rem] shadow-2xl shadow-orange-100/50 border border-orange-50 relative overflow-hidden animate-fade-in">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-56 h-56 bg-orange-50 rounded-full blur-3xl opacity-60"></div>

                {/* Loading State */}
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

    if (step === 'category') {
        return (
            <div className="w-full max-w-[30rem] mx-auto p-8 flex flex-col bg-white rounded-[2.5rem] shadow-2xl shadow-orange-100/30 border border-orange-50 min-h-[500px] animate-fade-in-up">
                <div className="flex items-center justify-between mb-8">
                    <button onClick={resetFlow} className="p-3 -ml-2 text-slate-400 hover:text-primary rounded-full hover:bg-orange-50 transition-all opacity-0">
                        {/* Hidden since nowhere to go back to */}
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
                                <span>🍴</span>
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
        <div className="flex flex-col items-center justify-center p-8 bg-white/80 backdrop-blur-md rounded-[2.5rem] shadow-2xl border border-orange-50 w-full max-w-[32rem] mx-auto relative animate-fade-in">
            <div className="absolute top-6 left-6 flex gap-4 z-20">
                <button onClick={resetFlow} className="flex items-center gap-1 text-gray-400 hover:text-primary transition-colors">
                    <RotateCcw className="w-4 h-4" /> <span className="text-xs font-bold">다시하기</span>
                </button>
                <button onClick={() => setStep('category')} className="flex items-center gap-1 text-gray-400 hover:text-primary transition-colors">
                    <Check className="w-4 h-4" /> <span className="text-xs font-bold">카테고리 수정</span>
                </button>
            </div>

            <div className="w-full overflow-y-auto max-h-[85vh] pr-1 custom-scrollbar space-y-8 mt-10">
                <div className={`w-full min-h-[320px] flex flex-col items-center justify-center rounded-[2.5rem] relative overflow-hidden transition-all duration-500 ${isPenalty ? 'bg-red-50' : 'bg-orange-50/50'}`}>
                    {!selectedStore && !selectedPenalty && !isSpinning && (
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-inner text-4xl">🥘</div>
                            <p className="text-sm text-gray-500 font-bold">버튼을 눌러주세요!</p>
                        </div>
                    )}

                    {isSpinning && selectedStore && (
                        <div className="text-center animate-pulse">
                            <h2 className="text-3xl font-black text-slate-800/40 mb-2 blur-[1px]">{selectedStore.name}</h2>
                            <span className="px-3 py-1 bg-orange-100/50 rounded-full text-xs font-bold text-orange-600/50 blur-[0.5px]">{selectedStore.category}</span>
                        </div>
                    )}

                    {!isSpinning && (selectedStore || selectedPenalty) && (
                        <div className="w-full h-full flex flex-col relative animate-enter">
                            {isPenalty ? (
                                <div className="text-center py-10 flex flex-col items-center justify-center h-full">
                                    <div className="text-7xl mb-6 animate-bounce">🚨</div>
                                    <div className="text-3xl font-black text-red-500 leading-tight break-keep px-6">{selectedPenalty}</div>
                                </div>
                            ) : selectedStore && (
                                <div className="w-full h-full flex flex-col relative group pb-4">
                                    {/* Hero Image Section */}
                                    <div className="relative w-full h-64 rounded-[2rem] overflow-hidden shadow-lg mb-6 group bg-gray-100">
                                        {isDetailsLoading ? (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-50">
                                                <div className="w-10 h-10 border-4 border-orange-200 border-t-primary rounded-full animate-spin"></div>
                                            </div>
                                        ) : storeDetails?.imageUrl ? (
                                            <>
                                                <img
                                                    src={storeDetails.imageUrl}
                                                    alt={selectedStore.name}
                                                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                                                <div className="absolute bottom-4 left-4 right-4 text-white">
                                                    <span className="px-2.5 py-1 bg-primary text-white rounded-lg text-[10px] font-black tracking-wider uppercase mb-2 inline-block">
                                                        {selectedStore.category}
                                                    </span>
                                                    <h2 className="text-3xl font-black drop-shadow-md leading-tight">{selectedStore.name}</h2>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center bg-orange-50 text-orange-200">
                                                <div className="text-6xl mb-2">🍽️</div>
                                                <span className="text-xs font-bold text-orange-300">이미지 준비중</span>
                                                <div className="absolute bottom-4 left-4">
                                                    <h2 className="text-3xl font-black text-slate-900">{selectedStore.name}</h2>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Info Section */}
                                    <div className="px-2 space-y-4">
                                        {/* Rating & Review Summary */}
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1 bg-yellow-400/10 px-3 py-1.5 rounded-xl border border-yellow-400/20 text-yellow-700 font-bold text-sm">
                                                <span>⭐</span>
                                                <span>{storeDetails?.rating || '별점 정보 없음'}</span>
                                            </div>
                                            <>
                                                <div className="w-full h-full flex flex-col relative group pb-4">
                                                    {/* Hero Image Section */}
                                                    <div className="relative w-full h-64 rounded-[2rem] overflow-hidden shadow-lg mb-6 group bg-gray-100">
                                                        {isDetailsLoading ? (
                                                            <div className="w-full h-full flex items-center justify-center bg-gray-50">
                                                                <div className="w-10 h-10 border-4 border-orange-200 border-t-primary rounded-full animate-spin"></div>
                                                            </div>
                                                        ) : storeDetails?.imageUrl ? (
                                                            <>
                                                                <img
                                                                    src={storeDetails.imageUrl}
                                                                    alt={selectedStore.name}
                                                                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                                                                />
                                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                                                                <div className="absolute bottom-4 left-4 right-4 text-white">
                                                                    <span className="px-2.5 py-1 bg-primary text-white rounded-lg text-[10px] font-black tracking-wider uppercase mb-2 inline-block">
                                                                        {selectedStore.category}
                                                                    </span>
                                                                    <h2 className="text-3xl font-black drop-shadow-md leading-tight">{selectedStore.name}</h2>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <div className="w-full h-full flex flex-col items-center justify-center bg-orange-50 text-orange-200">
                                                                <div className="text-6xl mb-2">🍽️</div>
                                                                <span className="text-xs font-bold text-orange-300">이미지 준비중</span>
                                                                <div className="absolute bottom-4 left-4">
                                                                    <h2 className="text-3xl font-black text-slate-900">{selectedStore.name}</h2>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Info Section */}
                                                    <div className="px-2 space-y-4">
                                                        {/* Rating & Review Summary */}
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex items-center gap-1 bg-yellow-400/10 px-3 py-1.5 rounded-xl border border-yellow-400/20 text-yellow-700 font-bold text-sm">
                                                                <span>⭐</span>
                                                                <span>{storeDetails?.rating || '별점 정보 없음'}</span>
                                                            </div>
                                                            <div className="text-xs font-bold text-slate-400">
                                                                리뷰 {storeDetails?.reviewCount || '0'}개
                                                            </div>
                                                        </div>

                                                        {/* Description */}
                                                        {storeDetails?.description && (
                                                            <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                                                <p className="text-slate-600 text-sm font-medium leading-relaxed">
                                                                    {storeDetails.description.replace(/&nbsp;/g, ' ')}
                                                                </p>
                                                            </div>
                                                        )}

                                                        {/* Address / Distance */}
                                                        <div className="flex items-start gap-2 text-xs text-slate-500 font-medium px-1">
                                                            <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                                                            <span>{selectedStore.address || '주소 정보 없음'} ({Math.round(selectedStore.distance || 0)}m)</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Menu Section */}
                                                {storeDetails?.menuInfo && storeDetails.menuInfo.length > 0 && (
                                                    <div className="px-5 pb-5">
                                                        <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5">
                                                            <span className="text-orange-500">🍽️</span> 대표 메뉴
                                                        </h3>
                                                        <ul className="space-y-2">
                                                            {storeDetails.menuInfo.map((menu, idx) => (
                                                                <li key={idx} className="flex justify-between items-center text-xs border-b border-dashed border-slate-100 pb-2 last:border-0 last:pb-0">
                                                                    <span className="font-medium text-slate-700">{menu.name}</span>
                                                                    <span className="font-bold text-orange-600">{menu.price}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </>
                            )}
                                        </div>
                    )}
                                    </div>

                                    {!isSpinning && selectedStore && (
                                        <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                                            <div className="flex items-center justify-between px-1">
                                                <h3 className="font-black text-slate-800 flex items-center gap-2">
                                                    <MessageSquare className="w-5 h-5 text-orange-500" />
                                                    실시간 방문 후기
                                                </h3>
                                                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">최신 검색 결과</span>
                                            </div>

                                            {isReviewsLoading ? (
                                                <div className="flex gap-4 overflow-x-hidden pb-2">
                                                    {[1, 2].map(i => (
                                                        <div key={i} className="min-w-[240px] h-32 bg-slate-50 rounded-2xl animate-pulse border border-slate-100"></div>
                                                    ))}
                                                </div>
                                            ) : reviews.length > 0 ? (
                                                <div className="flex gap-4 overflow-x-auto pb-6 custom-scrollbar snap-x">
                                                    {reviews.map((review, idx) => (
                                                        <a
                                                            key={idx}
                                                            href={review.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="min-w-[260px] bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-orange-200 transition-all snap-center flex flex-col justify-between group"
                                                        >
                                                            <div>
                                                                <div className="flex items-center justify-between mb-3">
                                                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${review.type === 'blog' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                                                                        {review.type}
                                                                    </span>
                                                                    <span className="text-[10px] text-slate-400 font-medium">{new Date(review.datetime).toLocaleDateString()}</span>
                                                                </div>
                                                                <h4 className="text-[13px] font-bold text-slate-800 line-clamp-2 mb-3 group-hover:text-primary transition-colors leading-relaxed" dangerouslySetInnerHTML={{ __html: review.title }}></h4>
                                                            </div>
                                                            <p className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                                                                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                                {review.blogname || review.cafename}
                                                            </p>
                                                        </a>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="py-10 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                                    <p className="text-xs text-slate-400 font-bold">검색된 최신 후기가 없습니다.</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="w-full space-y-6 pt-2">
                                        <div className="flex justify-center gap-8 select-none">
                                            <label className="flex items-center gap-2 cursor-pointer group">
                                                <div className={`relative w-12 h-6 rounded-full transition-colors duration-200 ease-in-out ${useRandomPenalty ? 'bg-orange-500' : 'bg-slate-200'}`}>
                                                    <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform duration-200 ease-in-out ${useRandomPenalty ? 'translate-x-6' : ''}`}></div>
                                                </div>
                                                <input type="checkbox" className="hidden" checked={useRandomPenalty} onChange={(e) => setUseRandomPenalty(e.target.checked)} />
                                                <span className={`text-sm font-bold transition-colors ${useRandomPenalty ? 'text-orange-600' : 'text-slate-400'}`}>벌칙 10%</span>
                                            </label>

                                            <label className="flex items-center gap-2 cursor-pointer group">
                                                <div className={`relative w-12 h-6 rounded-full transition-colors duration-200 ease-in-out ${avoidDuplicates ? 'bg-orange-500' : 'bg-slate-200'}`}>
                                                    <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform duration-200 ease-in-out ${avoidDuplicates ? 'translate-x-6' : ''}`}></div>
                                                </div>
                                                <input type="checkbox" className="hidden" checked={avoidDuplicates} onChange={(e) => setAvoidDuplicates(e.target.checked)} />
                                                <span className={`text-sm font-bold transition-colors ${avoidDuplicates ? 'text-orange-600' : 'text-slate-400'}`}>중복 방지</span>
                                            </label>
                                        </div>
                                        <button
                                            onClick={spin}
                                            disabled={isSpinning}
                                            className="w-full py-5 bg-gradient-to-b from-orange-400 to-orange-600 text-white rounded-2xl font-black text-xl shadow-xl shadow-orange-200 hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            <Shuffle className="w-6 h-6" />
                                            {isSpinning ? 'G O !' : 'LUNCH SPIN!'}
                                        </button>

                                        {selectedStore && !isSpinning && !isPenalty && (
                                            <div className="grid grid-cols-2 gap-3 animate-enter pb-4">
                                                <Link href={`https://map.naver.com/p/search/${encodeURIComponent(selectedStore.name)}`} target="_blank" className="py-3 bg-[#03C75A] text-white rounded-xl font-bold text-center text-sm hover:brightness-95 transition-all">네이버 지도</Link>
                                                <Link href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedStore.name)}`} target="_blank" className="py-3 bg-blue-500 text-white rounded-xl font-bold text-center text-sm hover:brightness-95 transition-all">구글 지도</Link>
                                                <Link href={`/recommend?menu=${selectedStore.name}&lat=${currentCoords.lat}&lng=${currentCoords.lng}`} className="col-span-2 py-3 bg-orange-50 text-primary border border-orange-100 rounded-xl font-bold text-center text-sm flex items-center justify-center gap-2 hover:bg-orange-100 transition-all"><Info className="w-4 h-4" /> 맛집 상세</Link>
                                            </div>
                                        )}
                                    </div>
                                </div>
        </div >
                    );
}
