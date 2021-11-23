const ApiError = require('../utils/ApiError');
const { User, Tweet, Comment } = require('../database/models');
const TweetSerializer = require('../serializers/TweetSerializer');
const TweetsSerializer = require('../serializers/TweetsSerializer');
const UserSerializer = require('../serializers/UserSerializer');
const { generateAccessToken, verifyAccessToken } = require('../services/jwt');

const createTweet = async (req, res, next) => {
  try {
    const { body } = req;
    const data = {
      text: body.text,
      userId: req.user.id,
    };

    if (Object.values(data).some((val) => val === undefined)) {
      throw new ApiError('Payload must contain text', 400);
    }
    // const user = await User.findOne({ where: { id: req.user.id } });
    const tweet = await Tweet.create(data);
    res.json(new TweetSerializer(tweet));
  } catch (err) {
    next(err);
  }
};

const findTweet = async (where) => {
  const tweet = await Tweet.findOne({
    where,
    include: [
      { model: User },
      { model: Comment },
    ],
  });
  if (!tweet) {
    throw new ApiError('Tweet not found', 404);
  }

  return tweet;
};

const getTweetById = async (req, res, next) => {
  try {
    const { params } = req;

    const tweet = await findTweet({ id: Number(params.id) });

    res.json(new TweetSerializer(tweet));
  } catch (err) {
    next(err);
  }
};

const deleteTweet = async (req, res, next) => {
  try {
    const { params } = req;

    const tweet = await findTweet({ id: Number(params.id) });

    if (req.user.id !== tweet.User?.id) {
      throw new ApiError('you can not delete this tweet', 403);
    }

    await tweet.destroy();
    res.status(200).json({ status: 'success' });
  } catch (err) {
    next(err);
  }
};

const likeTweet = async (req, res, next) => {
  try {
    const { params } = req;
    const tweet = await findTweet({ id: Number(params.id) });

    tweet.likeCounter += 1;
    await tweet.save();
    res.json(new TweetSerializer(tweet));
  } catch (err) {
    next(err);
  }
};

const getAllFeedByUsername = async (req, res, next) => {
  const { params } = req;
  const tweets = await Tweet.findAll({
    where: {
      '$User.username$': params.username,
    },
    ...req.pagination,
    include: [
      { model: Comment },
      { model: User },

    ],
    subQuery: false,
  });
  res.json(new TweetsSerializer(tweets, await req.getPaginationInfo(Tweet)));
};

const getMyFeed = async (req, res, next) => {
  const tweets = await Tweet.findAll({
    where: {
      userId: req.user.id,
    },
    ...req.pagination,
    include: [
      { model: Comment },
      { model: User },
    ],
    subQuery: false,
  });
  res.json(new TweetsSerializer(tweets, await req.getPaginationInfo(Tweet)));
};

module.exports = {
  createTweet,
  deleteTweet,
  getTweetById,
  likeTweet,
  getAllFeedByUsername,
  getMyFeed,
};
