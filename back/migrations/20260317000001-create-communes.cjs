'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('communes', {
      code_insee: {
        type: Sequelize.STRING(10),
        primaryKey: true,
        allowNull: false,
      },
      nom: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      code_postal: {
        type: Sequelize.STRING(10),
        allowNull: true,
      },
      departement: {
        type: Sequelize.STRING(5),
        allowNull: true,
      },
      pp: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      adblue: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      pellets_liv: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      pellets_vrac: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW'),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('communes');
  },
};
