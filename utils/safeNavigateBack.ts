import { router } from 'expo-router';

/**
 * Safely navigates back if possible, otherwise does nothing
 * Prevents "GO_BACK was not handled" warnings
 */
export function safeNavigateBack(): boolean {
  if (router.canGoBack()) {
    router.back();
    return true;
  }
  return false;
}

/**
 * Safely navigates back if possible, otherwise navigates to fallback route
 */
export function safeNavigateBackOrFallback(fallbackRoute: string): void {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallbackRoute as any);
  }
}
