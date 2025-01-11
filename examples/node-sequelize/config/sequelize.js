// eslint-disable-next-line @typescript-eslint/no-require-imports
require('dotenv').config();

module.exports = {
  development: {
    url: process.env.DATABASE_URL,
    dialect: 'postgres',
    dialectOptions: {
      ssl: false,
    },
    define: {
      underscored: true,
    },
    logging: console.log,
  },
  test: {
    url: process.env.DATABASE_URL,
    dialect: 'postgres',
    dialectOptions: {
      ssl: false,
    },
    define: {
      underscored: true,
    },
    logging: false,
  },
  migrationStorageTableName: 'sequelize_migrations', // Table to store migration history
  seederStorageTableName: 'sequelize_seeds', // Table to store seeder history
};
