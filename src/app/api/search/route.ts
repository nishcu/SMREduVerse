import { NextResponse } from 'next/server';
import { performSearch } from '@/server/search';

export async function POST(request: Request) {
  try {
    const { query } = await request.json();
    const results = await performSearch(query || '');
    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to perform search' },
      { status: 500 }
    );
  }
}

