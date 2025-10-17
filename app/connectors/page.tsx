import { Metadata } from 'next';
import { Plug } from 'lucide-react';

export const metadata: Metadata = {
  title: 'MCP Connectors'
};

const connectors = [
  {
    name: 'Salesforce',
    description: 'Sync pipeline data for forecasting and revenue intelligence.',
    status: 'Configured via SALESFORCE_MCP_* environment variables.'
  },
  {
    name: 'Zendesk',
    description: 'Ingest support tickets to augment the customer support bot.',
    status: 'Available through MCP with API token credentials.'
  },
  {
    name: 'Google Drive',
    description: 'Index shared collateral into the knowledge assistant corpus.',
    status: 'Enable by supplying a service account JSON via MCP.'
  }
];

export default function Page() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-neutral-200 bg-white p-8 space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-neutral-100 p-3 text-neutral-700">
            <Plug className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">MCP Connectors</h1>
            <p className="text-sm text-neutral-600">
              Configure third-party systems so demo agents can reason over live enterprise data. Credentials are provided via environment variables or secure secrets and resolved at runtime through the Model Context Protocol.
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-4 text-sm text-neutral-600">
          Add credentials to <code>SALESFORCE_MCP_ENDPOINT</code> (and optional <code>SALESFORCE_MCP_TOKEN</code>) to enable Salesforce forecasting. Additional connectors can be registered by extending the MCP server—this page surfaces their status for demo readiness.
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {connectors.map((connector) => (
          <div key={connector.name} className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-3">
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">{connector.name}</h2>
              <p className="text-sm text-neutral-600">{connector.description}</p>
            </div>
            <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-3 text-xs text-neutral-600">
              {connector.status}
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-6 text-sm text-neutral-600">
        <div className="font-medium text-neutral-900 mb-2">Coming next</div>
        <p>
          Build a lightweight admin UI to add, test, and revoke MCP credentials. Until then, connectors can be bootstrapped in code—see <code>app/api/connectors</code> routes for health checks and reference implementations.
        </p>
      </div>
    </div>
  );
}
