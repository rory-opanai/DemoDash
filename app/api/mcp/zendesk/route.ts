import { okJson } from '@/lib/api';
import { connectorMap } from '@/lib/connectors/connectors-config';

export const runtime = 'nodejs';

export async function GET() {
  const connector = connectorMap['zendesk'];
  if (!connector) {
    return okJson({ error: 'unknown_connector' }, 404);
  }
  const data = await connector.fetchData();
  return okJson({ id: connector.id, data, name: connector.name });
}
