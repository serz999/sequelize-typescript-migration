const path = require("path");
const inflection = require("inflection");

module.exports = {
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASS,
  database: process.env.DATABASE_NAME,
  host: process.env.DATABASE_HOST,
  dialect: process.env.DATABASE_DIALECT,
  models: [path.join(process.cwd(), "models")],
  modelMatch: (_filename, _member) => {
    const filename = inflection.camelize(_filename.replace(".model", ""));
    const member = _member;
    return filename === member;
  },
  timezone: process.env.DATABASE_TIMEZONE,
};
