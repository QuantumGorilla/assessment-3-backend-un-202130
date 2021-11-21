const bcrypt = require('bcrypt');

const { SALT_ROUNDS } = require('../../config');
const { ROLES } = require('../../config/constants');

const PASSWORD = bcrypt.hashSync('12345', SALT_ROUNDS);

const REGULAR_USER = (idx) => ({
  username: `user${idx}`,
  name: `User ${idx}`,
  email: `user${idx}@test.com`,
  password: PASSWORD,
  active: true,
  role: ROLES.regular,
  createdAt: new Date(),
  updatedAt: new Date(),
});

const DEMO_USERS = [
  {
    username: 'admin',
    name: 'Admin user',
    email: 'admin@test.com',
    password: PASSWORD,
    role: ROLES.admin,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    username: 'userdeactivated',
    name: 'User deactivated',
    email: 'userdeactivated@test.com',
    password: PASSWORD,
    role: ROLES.regular,
    active: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  ...Array.from(Array(50).keys()).map((idx) => REGULAR_USER(idx)),
];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('Users', DEMO_USERS);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Users', null, {});
  },
};
