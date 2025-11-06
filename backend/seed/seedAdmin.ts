import bcrypt from "bcryptjs";
import { User } from "../models/User";
import { Screen } from "../models/Screen";
import { Playlist } from "../models/Playlist";

export async function seedAdmin(): Promise<void> {
  const email = process.env.SEED_ADMIN_EMAIL || "admin@example.com";
  const name = process.env.SEED_ADMIN_NAME || "Admin";
  const password = process.env.SEED_ADMIN_PASSWORD || "Admin@12345";

  const existing = await User.findOne({ email });
  if (existing) return;

  const passwordHash = await bcrypt.hash(password, 12);
  await User.create({ name, email, passwordHash, roles: ["ADMIN", "EDITOR"] });
}

export async function seedScreens(): Promise<void> {
  const count = await Screen.countDocuments();
  if (count > 0) return;
  await Screen.insertMany([
    { name: "Main Lobby", isActive: true },
    { name: "Conference Room A", isActive: false },
    { name: "Reception", isActive: true },
  ]);
}

export async function seedPlaylists(): Promise<void> {
  const count = await Playlist.countDocuments();
  if (count > 0) return;
  await Playlist.insertMany([
    {
      name: "Welcome Loop",
      items: [
        { url: "https://example.com/media/welcome.mp4" },
        { url: "https://example.com/media/hours.png" },
      ],
    },
    {
      name: "Announcements",
      items: [
        { url: "https://example.com/media/announcement1.jpg" },
        { url: "https://example.com/media/announcement2.jpg" },
      ],
    },
  ]);
}

export async function seedAll(): Promise<void> {
  await seedAdmin();
  await seedScreens();
  await seedPlaylists();
}
