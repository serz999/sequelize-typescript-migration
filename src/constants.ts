export interface MigrationState {
  revision?: number
  version?: number
  tables: Record<string, unknown>
}

export interface SequelizeMigrations {
  name: string
  date: Date
}

export interface SequelizeMigrationsMeta {
  revision: number
  name: string
  state: MigrationState
  date: Date
}
