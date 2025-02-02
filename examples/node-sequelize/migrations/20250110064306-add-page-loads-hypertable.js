'use strict';

const path = require('path');
const { PageLoads } = require(path.join(__dirname, '../dist/config/PageLoads'));

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const sql = PageLoads.up().build();

    await queryInterface.sequelize.query(sql);
  },

  async down(queryInterface) {
    const sql = PageLoads.down().build();

    await queryInterface.sequelize.query(sql);
  },
};
