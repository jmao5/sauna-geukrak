import { ReactNode } from 'react';

interface AppFrameProps {
  children: ReactNode;
}

export default function AppFrame({ children }: AppFrameProps) {
  return (
    <div className="flex h-[100dvh] w-screen items-center justify-center overscroll-none bg-bg-main transition-colors duration-200">
      {/*
        id="app-root" — 바텀시트, 모달 등 portal 마운트 기준점
        position: relative 필수 (absolute 자식들의 기준)
      */}
      <div
        id="app-root"
        className="relative flex w-full max-w-md flex-col bg-bg-main shadow-2xl sm:max-w-xl h-full overflow-hidden pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
      >
        {children}
      </div>
    </div>
  );
}
