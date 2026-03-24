'use client';

import type { FC } from 'react';
import type { MMConfig } from '@crispy/shared';
import { useState } from 'react';

import { InfoIcon } from '@/components/dashboard/live-quotes/info-icon';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfigPanelInfoDialog } from './config-panel-info-dialog';
import { PairConfigRow } from './pair-config-row';

type ConfigPanelSectionProps = {
    config: MMConfig | null;
    loading: boolean;
    saving: boolean;
    onSubmit: (next: MMConfig) => void;
};

export const ConfigPanelSection: FC<ConfigPanelSectionProps> = ({
    config,
    loading,
    saving,
    onSubmit,
}) => {
    const [infoOpen, setInfoOpen] = useState(false);
    const [pairOverrides, setPairOverrides] = useState<
        Record<string, Partial<MMConfig['pairs'][number]>>
    >({});

    const openInfo = () => setInfoOpen(true);
    const closeInfo = () => setInfoOpen(false);

    const draft = config
        ? {
              pairs: config.pairs.map((pairConfig) => ({
                  ...pairConfig,
                  ...(pairOverrides[pairConfig.pair] ?? {}),
              })),
          }
        : null;

    const updatePair = (
        pair: string,
        updates: Partial<MMConfig['pairs'][number]>
    ) => {
        setPairOverrides((current) => ({
            ...current,
            [pair]: {
                ...(current[pair] ?? {}),
                ...updates,
            },
        }));
    };

    if (!draft) {
        return (
            <>
                <Card>
                    <CardHeader>
                        <div className="inline-flex items-center gap-2">
                            <CardTitle>MM Config Panel</CardTitle>
                            <button
                                type="button"
                                onClick={openInfo}
                                className="text-slate-500 transition hover:text-slate-300"
                                aria-label="MM config section information"
                            >
                                <InfoIcon />
                            </button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading && (
                            <div className="space-y-3">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-20 w-full" />
                                <Skeleton className="h-20 w-full" />
                                <Skeleton className="h-20 w-full" />
                            </div>
                        )}
                        {!loading && (
                            <p className="text-sm text-slate-400">
                                No config data available.
                            </p>
                        )}
                    </CardContent>
                </Card>
                <ConfigPanelInfoDialog
                    open={infoOpen}
                    onClose={closeInfo}
                />
            </>
        );
    }

    const saveConfig = () => onSubmit(draft);

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="inline-flex items-center gap-2">
                        <CardTitle>MM Config Panel</CardTitle>
                        <button
                            type="button"
                            onClick={openInfo}
                            className="text-slate-500 transition hover:text-slate-300"
                            aria-label="MM config section information"
                        >
                            <InfoIcon />
                        </button>
                    </div>
                    <Button disabled={saving} onClick={saveConfig}>
                        {saving ? 'Saving...' : 'Save Config'}
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    {draft.pairs.map((pairConfig) => (
                        <PairConfigRow
                            key={pairConfig.pair}
                            pairConfig={pairConfig}
                            onUpdate={updatePair}
                        />
                    ))}
                </CardContent>
            </Card>
            <ConfigPanelInfoDialog
                open={infoOpen}
                onClose={closeInfo}
            />
        </>
    );
};
