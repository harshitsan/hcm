import { clsx, type ClassValue } from 'clsx'

/** Tiny class-name combiner used across the app. */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}
