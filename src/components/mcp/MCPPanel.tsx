"use client";

import Image from 'next/image';
import { useState } from 'react';
import { connectors } from '@/lib/connectors/connectors-config';
import { useMCPStore } from '@/stores/useMCPStore';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function MCPPanel({ className }: { className?: string }) {
  const { activeConnectors, connectorData, fetchConnectorData, toggleConnector } = useMCPStore();
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const handleToggle = async (id: string) => {
    if (activeConnectors.includes(id)) {
      toggleConnector(id);
      setErrors((prev) => ({ ...prev, [id]: null }));
      return;
    }
    setLoading((prev) => ({ ...prev, [id]: true }));
    try {
      await fetchConnectorData(id);
      setErrors((prev) => ({ ...prev, [id]: null }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch connector data';
      setErrors((prev) => ({ ...prev, [id]: message }));
    } finally {
      setLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div>
        <h2 className="text-lg font-semibold text-neutral-900">Multi-Connector Platform</h2>
        <p className="text-sm text-neutral-600">
          Simulate enterprise integrations by pulling structured data from common systems of record. Connected data is streamed into the assistant context.
        </p>
      </div>
      <div className="space-y-3">
        {connectors.map((connector) => {
          const isActive = activeConnectors.includes(connector.id);
          const data = connectorData[connector.id];
          const isLoading = loading[connector.id];
          const error = errors[connector.id];
          return (
            <div key={connector.id} className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 overflow-hidden rounded-full border border-neutral-200 bg-white">
                  <Image src={connector.logo} alt={connector.name} fill sizes="40px" className="object-contain p-1.5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[15px] font-medium text-neutral-900">{connector.name}</div>
                      {connector.description ? <div className="text-[12px] text-neutral-600">{connector.description}</div> : null}
                    </div>
                    <Button size="sm" variant={isActive ? 'secondary' : 'default'} onClick={() => handleToggle(connector.id)} disabled={isLoading}>
                      {isLoading ? 'Connecting…' : isActive ? 'Disconnect' : 'Connect'}
                    </Button>
                  </div>
                </div>
              </div>
              {error ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">{error}</div>
              ) : null}
              {data ? (
                <details className="rounded-lg border border-neutral-200 bg-white p-3 text-[12px]">
                  <summary className="cursor-pointer select-none font-medium text-neutral-700">View sample payload</summary>
                  <pre className="mt-2 max-h-40 overflow-auto rounded-md bg-neutral-900/90 p-3 text-[11px] text-neutral-50">
                    {JSON.stringify(data, null, 2)}
                  </pre>
                </details>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
