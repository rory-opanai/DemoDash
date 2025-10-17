export interface HubspotCompanyRecord {
  companyName: string;
  lifecycleStage: string;
  renewalDate: string;
  owner: string;
  arr: number;
  notes: string[];
}

export const fetchHubspotData = async (): Promise<HubspotCompanyRecord> => {
  return {
    companyName: 'NovaMind',
    lifecycleStage: 'Active Customer',
    renewalDate: '2024-11-01',
    owner: 'Maya Chen',
    arr: 245000,
    notes: [
      'Discussed security posture and SOC 2 controls',
      'Requested pricing comparison for scale tier',
      'Excited about roadmap for MCP integrations'
    ]
  };
};
