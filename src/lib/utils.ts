import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getInitials(name: string) {
    if (!name) return '';
    const names = name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return names[0].charAt(0) + names[names.length - 1].charAt(0);
}

export function parsePriceToNumber(price?: string | number | null) {
    if (typeof price === 'number') {
        return price;
    }
    if (!price) {
        return 0;
    }
    const normalized = price.toString().replace(/[^0-9.]/g, '');
    const amount = parseFloat(normalized);
    if (!Number.isFinite(amount) || amount <= 0) {
        return 0;
    }
    // Round to two decimals to avoid floating point artifacts
    return Math.round(amount * 100) / 100;
}
