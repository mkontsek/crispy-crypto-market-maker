import type { RuntimeTopology } from '@crispy/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Dispatch, SetStateAction } from 'react';

interface UseTopologyMutationProps {
    setSelectedBotId: Dispatch<SetStateAction<string | null>>;
}

export function useTopologyMutation({
    setSelectedBotId,
}: UseTopologyMutationProps) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: RuntimeTopology) => {
            const response = await fetch('/api/topology', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                throw new Error('failed to update topology');
            }
            return (await response.json()) as RuntimeTopology;
        },
        onSuccess: (updatedTopology) => {
            const previousTopology = queryClient.getQueryData<RuntimeTopology>([
                'topology',
            ]);

            queryClient.setQueryData(['topology'], updatedTopology);

            if (
                previousTopology &&
                updatedTopology.bots.length > previousTopology.bots.length
            ) {
                setSelectedBotId(
                    updatedTopology.bots[updatedTopology.bots.length - 1]?.id ??
                        null
                );
            } else {
                setSelectedBotId((current) =>
                    current &&
                    updatedTopology.bots.some((bot) => bot.id === current)
                        ? current
                        : (updatedTopology.bots[0]?.id ?? null)
                );
            }

            queryClient.invalidateQueries({ queryKey: ['quotes'] });
            queryClient.invalidateQueries({ queryKey: ['fills'] });
            queryClient.invalidateQueries({ queryKey: ['pnl'] });
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
        },
    });
}
