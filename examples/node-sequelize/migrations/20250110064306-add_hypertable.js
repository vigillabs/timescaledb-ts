'use strict';

const path = require('path');
const { pageLoadsHypertable } = require(path.join(__dirname, '../dist/config/hypertable'));

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const sql = pageLoadsHypertable.up().build();

    await queryInterface.sequelize.query(sql);
  },

  async down(queryInterface) {
    const sql = pageLoadsHypertable.down().build();

    await queryInterface.sequelize.query(sql);
  },
};
