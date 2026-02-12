import { NextResponse } from 'next/server';
import { getRestaurants } from '@/lib/restaurantService';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const latStr = searchParams.get('lat');
    const lngStr = searchParams.get('lng');
    const menu = searchParams.get('menu'); // Optional filter

    if (!latStr || !lngStr) {
        return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 });
    }

    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);

    const data = await getRestaurants(lat, lng, menu);

    if (data.error) {
        return NextResponse.json({ error: data.error }, { status: 500 });
    }

    return NextResponse.json(data);
}
