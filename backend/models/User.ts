import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'ADMIN' | 'EDITOR' | 'VIEWER';

export interface IUser extends Document {
	name: string;
	email: string;
	passwordHash: string;
	roles: UserRole[];
	refreshTokenHash?: string | null;
	refreshTokenExpiresAt?: Date | null;
	comparePassword(password: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
	{
		name: { type: String, required: true, trim: true },
		email: { type: String, required: true, unique: true, lowercase: true, trim: true },
		passwordHash: { type: String, required: true },
		roles: { type: [String], enum: ['ADMIN', 'EDITOR', 'VIEWER'], default: ['VIEWER'] },
		refreshTokenHash: { type: String, default: null },
		refreshTokenExpiresAt: { type: Date, default: null }
	},
	{ timestamps: true }
);

UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
	return bcrypt.compare(password, this.passwordHash);
};

UserSchema.index({ email: 1 }, { unique: true });

export const User = mongoose.model<IUser>('User', UserSchema);

