export interface JwtPayload {
  sub: number; // user id
  email: string;
  role: string;
  iat?: number; // issued at (auto added by JWT)
  exp?: number; // expiry (auto added by JWT)
}
