// models/post.model.js
import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		text: {
			type: String,
			required: true,
		},
		timestamp: {
			type: Date,
			default: Date.now,
		},
	},
	{ _id: true }
);

const postSchema = new mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		text: {
			type: String,
		},
		img: {
			type: String,
		},
		likes: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'User',
			},
		],
		comments: [commentSchema],
	},
	{ timestamps: true }
);

// Static method to get recent posts
postSchema.statics.getRecentPosts = async function (limit = 10) {
	return this.find()
		.sort({ createdAt: -1 }) // Sort by creation time, newest first
		.limit(limit) // Limit the number of posts returned
		.populate({
			path: 'user',
			select: '_id username profilePicture', // Fetch user info excluding sensitive data
		})
		.populate({
			path: 'comments.user',
			select: '_id username profilePicture', // Fetch user info for comments
		});
};

// Static method to fetch a single post by ID with populated fields
postSchema.statics.getPostById = async function (postId) {
	return this.findById(postId)
		.populate({
			path: 'user',
			select: '_id username profilePicture',
		})
		.populate({
			path: 'comments.user',
			select: '_id username profilePicture',
		});
};

const Post = mongoose.model('Post', postSchema);

export default Post;
