const express = require('express');

const tweetsRouter = express.Router();

const {
  createTweet,
  getTweetById,
  deleteTweet,
  likeTweet,
  getAll,
  getAllFeedByUsername,
  getMyFeed,
} = require('../controllers/tweet');

const {
  createComment,
} = require('../controllers/comment');

const { authMiddleware } = require('../middlewares/authMiddleware');
const { paginationMiddleware } = require('../middlewares/paginationMiddleware');
/*
router.get('/all', authMiddleware, paginationMiddleware, getAllUsers);
*/
tweetsRouter.get('/feed/:username', paginationMiddleware, getAllFeedByUsername);
tweetsRouter.get('/', authMiddleware, paginationMiddleware, getMyFeed);
tweetsRouter.post('/', authMiddleware, createTweet);
tweetsRouter.get('/:id', getTweetById);
tweetsRouter.delete('/:id', authMiddleware, deleteTweet);
tweetsRouter.post('/:id/likes', authMiddleware, likeTweet);
tweetsRouter.post('/:id/comments', authMiddleware, createComment);
/*
tweetsRouter.get('/:id', getUserById);
tweetsRouter.put('/:id', authMiddleware, updateUser);
tweetsRouter.delete('/:id', authMiddleware, deleteUser);
*/

module.exports = tweetsRouter;
