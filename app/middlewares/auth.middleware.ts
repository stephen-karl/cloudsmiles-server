import jwt, { JwtPayload } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { removeAccessTokenCookie } from '../utils/cookie.utils';

// Extend the Request type to include user
interface User {
  id: string;
  role: string;
  email: string;
}

type CustomJwtPayload = JwtPayload & {
  user: User;
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.accessToken;

  if (!token) {
    removeAccessTokenCookie(res);
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    // Verify token and decode it
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as CustomJwtPayload;

    if (!decoded) {
      return res.status(401).json({ message: "Invalid token" })
    }

    next();
  } catch (err) {
    removeAccessTokenCookie(res);
    return res.status(401).json({ message: "Invalid token" });
  }
};