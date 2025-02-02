'use strict';

const path = require('path');
const { StockPrices } = require(path.join(__dirname, '../dist/config/StockPrices'));

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const sql = StockPrices.up().build();
    await queryInterface.sequelize.query(sql);
  },

  async down(queryInterface) {
    const sql = StockPrices.down().build();
    await queryInterface.sequelize.query(sql);
  },
};
