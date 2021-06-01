'use strict';

module.exports = {
    up: function (queryInterface, Sequelize) {
        return Promise.all([
            queryInterface.addColumn('users', 'waiting_list', Sequelize.BOOLEAN),
            queryInterface.addColumn('users', 'remote_ip', Sequelize.STRING),
        ]);
    },

    down: function (queryInterface, Sequelize) {
        return Promise.all([
            queryInterface.removeColumn('users', 'waiting_list'),
            queryInterface.removeColumn('users', 'remote_ip'),
        ]);
    }
};
