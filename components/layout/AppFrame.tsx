import { ReactNode } from 'react';

interface AppFrameProps {
  children: ReactNode;
}

/**
 * 어플리케이션의 정적인 물리적 프레임을 정의하는 서버 컴포넌트
 * 배경색, 중앙 정렬, 최대 너비(Mobile-first) 등을 설정합니다.
 */
export default function AppFrame({ children }: AppFrameProps) {
  return (
    <div className="flex h-[100dvh] w-screen items-center justify-center overscroll-none bg-bg-main transition-colors duration-200">
      <div className="relative flex w-full max-w-md flex-col bg-bg-main shadow-2xl sm:max-w-xl h-full overflow-hidden pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
        {children}
      </div>
    </div>
  );
}
