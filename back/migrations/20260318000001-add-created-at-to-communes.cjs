'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('communes', 'created_at', {
      type: Sequelize.DATE,
      defaultValue: Sequelize.fn('NOW'),
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('communes', 'created_at');
  },
};
