import { SequelizeTypescriptMigration } from "../../sequelize-typescript-migration";
import { Sequelize } from "sequelize-typescript";
import * as path from "path";
import { Car } from "models/car.model";
import { CarBrand } from "models/car_brand.model";
import { Dialect } from "sequelize/types";

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
    const result = await SequelizeTypescriptMigration.makeMigration(
      sequelize[0],
      {
        outDir: path.join(__dirname, "./migrations"),
        migrationName: Date.now.toString(),
      }
    );
    console.log(result);
  } catch (e) {
    console.log(e);
  }
};
bootstrap();
