// routes/post.routes.js
import express from 'express';

import { protectRoute } from '../middleware/protectRoute.js';
import {
    createPost,
    likeUnlikePost,
    commentOnPost,
    deletePost,
    getAllPosts,
    getLikedPosts,
    getFollowingPosts,
    getUserPosts,
    getPostById,
    searchPosts,
    getRecentPosts
} from '../controllers/post.controller.js';

const router = express.Router();

// Define specific routes first
router.get('/recent', protectRoute, getRecentPosts); // Fetch recent posts
router.get('/all', protectRoute, getAllPosts); // Get all posts
router.get('/likes/:id', protectRoute, getLikedPosts); // Get liked posts by user ID
router.get('/following', protectRoute, getFollowingPosts); // Get posts from following users
router.get('/user/:username', protectRoute, getUserPosts); // Get posts by username
router.get('/search', protectRoute, searchPosts); // Search posts

// General routes
router.post('/create', protectRoute, createPost); // Create a new post
router.post('/like/:id', protectRoute, likeUnlikePost); // Like or unlike a post
router.post('/comment/:id', protectRoute, commentOnPost); // Comment on a post
router.delete('/:id', protectRoute, deletePost); // Delete a post
router.get('/:id', protectRoute, getPostById); // Get a specific post by ID

export default router;
