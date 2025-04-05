const express = require("express");
const ExpressError = require("../expressError");
const router = express.Router();
const db = require("../db");

router.get("/", async (req, res, next) => {
  try {
    const results = await db.query(`SELECT * FROM invoices`);
    return res.json({ invoices: results.rows });
  } catch (e) {
    return next(e);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const results = await db.query(`SELECT * FROM invoices WHERE id = $1`, [
      id,
    ]);
    if (results.rows.length === 0) {
      throw new ExpressError(`Can't find invoice with id of ${id}`, 404);
    }
    return res.send({ invoice: results.rows[0] });
  } catch (e) {
    return next(e);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { comp_code, amt, paid, add_date, paid_date } = req.body;

    const results = await db.query(
      `INSERT INTO invoices (comp_code, amt, paid, add_date, paid_date)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [comp_code, amt, paid, add_date, paid_date]
    );

    return res.status(201).json({ invoice: results.rows[0] });
  } catch (e) {
    return next(e);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amt } = req.body;
    const existingInvoice = await db.query(
      `SELECT * FROM invoices WHERE id = $1`,
      [id]
    );
    if (existingInvoice.rows.length === 0) {
      throw new ExpressError(`Can't find invoice with id of ${id}`, 404);
    }
    const currentInvoice = invoiceResult.rows[0];
    let paidDate = null;
    if (!currentInvoice.paid && paid) {
      paidDate = new Date();
    } else if (!paid) {
      paidDate = null;
    } else {
      paidDate = currentInvoice.paid_date;
    }
    const results = await db.query(
      `UPDATE invoices
       SET amt = $1, paid = $2, paid_date = $3
       WHERE id = $4
       RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [amt, paid, paidDate, id]
    );
    return res.send({ invoice: results.rows[0] });
  } catch (e) {
    return next(e);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const results = db.query("DELETE FROM companies WHERE code = $1", [id]);
    return res.send({ status: "DELETED!" });
  } catch (e) {
    return next(e);
  }
});

router.get("/companies/:code", async (req, res, next) => {
  try {
    const { code } = req.params;

    const companyResult = await db.query(
      `SELECT * FROM companies WHERE code = $1`,
      [code]
    );

    const invoiceResults = await db.query(
      `SELECT * FROM invoices WHERE comp_code = $1`,
      [code]
    );

    if (companyResult.rows.length === 0) {
      throw new ExpressError(`Can't find company with code of ${code}`, 404);
    }

    return res.send({
      company: companyResult.rows[0],
      invoices: invoiceResults.rows,
    });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
