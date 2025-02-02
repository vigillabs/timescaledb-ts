'use strict';

const { DataTypes } = require('sequelize');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.createTable('stock_prices', {
      symbol: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
      },
      timestamp: {
        type: DataTypes.DATE,
        primaryKey: true,
        allowNull: false,
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      volume: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('stock_prices');
  },
};
