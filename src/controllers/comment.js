const ApiError = require('../utils/ApiError');
const { Tweet, Comment, User } = require('../database/models');

const TweetSerializer = require('../serializers/TweetSerializer');
const CommentSerializer = require('../serializers/CommentSerializer');
const { generateAccessToken, verifyAccessToken } = require('../services/jwt');

const createComment = async (req, res, next) => {
  try {
    const { body } = req;
    const { params } = req;
    const data = {
      text: body.text,
    };
    if (Object.values(data).some((val) => val === undefined)) {
      throw new ApiError('Payload must contain text', 400);
    }
    const tweet = await Tweet.findOne({ where: { id: params.id } });
    if (!tweet) {
      throw new ApiError('Tweet not found', 400);
    }
    data.tweetId = tweet.id;
    const comment = await Comment.create(data);
    res.json(new CommentSerializer(comment));
  } catch (err) {
    next(err);
  }
};
const likeComment = async (req, res, next) => {
  try {
    const { params } = req;
    const comment = await Comment.findOne({ where: { id: params.id } });
    if (!comment) {
      throw new ApiError('Comment not found', 404);
    }
    comment.likeCounter += 1;
    await comment.save();
    res.json(new CommentSerializer(comment));
  } catch (err) {
    next(err);
  }
};

const deleteComment = async (req, res, next) => {
  try {
    const { params } = req;
    const comment = await Comment.findOne({ where: { id: params.id } });
    if (!comment) {
      throw new ApiError('Comment not found', 404);
    }
    await comment.destroy();
    res.status(200).json({ status: 'success' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createComment,
  likeComment,
  deleteComment,
};
