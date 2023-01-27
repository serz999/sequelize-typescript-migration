import { SequelizeTypescriptMigration } from "../src";
import { Sequelize } from "sequelize-typescript";
import { join } from "path";
import dotenv from "dotenv";

import { Car } from "models/car.model";
import { CarBrand } from "models/car_brand.model";
import { Dialect } from "sequelize";

dotenv.config();

const bootstrap = async () => {
  const sequelize: Sequelize = new Sequelize({
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASS,
    database: process.env.DATABASE_NAME,
    host: process.env.DATABASE_HOST,
    dialect: process.env.DATABASE_DIALECT as Dialect,
    models: [CarBrand, Car],
    timezone: process.env.DATABASE_TIMEZONE,
    logging: false,
  });
  try {
    const result = await SequelizeTypescriptMigration.makeMigration(sequelize, {
      outDir: join(__dirname, "./db/migrations"),
      migrationName: "init",
      useSnakeCase: false,
    });
    console.log(result);
  } catch (e) {
    console.log(e);
  }
};

bootstrap();
