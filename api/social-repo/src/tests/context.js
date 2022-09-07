const { randomBytes } = require("crypto");
const { default: migrate } = require("node-pg-migrate");
const format = require("pg-format");
const pool = require("../pool");

const DEFAULT_OPTS = {
  host: "localhost",
  port: 5432,
  database: "socialnetwork-test",
  user: "postgres",
  password: "12899383",
};

class Context {
  static async build() {
    //Generating role name to connect to PG as
    const roleName = "a" + randomBytes(4).toString("hex");

    //Connect to pg

    await pool.connect(DEFAULT_OPTS);

    //Create a new role
    //avoiding string interpolation...there's no risk at all here but sure
    await pool.query(
      format("CREATE ROLE %I WITH LOGIN PASSWORD %L", roleName, roleName)
    );

    //Create a schema with that name

    await pool.query(`CREATE SCHEMA ${roleName} AUTHORIZATION ${roleName};`);

    //Disconnect from pg

    await pool.close();

    //Run migrations inside of that schema

    await migrate({
      schema: roleName,
      direction: "up",
      log: () => {},
      noLock: true,
      dir: "migrations",
      databaseUrl: {
        host: "localhost",
        port: 5432,
        database: "socialnetwork-test",
        user: roleName,
        password: roleName,
      },
    });

    //Connect to PG as the newly created role

    await pool.connect({
      host: "localhost",
      port: 5432,
      database: "socialnetwork-test",
      user: roleName,
      password: roleName,
    });

    return new Context(roleName);
  }

  constructor(roleName) {
    this.roleName = roleName;
  }

  async reset() {
    return pool.query(
      `
      DELETE FROM users;
      `
    );
  }

  async close() {
    //disconnect from pg
    await pool.close();

    //reconnect as root user
    await pool.connect(DEFAULT_OPTS);

    //delete the role and schema created
    await pool.query(format("DROP SCHEMA %I CASCADE;", this.roleName));
    await pool.query(format("DROP ROLE %I;", this.roleName));

    //disconnect
    await pool.close();
  }
}

module.exports = Context;
