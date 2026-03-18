import type { FC } from 'react';

import type { TopologyBot } from '@crispy/shared';

import { cn } from '@/lib/utils';

type BotTabButtonProps = {
  bot: TopologyBot;
  active: boolean;
  onClick: () => void;
};

export const BotTabButton: FC<BotTabButtonProps> = ({ bot, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'max-w-full rounded-md border px-3 py-2 text-left text-sm transition',
      active
        ? 'border-cyan-400 bg-cyan-950/40'
        : 'border-slate-700 bg-slate-900 hover:bg-slate-800'
    )}
  >
    <div className="font-medium">{bot.name}</div>
    <div className="mt-1 text-xs text-slate-400">WS: {bot.wsUrl}</div>
    <div className="text-xs text-slate-400">API: {bot.httpUrl}</div>
  </button>
);
