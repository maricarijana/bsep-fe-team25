/**
 * Request model for creating a new certificate template
 */
export interface CreateTemplateRequest {
  name: string;
  caIssuerSerialNumber: string;
  cnValidationRegex: string;
  sanValidationRegex: string | null;
  maxTTLDays: number;
  keyUsage: string[];
  extendedKeyUsage: string[];
}

/**
 * Response model for certificate template data
 */
export interface TemplateResponse {
  id: number;
  name: string;
  caIssuerSerialNumber: string;
  caIssuerCommonName: string;
  cnValidationRegex: string;
  sanValidationRegex: string | null;
  maxTTLDays: number;
  keyUsage: string[];
  extendedKeyUsage: string[];
  createdByEmail: string;
  createdAt: string; // ISO date string
}

/**
 * Available Key Usage options for certificate templates
 */
export const KEY_USAGE_OPTIONS = [
  'digitalSignature',
  'keyCertSign',
  'cRLSign',
  'keyEncipherment',
  'dataEncipherment',
  'keyAgreement',
  'nonRepudiation'
] as const;

/**
 * Available Extended Key Usage options for certificate templates
 */
export const EXTENDED_KEY_USAGE_OPTIONS = [
  'serverAuth',
  'clientAuth',
  'codeSigning',
  'emailProtection',
  'timeStamping'
] as const;

export type KeyUsageType = typeof KEY_USAGE_OPTIONS[number];
export type ExtendedKeyUsageType = typeof EXTENDED_KEY_USAGE_OPTIONS[number];
