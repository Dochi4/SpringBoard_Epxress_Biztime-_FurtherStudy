process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../app");
const db = require("../db");
const slugify = require("slugify");

let testcompanies;

beforeEach(async () => {
  const name = "Peanuts International";
  const slug = slugify(name); // Generate the slug for the name

  const result = await db.query(
    `INSERT INTO companies (code, name, description, slug) 
       VALUES ('Peanut', $1, 'Charley Brown Thingy', $2) 
       RETURNING code, name, description, slug`,
    [name, slug] // Pass the generated slug and name here
  );
  testcompanies = result.rows[0];
});
afterEach(async () => {
  await db.query("TRUNCATE companies RESTART IDENTITY CASCADE");
});

afterAll(async () => {
  await db.end();
});

describe("GET /companies", () => {
  test("Get a list of companies", async () => {
    const res = await request(app).get("/companies");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ companies: [testcompanies] });
  });
});

describe("GET /companies/:code", () => {
  test("Gets a single company", async () => {
    const res = await request(app).get(`/companies/${testcompanies.code}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ company: testcompanies });
  });
  test("Responds with 404 for invalid code", async () => {
    const res = await request(app).get(`/companies/0`);
    expect(res.statusCode).toBe(404);
  });
});

describe("POST /companies", () => {
  test("Creates a single company", async () => {
    const name = "BillyBod inc.";
    const slug = slugify(name); // Create slug from the name

    const res = await request(app).post("/companies").send({
      code: "BillyBob",
      name: name,
      description: "we do all the billy boddy things",
    });

    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({
      company: {
        code: "BillyBob",
        name: name,
        description: "we do all the billy boddy things",
        slug: slug, // Match the generated slug here
      },
    });
  });
});
describe("PUT /companies/:code", () => {
  test("Updates a single company", async () => {
    const res = await request(app)
      .put(`/companies/${testcompanies.code}`)
      .send({
        code: "BillyBob",
        name: "BillyBod inc.",
        description: "we do all the billy boddy things",
      });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      company: {
        code: "BillyBob", // updated code
        name: "BillyBod inc.",
        description: "we do all the billy boddy things",
      },
    });
  });

  test("Responds with 404 for invalid id", async () => {
    const res = await request(app).put(`/companies/0`).send({
      code: "BillyBob",
      name: "BillyBod inc.",
      description: "we do all the billy boddy things",
    });
    expect(res.statusCode).toBe(404);
  });
});

describe("DELETE /companies/:code", () => {
  test("Deletes a single user", async () => {
    const res = await request(app).delete(`/companies/${testcompanies.code}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ status: "DELETED!" });
  });
});
