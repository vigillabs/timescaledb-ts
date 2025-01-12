'use strict';

const { TimescaleDB } = require('@timescaledb/core');

const hypertable = TimescaleDB.createHypertable('page_loads', {
  by_range: {
    column_name: 'time',
  },
  compression: {
    compress: true,
    compress_orderby: 'time',
    compress_segmentby: 'user_agent',
    policy: {
      schedule_interval: '7 days',
    },
  },
});

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const sql = hypertable.up().build();

    await queryInterface.sequelize.query(sql);
  },

  async down(queryInterface) {
    const sql = hypertable.down().build();

    await queryInterface.sequelize.query(sql);
  },
};
