import Post from '../models/post.model.js';
import User from '../models/user.model.js';
import Notification from '../models/notification.model.js';
import { v2 as cloudinary } from 'cloudinary';
export const createPost = async (request, response) => {
    try {
        let { text, img } = request.body;
        const userId = request.user._id.toString();
        const user = await User.findById(userId);
        if (!user) {
            return response.status(404).json({ error: 'User not found!' });
        }

        if (!text && !img) {
            return response
                .status(400)
                .json({ error: 'Post must have text or an image' });
        }

        if (img) {
            // Upload the image to Cloudinary and assign URL to post
            const uploadResponse = await cloudinary.uploader.upload(img, {
                folder: 'posts',
            });
            img = uploadResponse.secure_url;
        }

        const post = new Post({
            user: userId,
            text: text,
            img: img,
        });

        await post.save();
        return response.status(201).json(post);
    } catch (error) {
        console.log('Error in createPost controller: ', error.message);
        return response.status(500).json({ error: error.message });
    }
};

export const likeUnlikePost = async (request, response) => {
    try {
        const userId = request.user._id;
        const { id: postId } = request.params;

        const post = await Post.findById(postId);
        if (!post) {
            return response.status(404).json({ error: 'Post not found' });
        }

        const userLikePost = post.likes.includes(userId);

        if (userLikePost) {
            // Unlike the post
            post.likes.pull(userId);
            await post.save();
            await User.updateOne({ _id: userId }, { $pull: { likedPosts: postId } });
            return response.status(200).json({ message: 'Post unliked successfully' });
        } else {
            // Like the post
            post.likes.push(userId);
            await post.save();
            await User.updateOne({ _id: userId }, { $push: { likedPosts: postId } });

            // Create and send notification
            if (post.user.toString() !== userId.toString()) {
                const notification = new Notification({
                    from: userId,
                    to: post.user,
                    type: 'like',
                });
                await notification.save();
            }

            return response.status(200).json({ message: 'Post liked successfully' });
        }
    } catch (error) {
        console.log('Error in likeUnlikePost controller: ', error.message);
        return response.status(500).json({ error: 'Internal Server Error' });
    }
};

export const commentOnPost = async (request, response) => {
    try {
        const { text } = request.body;
        const postId = request.params.id;
        const userId = request.user._id;
        console.log("Request Body:", request.body); // Log the incoming request body
        console.log("Post ID:", postId);
        console.log("User ID:", userId);

        if (!text) {
            return response.status(400).json({ error: 'Text is required' });
        }

        const post = await Post.findById(postId);

        if (!post) {
            return response.status(404).json({ error: 'No such post' });
        }

        const comment = {
            user: userId,
            text: text,
            timestamp: new Date(),
        };

        post.comments.push(comment);
        await post.save();

        // Populate the user field in comments
        await post.populate({
            path: 'comments.user',
            select: '-password',
        });

        response.status(200).json(post);
    } catch (error) {
        console.log('Error in commentOnPost controller: ', error.message);
        return response.status(500).json({ error: error.message });
    }
};

export const deletePost = async (request, response) => {
    try {
        const post = await Post.findById(request.params.id);
        if (!post) {
            return response.status(404).json({ error: 'No such post found' });
        }

        if (post.user.toString() !== request.user._id.toString()) {
            return response
                .status(401)
                .json({ error: 'You are not authorized to delete this post' });
        }

        if (post.img) {
            const imgId = post.img.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(`posts/${imgId}`);
        }

        await Post.findByIdAndDelete(request.params.id);

        return response.status(200).json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.log('Error in deletePost controller: ', error.message);
        return response.status(500).json({ error: error.message });
    }
};

export const getAllPosts = async (request, response) => {
    try {
        const posts = await Post.find()
            .sort({ createdAt: -1 })
            .populate({
                path: 'user',
                select: '-password',
            })
            .populate({
                path: 'comments.user',
                select: '-password',
            });

        response.status(200).json(posts);
    } catch (error) {
        console.log('Error in getAllPosts controller: ', error);
        response.status(500).json({ error: 'Internal server error' });
    }
};

// Add other controller functions as needed (e.g., getLikedPosts, getUserPosts)


export const getLikedPosts = async (request, response) => {
	const userId = request.params.id;

	try {
		const user = await User.findById(userId);
		if (!user) {
            return response.status(404).json({ error: "User not found" });
        }

		const likedPosts = await Post.find({ _id: { $in: user.likedPosts } })
			.populate({
				path: "user",
				select: "-password",
			})
			.populate({
				path: "comments.user",
				select: "-password",
			});

		response.status(200).json(likedPosts);
	} catch (error) {
		console.log("Error in getLikedPosts controller: ", error);
		response.status(500).json({ error: "Internal server error" });
	}
};


export const getFollowingPosts = async (request, response) => {
	try {
		const userId = request.user._id;
		const user = await User.findById(userId);
		if (!user) return response.status(404).json({ error: "User not found" });

		const following = user.following;

		const feedPosts = await Post.find({ user: { $in: following } })
			.sort({ createdAt: -1 })
			.populate({
				path: "user",
				select: "-password",
			})
			.populate({
				path: "comments.user",
				select: "-password",
			});

        response.status(200).json(feedPosts);
	} catch (error) {
		console.log("Error in getFollowingPosts controller: ", error);
		response.status(500).json({ error: "Internal server error" });
	}
};

export const getUserPosts = async (request, response) => {
	try {
		const { username } = request.params;

		const user = await User.findOne({ username });
		if (!user) {
            return response.status(404).json({ error: "User not found" });
        }
        
		const posts = await Post.find({ user: user._id })
			.sort({ createdAt: -1 })
			.populate({
				path: "user",
				select: "-password",
			})
			.populate({
				path: "comments.user",
				select: "-password",
			});

		response.status(200).json(posts);
	} catch (error) {
		console.log("Error in getUserPosts controller: ", error);
		response.status(500).json({ error: "Internal server error" });
	}
};

export const searchPosts = async (req, res) => {
  try {
    const { query, username, date } = req.query;

    const searchCriteria = {};

    // Search by title or content
    if (query) {
      searchCriteria.$or = [
        { text: { $regex: query, $options: "i" } }, // Case-insensitive regex search for post text
      ];
    }

    if (username) {
      const user = await User.findOne({ username });
      if (user) {
        searchCriteria.user = user._id;
      }
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      searchCriteria.createdAt = { $gte: startOfDay, $lte: endOfDay }; // Filter by written date
    }

    const posts = await Post.find(searchCriteria)
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "username profileImage",
      });

    res.status(200).json(posts);
  } catch (error) {
    console.error("Error in searchPosts controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getPostById = async (req, res) => {
    try {
      const { id } = req.params;
  
      const post = await Post.findById(id)
        .populate({
          path: "user",
          select: "username profileImage",
        })
        .populate({
          path: "comments.user",
          select: "username profileImage",
        });
  
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }
  
      res.status(200).json(post);
    } catch (error) {
      console.error("Error in getPostById controller:", error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  };

export const getRecentPosts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const recentPosts = await Post.find()
            .sort({ createdAt: -1 })
            .skip(skip) // Skip posts from previous pages
            .limit(limit) // Fetch only the required number of posts
            .populate({
                path: 'user',
                select: '_id username profilePicture educationLevel academicYear',
            })
            .populate({
                path: 'comments.user',
                select: '_id username profilePicture',
            });

        res.status(200).json(recentPosts);
    } catch (error) {
        console.error('Error in getRecentPosts:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
