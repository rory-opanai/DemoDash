export interface ZendeskSupportSnapshot {
  ticketVolume: string;
  avgFirstResponse: string;
  csat: number;
  recentIssues: string[];
  hotspots: { productArea: string; openTickets: number }[];
}

export const fetchZendeskData = async (): Promise<ZendeskSupportSnapshot> => {
  return {
    ticketVolume: 'High',
    avgFirstResponse: '1h 12m',
    csat: 4.6,
    recentIssues: ['API throttling alerts', 'Login problems after SSO cutover', 'Webhook retries failing in eu-west-2'],
    hotspots: [
      { productArea: 'Realtime API', openTickets: 18 },
      { productArea: 'Workspace Permissions', openTickets: 9 },
      { productArea: 'Data Pipelines', openTickets: 6 }
    ]
  };
};
