/**
 * UI 구성 요소(Navbar, FloatingActions 등)를 숨겨야 하는 경로 설정
 */

// Navbar를 숨길 정확한 경로들
export const NAVBAR_HIDDEN_EXACT_PATHS = ['/404'];

// Navbar를 숨길 경로 접두사들 (하위 경로 포함)
export const NAVBAR_HIDDEN_PREFIX_PATHS: string[] = [];

// FloatingActions를 숨길 경로 접두사들
export const FLOATING_ACTIONS_HIDDEN_PREFIX_PATHS: string[] = [];

/**
 * 특정 경로에서 Navbar 표시 여부를 결정
 */
export const shouldHideNavbar = (pathname: string): boolean => {
  const isExactHidden = NAVBAR_HIDDEN_EXACT_PATHS.includes(pathname);
  const isPrefixHidden = NAVBAR_HIDDEN_PREFIX_PATHS.some((prefix) => pathname.startsWith(prefix));
  return isExactHidden || isPrefixHidden;
};

/**
 * 특정 경로에서 FloatingActions 표시 여부를 결정
 */
export const shouldHideFloatingActions = (pathname: string): boolean => {
  return FLOATING_ACTIONS_HIDDEN_PREFIX_PATHS.some((prefix) => pathname.startsWith(prefix));
};
