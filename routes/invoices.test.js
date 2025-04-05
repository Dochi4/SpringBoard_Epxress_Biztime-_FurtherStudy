process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../app");
const db = require("../db");

let testCompany;
let testInvoice;

beforeEach(async () => {
  const companyResult = await db.query(
    `INSERT INTO companies (code, name, description) 
     VALUES ('Peanut', 'Peanuts International', 'Charley Brown Thingy') 
     RETURNING code, name, description`
  );
  testCompany = companyResult.rows[0];
  const invoiceResult = await db.query(
    `INSERT INTO invoices (comp_code, amt, paid, add_date, paid_date)
     VALUES ('Peanut', 100, false, '2025-04-01', null)
     RETURNING id, comp_code, amt, paid, add_date, paid_date`
  );
  testInvoice = invoiceResult.rows[0];
});

afterEach(async () => {
  await db.query("TRUNCATE invoices RESTART IDENTITY CASCADE");
  await db.query("TRUNCATE companies RESTART IDENTITY CASCADE");
});

afterAll(async () => {
  await db.end();
});

describe("GET /invoices", () => {
  test("Get a list of invoices", async () => {
    const res = await request(app).get("/invoices");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      invoices: [
        {
          ...testInvoice,
          add_date: "2025-04-01T04:00:00.000Z",
        },
      ],
    });
  });
});

describe("GET /invoices/:id", () => {
  test("Gets a single invoice", async () => {
    const res = await request(app).get(`/invoices/${testInvoice.id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      invoice: {
        ...testInvoice,
        add_date: "2025-04-01T04:00:00.000Z",
      },
    });
  });

  test("Responds with 404 for invalid id", async () => {
    const res = await request(app).get(`/invoices/0`);
    expect(res.statusCode).toBe(404);
  });
});

describe("POST /invoices", () => {
  test("Creates a single invoice", async () => {
    const res = await request(app).post("/invoices").send({
      comp_code: "Peanut",
      amt: 200,
      paid: false,
      add_date: "2025-04-01",
      paid_date: null,
    });
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({
      invoice: {
        id: expect.any(Number),
        comp_code: "Peanut",
        amt: 200,
        paid: false,
        add_date: "2025-04-01T04:00:00.000Z",
        paid_date: null,
      },
    });
  });
});

describe("PUT /invoices/:id", () => {
  test("Updates a single invoice", async () => {
    const res = await request(app).put(`/invoices/${testInvoice.id}`).send({
      amt: 150,
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      invoice: {
        id: testInvoice.id,
        comp_code: testInvoice.comp_code,
        amt: 150,
        paid: testInvoice.paid,
        add_date: "2025-04-01T04:00:00.000Z",
        paid_date: testInvoice.paid_date,
      },
    });
  });

  test("Responds with 404 for invalid id", async () => {
    const res = await request(app).put(`/invoices/0`).send({
      amt: 150,
    });
    expect(res.statusCode).toBe(404);
  });
});

test("Responds with 404 for invalid id", async () => {
  const res = await request(app).put(`/invoices/0`).send({
    amt: 150,
  });
  expect(res.statusCode).toBe(404);
});

describe("DELETE /invoices/:id", () => {
  test("Deletes a single invoice", async () => {
    const res = await request(app).delete(`/invoices/${testInvoice.id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ status: "DELETED!" });
  });
});
