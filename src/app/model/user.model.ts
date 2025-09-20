export interface User {
  id?: number;
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  surname: string;
  organization: string;
  active?: boolean;
  role?: string;
}
