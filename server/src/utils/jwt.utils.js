import jwt from 'jsonwebtoken';

export const signAccess = (payload) =>
  jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES,
  });

export const signRefresh = (payload) =>
  jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES,
  });

export const verifyAccess = (token) =>
  jwt.verify(token, process.env.JWT_ACCESS_SECRET);

export const verifyRefresh = (token) =>
  jwt.verify(token, process.env.JWT_REFRESH_SECRET);
