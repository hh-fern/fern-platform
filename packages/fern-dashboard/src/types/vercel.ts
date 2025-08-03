export interface VercelDomainResponse {
  name: string;
  apexName: string;
  verified: boolean;
  verification?: VercelDomainVerification[];
}

export interface VercelDomainVerification {
  type: "TXT" | "CNAME";
  domain: string;
  value: string;
  reason?: string;
}

export interface VercelDomainConfig {
  misconfigured: boolean;
  configuredBy?: string;
}

export interface DomainStatus {
  status: "ready" | "needs_dns" | "error" | "verifying";
  message: string;
  instructions?: string[];
}

export interface AddDomainResult {
  success: boolean;
  domain?: VercelDomainResponse;
  isNew: boolean;
}
