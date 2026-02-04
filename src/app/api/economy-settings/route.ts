import { getEconomySettingsAction } from '@/app/super-admin/settings/actions';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const settings = await getEconomySettingsAction();
    if (!settings) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 404 });
    }
    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('Error fetching economy settings:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch settings' }, { status: 500 });
  }
}

