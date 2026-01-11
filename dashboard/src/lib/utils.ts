import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind CSS classes
 * 
 * Why we need this:
 * - clsx: combines class names conditionally
 * - twMerge: resolves Tailwind conflicts (e.g., "p-2 p-4" → "p-4")
 * 
 * Example usage:
 *   cn("px-4 py-2", isActive && "bg-blue-500", className)
 *   → "px-4 py-2 bg-blue-500" (if isActive is true)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

