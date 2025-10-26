export interface CreateCAUserRequest {
  email: string;
  fullName: string;
  organization: string;
}

export interface CAUserResponse {
  id: number;
  email: string;
  fullName: string;
  organization: string;
  temporaryPassword: string | null;
  mustChangePassword: boolean;
  role: string;
  active: boolean;
}

export interface CreateCAUserResponse {
  message: string;
}
