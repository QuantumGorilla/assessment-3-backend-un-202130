/* eslint-disable no-param-reassign */
const {
  Model,
} = require('sequelize');

const bcrypt = require('bcrypt');

const { SALT_ROUNDS } = require('../../config');

const { ROLES } = require('../../config/constants');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      User.hasMany(models.Tweet, {
        foreignKey: 'userId',
      });
    }

    comparePassword(plainTextPassword) {
      return bcrypt.compare(plainTextPassword, this.password);
    }
  }
  User.init({
    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastLoginDate: {
      type: DataTypes.BOOLEAN,
      defaultValue: null,
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    role: {
      type: DataTypes.ENUM,
      values: Object.values(ROLES),
      defaultValue: ROLES.regular,
    },
  }, {
    sequelize,
    modelName: 'User',
  });

  const encryptPassword = async (user) => {
    if (user.changed('password')) {
      user.password = await bcrypt.hash(user.password, SALT_ROUNDS);
    }
  };

  User.beforeCreate(encryptPassword);
  User.beforeUpdate(encryptPassword);

  return User;
};
