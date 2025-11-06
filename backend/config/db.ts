import mongoose from 'mongoose';

export async function connectToDatabase(mongoUri: string): Promise<void> {
	if (!mongoUri) {
		throw new Error('MONGODB_URI is not set');
	}
	await mongoose.connect(mongoUri, { autoIndex: true });
}

export function setupGlobalMongoose(): void {
	mongoose.set('strictQuery', true);
}

