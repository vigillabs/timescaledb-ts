'use strict';

const path = require('path');
const { DailyPageStats } = require(path.join(__dirname, '../dist/config/DailyPageStats'));

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const sql = DailyPageStats.up().build();
    await queryInterface.sequelize.query(sql);

    const refreshPolicy = DailyPageStats.up().getRefreshPolicy();
    if (refreshPolicy) {
      await queryInterface.sequelize.query(refreshPolicy);
    }
  },

  async down(queryInterface) {
    const statements = DailyPageStats.down().build();
    for await (const sql of statements) {
      await queryInterface.sequelize.query(sql);
    }
  },
};
