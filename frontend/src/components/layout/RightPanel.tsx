'use client';

import ChatPanel from '@/components/chat/ChatPanel';

interface RightPanelProps {
  contextType?: string;
  contextId?: string;
  userCode?: string;
}

export default function RightPanel({
  contextType,
  contextId,
  userCode,
}: RightPanelProps) {
  return (
    <div className="flex w-1/2 flex-col bg-gray-50">
      <ChatPanel
        contextType={contextType}
        contextId={contextId}
        userCode={userCode}
      />
    </div>
  );
}
