'use client';

import { ReactNode } from 'react';
import { useUIStore } from '@/stores/uiStore';
import Header from './Header';
import Sidebar from './Sidebar';
import LeftPanel from './LeftPanel';
import RightPanel from './RightPanel';

interface AppLayoutProps {
  children?: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { focusMode, sidebarCollapsed } = useUIStore();

  return (
    <div className={`flex h-screen flex-col ${focusMode ? 'focus-mode' : ''}`}>
      <Header />

      <div className="flex flex-1 overflow-hidden">
        {!focusMode && (
          <Sidebar collapsed={sidebarCollapsed} />
        )}

        <main className="flex flex-1 overflow-hidden">
          {/* Dual-pane layout */}
          <div className="flex w-full">
            {/* Left Panel - Learning Pad */}
            <LeftPanel>{children}</LeftPanel>

            {/* Right Panel - AI Chat */}
            <RightPanel />
          </div>
        </main>
      </div>
    </div>
  );
}
