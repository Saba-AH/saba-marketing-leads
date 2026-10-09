export interface Lead {
  id: string;
  name: string;
  email: string;
  source: string | null;
  createdAt: Date;
}
