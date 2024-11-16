import { ICredential } from '@schemas/mongo/credential.schema';
import { Response } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export const setAccessTokenCookie = (res: Response, existingUser: ICredential) => {
  const token = jwt.sign(
    {
      _id: existingUser._id,
      email: existingUser.credentialEmail,
      role: existingUser.credentialRole,
    },
    process.env.JWT_SECRET || "",
    { expiresIn: "1h" }
  );
  res.cookie('accessToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 3600000, // 1 hour
    sameSite: 'strict',
    path: '/', // Ensure the path is set
  });
};

export const removeAccessTokenCookie = (res: Response) => {
  res.clearCookie('accessToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/', // Ensure the path matches the one used when setting the cookie
  });
};

