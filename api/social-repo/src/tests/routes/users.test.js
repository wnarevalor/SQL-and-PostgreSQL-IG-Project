const request = require("supertest");
const buildApp = require("../../app");
const UserRepo = require("../../repos/user-repo");
const Context = require("../context");

let context;
beforeAll(async () => {
  context = await Context.build();
});

beforeEach(async () => {
  await context.reset();
});

//Code that is supposed to be in eveyr test for schema creation
/*beforeAll(async () => {
  //Generating role name to connect to PG as
  const roleName = "a" + randomBytes(4).toString("hex");

  //Connect to pg

  await pool.connect({
    host: "localhost",
    port: 5432,
    database: "socialnetwork-test",
    user: "postgres",
    password: "12899383",
  });

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
});*/

afterAll(() => {
  return context.close();
});

it("create a user", async () => {
  const startingCount = await UserRepo.count();

  await request(buildApp())
    .post("/users")
    .send({ username: "testuser", bio: "test bio" })
    .expect(200);

  const finishCount = await UserRepo.count();
  expect(finishCount - startingCount).toEqual(1);
});
