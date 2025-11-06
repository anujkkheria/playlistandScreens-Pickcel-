import { Router } from "express";
import { z } from "zod";
import { User } from "../models/User";
import bcrypt from "bcryptjs";
import {
  signAccessToken,
  generateOpaqueToken,
  hashToken,
  computeRefreshExpiry,
} from "../utils/tokens";
import { authenticate } from "../middleware/auth";

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ message: "Invalid input", errors: parsed.error.flatten() });
    return;
  }
  const { email, password } = parsed.data;
  const user = await User.findOne({ email });
  if (!user) {
    res.status(401).json({ message: "Invalid credentials" });
    return;
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    res.status(401).json({ message: "Invalid credentials" });
    return;
  }
  const accessToken = signAccessToken(user);
  const userId = String(user._id);
  const rawRefresh = `${userId}.${generateOpaqueToken(32)}`;
  const refreshTokenHash = await hashToken(rawRefresh);
  user.refreshTokenHash = refreshTokenHash;
  user.refreshTokenExpiresAt = computeRefreshExpiry(7);
  await user.save();

  // Set httpOnly cookie for refresh token
  const isProduction = process.env.NODE_ENV === "production";
  res.cookie("refreshToken", rawRefresh, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/auth",
  });

  res.json({ accessToken });
});

router.post("/refresh", async (req, res) => {
  const provided = req.cookies?.refreshToken;
  if (!provided || typeof provided !== "string") {
    res.status(401).json({ message: "Refresh token not provided" });
    return;
  }
  const [userId, tokenPart] = provided.split(".", 2);
  if (!userId || !tokenPart) {
    res.status(400).json({ message: "Malformed refresh token" });
    return;
  }
  const user = await User.findById(userId);
  if (!user || !user.refreshTokenHash || !user.refreshTokenExpiresAt) {
    res.status(401).json({ message: "Invalid refresh token" });
    return;
  }
  if (user.refreshTokenExpiresAt.getTime() < Date.now()) {
    user.refreshTokenHash = null;
    user.refreshTokenExpiresAt = null;
    await user.save();
    res.status(401).json({ message: "Refresh token expired" });
    return;
  }
  const matches = await bcrypt.compare(provided, user.refreshTokenHash);
  if (!matches) {
    res.status(401).json({ message: "Invalid refresh token" });
    return;
  }
  // rotate refresh token
  const accessToken = signAccessToken(user);
  const newRawRefresh = `${String(user._id)}.${generateOpaqueToken(32)}`;
  user.refreshTokenHash = await hashToken(newRawRefresh);
  user.refreshTokenExpiresAt = computeRefreshExpiry(7);
  await user.save();

  // Update httpOnly cookie with new refresh token
  const isProduction = process.env.NODE_ENV === "production";
  res.cookie("refreshToken", newRawRefresh, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/auth",
  });

  res.json({ accessToken });
});

router.post("/logout", authenticate, async (req, res) => {
  const user = await User.findById(req.user!.userId);
  if (user) {
    user.refreshTokenHash = null;
    user.refreshTokenExpiresAt = null;
    await user.save();
  }
  // Clear refresh token cookie
  res.clearCookie("refreshToken", { path: "/auth" });
  res.status(204).send();
});

router.post("/revoke-all", authenticate, async (req, res) => {
  const user = await User.findById(req.user!.userId);
  if (user) {
    user.refreshTokenHash = null;
    user.refreshTokenExpiresAt = null;
    await user.save();
  }
  // Clear refresh token cookie
  res.clearCookie("refreshToken", { path: "/auth" });
  res.json({ message: "All tokens revoked successfully" });
});

export default router;
