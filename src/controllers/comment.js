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

const deleteTweet = async (req, res, next) => {
  try {
    const { params } = req;
    const tweet = await Tweet.findOne({ where: { id: params.id } });
    if (!tweet) {
      throw new ApiError('Tweet not found', 400);
    }
    if (req.user.id !== tweet.user?.id) {
      throw new ApiError('you can not delete this tweet', 403);
    }

    await Tweet.deleteTweet(tweet);
    res.status(200).json({ data: 'null' });
  } catch (err) {
    next(err);
  }
};

const likeTweet = async (req, res, next) => {
  try {
    const { params } = req;
    let tweet = await Tweet.findOne({ where: { id: params.id } });
    if (!tweet) {
      throw new ApiError('Tweet not found', 400);
    }
    tweet = await Tweet.update({ where: { id: params.id } },
      { likeCounter: tweet.likeCounter + 1 });
    res.status(200).json({ data: tweet });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createComment,
  likeComment,
  deleteComment,
  deleteTweet,
  likeTweet,
};
