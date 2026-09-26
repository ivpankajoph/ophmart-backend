import jwt from 'jsonwebtoken';
import { UserRole } from '../types';

export interface ITokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export const generateTokens = (payload: ITokenPayload) => {
  const jwtSecret = process.env.JWT_SECRET || 'ophmart_super_secret_jwt_key_2026_luxury_editorial';
  const refreshSecret = process.env.JWT_REFRESH_SECRET || 'ophmart_super_secret_refresh_jwt_key_2026';

  const accessToken = jwt.sign(payload, jwtSecret, {
    expiresIn: '7d'
  });

  const refreshToken = jwt.sign(payload, refreshSecret, {
    expiresIn: '30d'
  });

  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token: string): ITokenPayload | null => {
  try {
    const jwtSecret = process.env.JWT_SECRET || 'ophmart_super_secret_jwt_key_2026_luxury_editorial';
    return jwt.verify(token, jwtSecret) as ITokenPayload;
  } catch (err) {
    return null;
  }
};

export const verifyRefreshToken = (token: string): ITokenPayload | null => {
  try {
    const refreshSecret = process.env.JWT_REFRESH_SECRET || 'ophmart_super_secret_refresh_jwt_key_2026';
    return jwt.verify(token, refreshSecret) as ITokenPayload;
  } catch (err) {
    return null;
  }
};
