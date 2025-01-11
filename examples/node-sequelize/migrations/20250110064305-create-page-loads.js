'use strict';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { DataTypes } = require('sequelize');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.createTable('page_loads', {
      user_agent: {
        type: DataTypes.TEXT,
        primaryKey: true,
        allowNull: false,
      },
      time: {
        type: DataTypes.DATE,
        primaryKey: true,
        allowNull: false,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('page_loads');
  },
};
