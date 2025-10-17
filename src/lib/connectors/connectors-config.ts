import { Connector } from './types';
import { fetchHubspotData } from './hubspot';
import { fetchSalesforceData } from './salesforce';
import { fetchZendeskData } from './zendesk';
import { fetchNotionData } from './notion';

export const connectors: Connector[] = [
  {
    id: 'hubspot',
    name: 'HubSpot',
    logo: '/connectors/hubspot.svg',
    description: 'Customer lifecycle and deal insights',
    fetchData: fetchHubspotData
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    logo: '/connectors/salesforce.svg',
    description: 'Pipeline metrics and forecast health',
    fetchData: fetchSalesforceData
  },
  {
    id: 'zendesk',
    name: 'Zendesk',
    logo: '/connectors/zendesk.svg',
    description: 'Support signals and customer sentiment',
    fetchData: fetchZendeskData
  },
  {
    id: 'notion',
    name: 'Notion',
    logo: '/connectors/notion.svg',
    description: 'Playbooks, project plans, and action items',
    fetchData: fetchNotionData
  }
];

export const connectorMap: Record<string, Connector> = connectors.reduce((acc, connector) => {
  acc[connector.id] = connector;
  return acc;
}, {} as Record<string, Connector>);
