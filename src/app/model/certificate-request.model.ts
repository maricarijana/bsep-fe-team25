export interface CreateCertificateRequest {
  commonName: string;
  organization: string;
  organizationalUnit?: string;
  country: string;
  state?: string;
  locality?: string;
  email?: string;
  validityYears: number;
  issuerSerialNumber?: string;
  isCA?: boolean;
  pathLength?: number;
  keyUsage?: string[];
  extendedKeyUsage?: string[];
  subjectAlternativeNames?: string[];
  ownerId?: number;
}
