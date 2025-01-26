'use strict';

const path = require('path');
const { HourlyPageViews } = require(path.join(__dirname, '../dist/config/HourlyPageViews'));

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const sql = HourlyPageViews.up().build();

    await queryInterface.sequelize.query(sql);
  },

  async down(queryInterface) {
    const statements = HourlyPageViews.down().build();

    for await (const statment of statements) {
      await queryInterface.sequelize.query(statment);
    }
  },
};
