import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function calculateAdminPrice(basePrice: number) {
  const markedUp = basePrice * 1.2;
  return Math.ceil(markedUp / 1000) * 1000;
}

export function calculateClientPrice(basePrice: number) {
  const markedUp = basePrice * 1.2 * 1.1; // 20% Markup + 10% Profit
  return Math.ceil(markedUp / 1000) * 1000;
}

export function getDriveImageUrl(url: string) {
  if (!url) return "";
  if (url.includes("drive.google.com")) {
    const idMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
    if (idMatch && idMatch[1]) {
      return `https://drive.google.com/uc?export=view&id=${idMatch[1]}`;
    }
  }
  return url;
}
