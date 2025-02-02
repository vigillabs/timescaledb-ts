'use strict';

const { TimescaleDB } = require('@timescaledb/core');

const extension = TimescaleDB.createExtension();

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const sql = extension.up().build();

    await queryInterface.sequelize.query(sql);
  },

  async down(queryInterface) {
    const sql = extension.down().build();

    await queryInterface.sequelize.query(sql);
  },
};
