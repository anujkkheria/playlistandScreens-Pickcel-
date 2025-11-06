import mongoose, { Schema, Document } from 'mongoose';

export interface IPlaylistItem {
	url: string;
}

export interface IPlaylist extends Document {
	name: string;
	items: IPlaylistItem[];
}

const PlaylistItemSchema = new Schema<IPlaylistItem>(
	{
		url: { type: String, required: true, trim: true }
	},
	{ _id: false }
);

const PlaylistSchema = new Schema<IPlaylist>(
	{
		name: { type: String, required: true, trim: true },
		items: { type: [PlaylistItemSchema], default: [] }
	},
	{ timestamps: true }
);

PlaylistSchema.index({ name: 1 }, { name: 'idx_playlist_name' });

export const Playlist = mongoose.model<IPlaylist>('Playlist', PlaylistSchema);

