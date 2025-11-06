import mongoose, { Schema, Document } from 'mongoose';

export interface IScreen extends Document {
	name: string;
	isActive: boolean;
}

const ScreenSchema = new Schema<IScreen>(
	{
		name: { type: String, required: true, trim: true },
		isActive: { type: Boolean, default: true }
	},
	{ timestamps: true }
);

// Case-insensitive search support via collation; also index name
ScreenSchema.index({ name: 1 }, { name: 'idx_screen_name' });

export const Screen = mongoose.model<IScreen>('Screen', ScreenSchema);

