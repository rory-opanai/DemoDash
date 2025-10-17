export interface NotionWorkspaceSummary {
  workspaceName: string;
  lastSynced: string;
  docs: { title: string; owner: string; lastEdited: string }[];
  actionItems: string[];
}

export const fetchNotionData = async (): Promise<NotionWorkspaceSummary> => {
  return {
    workspaceName: 'NovaMind GTM Playbooks',
    lastSynced: '2024-10-21T14:30:00Z',
    docs: [
      { title: 'Security Evaluation Checklist', owner: 'Priya Patel', lastEdited: '2024-10-18T17:02:00Z' },
      { title: 'Enterprise Pricing Calculator', owner: 'Diego Ramirez', lastEdited: '2024-10-19T09:45:00Z' },
      { title: 'Implementation Runbook', owner: 'Lena Ko', lastEdited: '2024-10-20T22:11:00Z' }
    ],
    actionItems: [
      'Update SOC 2 summary before next CAB review',
      'Document MCP rollout plan for beta customers',
      'Attach ROI calculator to NovaMind opportunity'
    ]
  };
};
