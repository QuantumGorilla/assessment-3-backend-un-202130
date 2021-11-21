const { ROLES } = require('../../config/constants');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Users', 'role', {
      allowNull: false,
      type: Sequelize.ENUM(...Object.values(ROLES)),
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Users', 'role');
    await queryInterface.sequelize.query('DROP TYPE "enum_Users_role";');
  },
};
