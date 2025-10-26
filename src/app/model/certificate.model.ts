export interface Certificate {
  id: number;
  serialNumber: string;
  commonName: string;
  organization: string;
  country: string;
  validFrom: string;
  validUntil: string;
  certificateType: 'ROOT_CA' | 'INTERMEDIATE_CA' | 'END_ENTITY';
  isCA: boolean;
  isRevoked: boolean;
  revocationReason: string | null;
  issuerSerialNumber: string | null;
  issuerCommonName: string | null;
  ownerId: number;
  ownerEmail: string;
  pemCertificate: string;
  createdAt: string;
}

export interface RevokeCertificateRequest {
  serialNumber: string;
  reason: string;
}
