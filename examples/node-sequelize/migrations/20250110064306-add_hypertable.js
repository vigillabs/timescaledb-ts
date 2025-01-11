'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    try {
      await queryInterface.sequelize.query("SELECT create_hypertable('page_loads', 'time');");

      await queryInterface.sequelize.query('ALTER TABLE page_loads SET (timescaledb.compress);');
      await queryInterface.sequelize.query(
        "ALTER TABLE page_loads SET (timescaledb.compress_segmentby = 'user_agent', timescaledb.compress_orderby = 'time');",
      );

      await queryInterface.sequelize.query("SELECT add_compression_policy('page_loads', INTERVAL '7 days');");
    } catch (error) {
      console.error('TimescaleDB operation failed:', error);
      throw error;
    }
  },

  async down(queryInterface) {
    try {
      await queryInterface.sequelize.query("SELECT remove_compression_policy('page_loads');");

      await queryInterface.sequelize.query('ALTER TABLE page_loads SET (timescaledb.compress = false);');

      await queryInterface.sequelize.query("SELECT drop_chunks('page_loads', NOW());");
    } catch (error) {
      console.error('Failed to remove TimescaleDB features:', error);
      throw error;
    }
  },
};
