import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRub(n: number): string {
  return new Intl.NumberFormat("ru-RU").format(n) + " ₽";
}

export function shopStatus(): { open: boolean } {
  const now = new Date();
  const mskMinutes = ((now.getUTCHours() + 3) % 24) * 60 + now.getUTCMinutes();
  return { open: mskMinutes >= 11 * 60 && mskMinutes < 21 * 60 + 45 };
}
