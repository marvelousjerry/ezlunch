import { NextResponse } from 'next/server';
import { getRestaurantDetails } from '@/lib/restaurantService';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const url = searchParams.get('url');
    const name = searchParams.get('name');

    if (!id || !url) {
        return NextResponse.json({ error: 'ID and URL are required' }, { status: 400 });
    }

    try {
        const details = await getRestaurantDetails(id, url, name || undefined);
        return NextResponse.json(details);
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
