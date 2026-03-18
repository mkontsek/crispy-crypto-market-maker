import type { BotId } from '@crispy/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useKillSwitchMutation(botId: BotId) {
  const queryClient = useQueryClient();
  const botQuery = encodeURIComponent(botId);

  return useMutation({
    mutationFn: async (engaged: boolean) => {
      const response = await fetch(`/api/kill-switch?botId=${botQuery}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ engaged }),
      });
      if (!response.ok) throw new Error('failed to toggle kill switch');
      return response.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['quotes', botId] }),
  });
}
