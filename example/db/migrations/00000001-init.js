'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * createTable "CarBrands", deps: []
 * createTable "Cars", deps: [CarBrands]
 *
 **/

var info = {
    "revision": 1,
    "name": "init",
    "created": "2022-07-25T18:28:33.699Z",
    "comment": ""
};

var migrationCommands = [

    {
        fn: "createTable",
        params: [
            "SequelizeMetaMigrations",
            {
                "revision": {
                    "primaryKey": true,
                    "type": Sequelize.UUID
                },
                "name": {
                    "allowNull": false,
                    "type": Sequelize.STRING
                },
                "state": {
                    "allowNull": false,
                    "type": Sequelize.JSON
                },
            },
            {}
        ]
    },
    {
        fn: "bulkDelete",
        params: [
            "SequelizeMetaMigrations",
            [{
                revision: info.revision
            }],
            {}
        ]
    },
    {
        fn: "bulkInsert",
        params: [
            "SequelizeMetaMigrations",
            [{
                revision: info.revision,
                name: info.name,
                state: '{"revision":1,"tables":{"CarBrands":{"tableName":"CarBrands","schema":{"id":{"seqType":"Sequelize.INTEGER","allowNull":false,"primaryKey":true,"autoIncrement":true},"name":{"seqType":"Sequelize.STRING"},"isCertified":{"seqType":"Sequelize.BOOLEAN"},"imgUrl":{"seqType":"Sequelize.STRING"},"orderNo":{"seqType":"Sequelize.INTEGER"},"carsCount":{"seqType":"Sequelize.INTEGER"},"createdAt":{"seqType":"Sequelize.DATE","allowNull":false},"updatedAt":{"seqType":"Sequelize.DATE","allowNull":false}},"indexes":{}},"Cars":{"tableName":"Cars","schema":{"id":{"seqType":"Sequelize.INTEGER","allowNull":false,"primaryKey":true,"autoIncrement":true},"name":{"seqType":"Sequelize.STRING"},"carBrandId":{"seqType":"Sequelize.INTEGER","allowNull":true,"references":{"model":"CarBrands","key":"id"},"onUpdate":"CASCADE","onDelete":"NO ACTION"},"createdAt":{"seqType":"Sequelize.DATE","allowNull":false},"updatedAt":{"seqType":"Sequelize.DATE","allowNull":false}},"indexes":{}}}}'
            }],
            {}
        ]
    },




    {
        fn: "createTable",
        params: [
            "CarBrands",
            {
                "id": {
                    "autoIncrement": true,
                    "primaryKey": true,
                    "allowNull": false,
                    "type": Sequelize.INTEGER
                },
                "name": {
                    "type": Sequelize.STRING
                },
                "isCertified": {
                    "type": Sequelize.BOOLEAN
                },
                "imgUrl": {
                    "type": Sequelize.STRING
                },
                "orderNo": {
                    "type": Sequelize.INTEGER
                },
                "carsCount": {
                    "type": Sequelize.INTEGER
                },
                "createdAt": {
                    "allowNull": false,
                    "type": Sequelize.DATE
                },
                "updatedAt": {
                    "allowNull": false,
                    "type": Sequelize.DATE
                }
            },
            {}
        ]
    },

    {
        fn: "createTable",
        params: [
            "Cars",
            {
                "id": {
                    "autoIncrement": true,
                    "primaryKey": true,
                    "allowNull": false,
                    "type": Sequelize.INTEGER
                },
                "name": {
                    "type": Sequelize.STRING
                },
                "carBrandId": {
                    "onDelete": "NO ACTION",
                    "onUpdate": "CASCADE",
                    "references": {
                        "model": "CarBrands",
                        "key": "id"
                    },
                    "allowNull": true,
                    "type": Sequelize.INTEGER
                },
                "createdAt": {
                    "allowNull": false,
                    "type": Sequelize.DATE
                },
                "updatedAt": {
                    "allowNull": false,
                    "type": Sequelize.DATE
                }
            },
            {}
        ]
    }
];

var rollbackCommands = [

    {
        fn: "bulkDelete",
        params: [
            "SequelizeMetaMigrations",
            [{
                revision: info.revision,
            }],
            {}
        ]
    },



    {
        fn: "dropTable",
        params: ["Cars"]
    },
    {
        fn: "dropTable",
        params: ["CarBrands"]
    }
];

module.exports = {
    pos: 0,
    up: function(queryInterface, Sequelize)
    {
        var index = this.pos;
        return new Promise(function(resolve, reject) {
            async function next() {
                if (index < migrationCommands.length)
                {
                    let command = migrationCommands[index];
                    console.log("[#"+index+"] execute: " + command.fn);
                    index++;
                    try {
                      if(command.fn === 'renameColumn') {
                        await queryInterface.sequelize.query('PRAGMA defer_foreign_keys = ON');
                        await queryInterface.sequelize.query('PRAGMA foreign_keys = OFF');
                      }
                      const result = await queryInterface[command.fn].apply(queryInterface, command.params);
                      if(command.fn === 'renameColumn') {
                        await queryInterface.sequelize.query('PRAGMA foreign_keys = ON');
                        await queryInterface.sequelize.query('PRAGMA defer_foreign_keys = OFF');
                      }
                      await next(result);
                    } catch(e) {
                      console.error(e);
                      reject(e);
                    }
                }
                else
                    resolve();
            }
            next();
        });
    },
    down: function(queryInterface, Sequelize)
    {
        var index = this.pos;
        return new Promise(function(resolve, reject) {
            async function next() {
                if (index < rollbackCommands.length)
                {
                    let command = rollbackCommands[index];
                    console.log("[#"+index+"] execute: " + command.fn);
                    index++;
                    try {
                      if(command.fn === 'renameColumn') {
                        await queryInterface.sequelize.query('PRAGMA defer_foreign_keys = ON');
                        await queryInterface.sequelize.query('PRAGMA foreign_keys = OFF');
                      }
                      const result = await queryInterface[command.fn].apply(queryInterface, command.params);
                      if(command.fn === 'renameColumn') {
                        await queryInterface.sequelize.query('PRAGMA foreign_keys = ON');
                        await queryInterface.sequelize.query('PRAGMA defer_foreign_keys = OFF');
                      }
                      await next(result);
                    } catch(e) {
                      console.error(e);
                      reject(e);
                    }
                }
                else
                    resolve();
            }
            next();
        });
    },
    info: info
};
