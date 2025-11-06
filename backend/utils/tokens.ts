import jwt from "jsonwebtoken";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { IUser } from "../models/User";

const ACCESS_TTL = process.env.ACCESS_TOKEN_TTL || "15m";

export function signAccessToken(user: IUser): string {
  const userId = String(user._id);
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return jwt.sign({ userId, roles: user.roles }, secret, {
    expiresIn: ACCESS_TTL,
  } as any);
}

export function generateOpaqueToken(length = 48): string {
  return crypto.randomBytes(length).toString("hex");
}

export async function hashToken(token: string): Promise<string> {
  return bcrypt.hash(token, 12);
}

export function computeRefreshExpiry(days = 7): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}
