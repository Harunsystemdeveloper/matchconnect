import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function daysUntil(date: Date | string) {
  const target = typeof date === 'string' ? new Date(date) : date
  return Math.ceil((target.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}
