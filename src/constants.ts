export interface Json {
  [key: string]: any;
}

// aka SequelizeMeta table
export interface SequelizeMigrations {
  name: string;
  date: Date;
}

export interface SequelizeMigrationsMeta {
  revision: number;
  name: string;
  state: MigrationState;
  date: Date;
}

export interface MigrationState {
  revision?: number;
  version?: number;
  tables: Json;
}
