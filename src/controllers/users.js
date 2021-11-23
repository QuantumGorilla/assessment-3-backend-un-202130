const nodemailer = require('nodemailer');
const ApiError = require('../utils/ApiError');

const { User, PasswordResets } = require('../database/models');
const { generateAccessToken, generatePasswordToken, verifyAccessToken } = require('../services/jwt');
const { transporter } = require('../services/mail');

const UserSerializer = require('../serializers/UserSerializer');
const AuthSerializer = require('../serializers/AuthSerializer');
const UsersSerializer = require('../serializers/UsersSerializer');

const { ROLES } = require('../config/constants');

const findUser = async (where) => {
  Object.assign(where, { active: true });
  const user = await User.findOne({ where });
  if (!user) {
    throw new ApiError('User not found', 400);
  }
  return user;
};

const getAllUsers = async (req, res, next) => {
  try {
    req.isRole(ROLES.admin);

    const users = await User.findAll({ ...req.pagination });

    res.json(new UsersSerializer(users, await req.getPaginationInfo(User)));
  } catch (err) {
    next(err);
  }
};

const createUser = async (req, res, next) => {
  try {
    const { body } = req;

    if (body.password !== body.passwordConfirmation) {
      throw new ApiError('Passwords do not match', 400);
    }

    const userPayload = {
      username: body.username,
      email: body.email,
      name: body.name,
      password: body.password,
    };

    if (Object.values(userPayload).some((val) => val === undefined)) {
      throw new ApiError('Payload must contain name, username, email and password', 400);
    }

    const user = await User.create(userPayload);

    res.json(new UserSerializer(user));
  } catch (err) {
    next(err);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const { params } = req;
    const user = await findUser({ id: Number(params.id) });
    res.json(new UserSerializer(user));
  } catch (err) {
    next(err);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { params, body } = req;

    const userId = Number(params.id);
    req.isUserAuthorized(userId);

    const user = await findUser({ id: userId });

    const userPayload = {
      username: body.username,
      email: body.email,
      name: body.name,
    };

    if (Object.values(userPayload).some((val) => val === undefined)) {
      throw new ApiError('Payload can only contain username, email or name', 400);
    }

    Object.assign(user, userPayload);

    await user.save();

    res.json(new UserSerializer(user));
  } catch (err) {
    next(err);
  }
};

const deactivateUser = async (req, res, next) => {
  try {
    const { params } = req;

    const userId = Number(params.id);
    req.isUserAuthorized(userId);

    const user = await findUser({ id: userId });

    Object.assign(user, { active: false });

    await user.save();

    res.json(new UserSerializer(null));
  } catch (err) {
    next(err);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { body } = req;

    const user = await findUser({ username: body.username });

    if (!(await user.comparePassword(body.password))) {
      throw new ApiError('User not found', 400);
    }

    const accessToken = generateAccessToken(user.id, user.role);
    user.lastLoginDate = new Date();
    await user.save();

    res.json(new AuthSerializer(accessToken));
  } catch (err) {
    next(err);
  }
};

const updatePassword = async (req, res, next) => {
  try {
    const { params, body } = req;

    if (body.password !== body.passwordConfirmation) {
      throw new ApiError('Passwords do not match', 400);
    }
    const userId = req.user.id;
    const user = await findUser({ id: userId });

    const userPayload = {
      password: body.password,
    };

    if (Object.values(userPayload).some((val) => val === undefined)) {
      throw new ApiError('Payload can only contain password', 400);
    }

    Object.assign(user, userPayload);
    await user.save();
    res.json(new UserSerializer(user));
  } catch (err) {
    next(err);
  }
};

const sendResetPassword = async (req, res, next) => {
  try {
    const { username } = req.body;
    const user = await User.findOne({ where: { username } });
    if (!user) {
      throw new ApiError('User not found', 404);
    }
    const token = generatePasswordToken(user.id);
    PasswordResets.create({ token });
    transporter.sendMail({
      from: `"Trinos" <${process.env.MAIL_USER}>`,
      to: `${user.email}`,
      subject: 'Trinos - Password reset',
      text: `Your reset token is: ${token}`,
    }, (error, info) => {
      if (error) {
        throw new ApiError('Error when sending email', 500);
      } else {
        res.status(200).json({ message: 'email sent' });
      }
    });
  } catch (err) {
    next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, password, passwordConfirmation } = req.body;
    if (password !== passwordConfirmation) {
      throw new ApiError('Passwords do not match', 400);
    }
    const tokenDB = await PasswordResets.findOne({ where: { token } });
    if (!tokenDB) {
      throw new ApiError('Invalid or expired token', 500);
    }
    const { userId } = verifyAccessToken(token);
    if (!userId) {
      throw new ApiError('Invalid or expired token', 500);
    }
    const user = await findUser({ id: userId });
    Object.assign(user, { password });
    await user.save();
    await tokenDB.destroy();
    res.status(200).json({ message: 'password resetted' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createUser,
  getUserById,
  updateUser,
  deactivateUser,
  loginUser,
  getAllUsers,
  updatePassword,
  sendResetPassword,
  resetPassword,
};
