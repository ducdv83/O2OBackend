export enum UserRole {
  CLIENT = 'CLIENT',
  CAREPRO = 'CAREPRO',
  ADMIN = 'ADMIN',
}

export interface JwtPayload {
  sub: string;
  phone: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

