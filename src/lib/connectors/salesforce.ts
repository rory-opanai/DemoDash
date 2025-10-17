export interface SalesforceForecastSummary {
  quarter: string;
  pipelineCoverage: number;
  weightedPipeline: number;
  commit: number;
  bestCase: number;
  topRisks: string[];
}

export const fetchSalesforceData = async (): Promise<SalesforceForecastSummary> => {
  return {
    quarter: 'Q4 FY24',
    pipelineCoverage: 3.2,
    weightedPipeline: 1840000,
    commit: 1520000,
    bestCase: 1985000,
    topRisks: [
      'Renewal for Globex is blocked on security review',
      'Acme expansion awaiting legal redlines',
      'Northwind proof-of-concept requires more capacity assurances'
    ]
  };
};
