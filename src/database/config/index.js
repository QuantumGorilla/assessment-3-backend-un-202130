module.exports = {
  development: {
    database: "db_tweets",
    host: "127.0.0.1",
    dialect: "postgres",
    port: "5432",
    username: "root",
    password: "12345",
  },
  test: {
    dialect: 'sqlite',
  },
  production: {
    dialect: 'postgres',
    use_env_variable: 'DATABASE_URL',
  }
};
