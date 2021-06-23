import beautify from "js-beautify";
import fs from "fs";
import path from "path";
import removeCurrentRevisionMigrations from "./removeCurrentRevisionMigrations";

export default async function writeMigration(currentState, migration, options) {
  const { revision } = currentState
  await removeCurrentRevisionMigrations(revision, options.outDir, options);

  const name = options.migrationName || "noname";
  const comment = options.comment || "";
  let commands = `var migrationCommands = [ \n${migration.commandsUp.join(
    ", \n"
  )} \n];\n`;
  let commandsDown = `var rollbackCommands = [ \n${migration.commandsDown.join(
    ", \n"
  )} \n];\n`;

  const actions = ` * ${migration.consoleOut.join("\n * ")}`;

  commands = beautify(commands);
  commandsDown = beautify(commandsDown);

  const info = {
    revision,
    name,
    created: new Date(),
    comment,
  };

  const template = `'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
${actions}
 *
 **/

var info = ${JSON.stringify(info, null, 4)};

${commands}

${commandsDown}

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
`;

  const revisionNumber = revision.toString().padStart(8, "0");

  const filename = path.join(
    options.outDir,
    `${
      revisionNumber + (name !== "" ? `-${name.replace(/[\s-]/g, "_")}` : "")
    }.js`
  );

  fs.writeFileSync(filename, template);

  return { filename, info, revisionNumber };
}
