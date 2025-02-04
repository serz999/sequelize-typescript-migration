import * as fs from "fs";
import beautify from "js-beautify";
import * as path from "path";
import { IMigrationOptions } from "..";

import removeCurrentRevisionMigrations from "./removeCurrentRevisionMigrations";

export default async function writeMigration(currentState, migration, options: IMigrationOptions) {
  await removeCurrentRevisionMigrations(
    currentState.revision,
    options.outDir,
    options
  );

  const name = options.migrationName || "noname";
  const comment = options.comment || "";

  let myState = JSON.stringify(currentState);
  const searchRegExp = /'/g;
  const replaceWith = "\\'";

  myState = myState.replace(searchRegExp, replaceWith);
    
  let initializeExtensions = '';
  let initializeExtensionsThenWrapBeg = '';
  let initializeExtensionsThenWrapEnd = '';
  if (options.extensions) {
    initializeExtensions = `queryInterface.sequelize.query(\`\n`
    for (const extension of options.extensions) {
        initializeExtensions += `\t\tCREATE EXTENSION IF NOT EXISTS "${extension}";\n`
    } 
    initializeExtensions += `\t\`)`

    initializeExtensionsThenWrapBeg = '.then(() => {'
    initializeExtensionsThenWrapEnd = '})'
  }

  let fillPeriodColumn = '';
  let createTriggerTemplate = '';
  if (options.createVersioningTrigger) {
      fillPeriodColumn =`
        .then(() => { 
            if (command.fn === "addColumn" && command.params[1] === "${options.historyPeriodFieldName}") {
                queryInterface.sequelize.query(\`
                    UPDATE "\${command.params[0]}"
                    SET \${command.params[1]} = '[\${new Date(Date.now()).toISOString()},)';
                \`)
            } 
          }, reject)` 
      createTriggerTemplate = `
        .then(() => { 
            if (command.fn === "createTable" && command.params[0].endsWith("${options.historyTablePostfix}")) {
                queryInterface.sequelize.query(\`
                    CREATE EXTENSION IF NOT EXISTS temporal_tables;
                    CREATE OR REPLACE TRIGGER versioning_trigger
                    BEFORE INSERT OR UPDATE OR DELETE ON "\${command.params[0].replace("${options.historyTablePostfix}", "")}" 
                    FOR EACH ROW EXECUTE PROCEDURE versioning('${options.historyPeriodFieldName}','"\${command.params[0]}"', true); 
                \`)
            } 
          }, reject)`
  }

  const versionCommands = `
      {
        fn: "createTable",
        params: [
          "SequelizeMigrationsMeta",
          {
            "revision": {
              "primaryKey": true,
              "type": Sequelize.INTEGER
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
          "SequelizeMigrationsMeta",
          [{
            revision: info.revision
          }],
          {}
        ]
      },
      {
        fn: "bulkInsert",
        params: [
          "SequelizeMigrationsMeta",
          [{
            revision: info.revision,
            name: info.name,
            state: '${myState}'
          }],
          {}
        ]
      },
    `;

  const versionDownCommands = `
    {
      fn: "bulkDelete",
      params: [
        "SequelizeMigrationsMeta",
        [{
          revision: info.revision,
        }],
        {}
      ]
    },
`;

  let commands = `const migrationCommands = [\n${versionCommands}\n\n \n${migration.commandsUp.join(
    ", \n"
  )} \n];\n`;
  let commandsDown = `const rollbackCommands = [\n${versionDownCommands}\n\n \n${migration.commandsDown.join(
    ", \n"
  )} \n];\n`;

  const actions = ` * ${migration.consoleOut.join("\n * ")}`;

  commands = beautify(commands);
  commandsDown = beautify(commandsDown);

  const info = {
    revision: currentState.revision,
    name,
    created: new Date(),
    comment,
  };

  const template = `'use strict';

const Sequelize = require('sequelize');

/**
 * Actions summary:
 *
${actions}
 *
 **/

const info = ${JSON.stringify(info, null, 4)};

${commands}

${commandsDown}

module.exports = {
  pos: 0,
  up: function(queryInterface, Sequelize) {
    let index = this.pos;
    return new Promise(function(resolve, reject) {
      function next() {
        if (index < migrationCommands.length) {
          let command = migrationCommands[index];
          console.log("[#"+index+"] execute: " + command.fn + " >> " + command.params[0]);
          index++;
          queryInterface[command.fn].apply(queryInterface, command.params)
          ${fillPeriodColumn}
          ${createTriggerTemplate}
          .then(next, reject);
        } else resolve();
      }

      ${initializeExtensions}
      ${initializeExtensionsThenWrapBeg}
        next();
      ${initializeExtensionsThenWrapEnd}
    });
  },
  down: function(queryInterface, Sequelize) {
    let index = this.pos;

    return new Promise(function(resolve, reject) {
      function next() {
        if (index < rollbackCommands.length) {
          let command = rollbackCommands[index];
          console.log("[#"+index+"] execute: " + command.fn + " >> " + command.params[0]);
          index++;
          queryInterface[command.fn].apply(queryInterface, command.params).then(next, reject);
        }
        else resolve();
      }

      next();
    });
  },
  info
};
`;

  const revisionNumber = currentState.revision.toString().padStart(8, "0");

  const filename = path.join(
    options.outDir,
    `${
      revisionNumber + (name !== "" ? `-${name.replace(/[\s-]/g, "_")}` : "")
    }.js`
  );

  fs.writeFileSync(filename, template);

  return { filename, info, revisionNumber };
}
