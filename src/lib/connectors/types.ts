export type Connector = {
  id: string;
  name: string;
  logo: string;
  description?: string;
  fetchData: () => Promise<any>;
};
