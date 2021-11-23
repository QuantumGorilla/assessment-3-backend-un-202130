const path = require('path');

module.exports = {
  development: {
    dialect: 'sqlite',
    storage: path.join(__dirname, '..', 'database_test.sqlite'),
  },
  test: {
    dialect: 'sqlite',
  },
  production: {
    dialect: 'postgres',
    use_env_variable: 'DATABASE_URL',
  },
};
