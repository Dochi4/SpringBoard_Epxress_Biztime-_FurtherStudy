const express = require("express");
const ExpressError = require("../expressError");
const router = express.Router();
const db = require("../db");
const slugify = require("slugify");

router.get("/", async (req, res, next) => {
  try {
    const results = await db.query(`SELECT * FROM companies`);
    return res.json({ companies: results.rows });
  } catch (e) {
    return next(e);
  }
});

router.get("/:code", async (req, res, next) => {
  try {
    const { code } = req.params;
    const results = await db.query(`SELECT * FROM companies WHERE code = $1`, [
      code,
    ]);
    if (results.rows.length === 0) {
      throw new ExpressError(`Can't find company with id of ${code}`, 404);
    }
    return res.send({ company: results.rows[0] });
  } catch (e) {
    return next(e);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { code, name, description } = req.body;
    const slug = slugify(name);
    const results = await db.query(
      `INSERT INTO companies (code, name, description, slug)
       VALUES ($1, $2, $3, $4)
       RETURNING code, name, description, slug`,
      [code, name, description, slug]
    );

    return res.status(201).json({ company: results.rows[0] });
  } catch (e) {
    console.error(e);
    return next(e);
  }
});

router.put("/:code", async (req, res, next) => {
  try {
    const { code } = req.params;
    const { name, description } = req.body;
    const existingCompany = await db.query(
      `SELECT * FROM companies WHERE code = $1`,
      [code]
    );
    if (existingCompany.rows.length === 0) {
      throw new ExpressError(`Can't find company with code of ${code}`, 404);
    }
    const results = await db.query(
      `UPDATE companies SET code = $1, name = $2, description = $3 WHERE code = $4 RETURNING code, name, description`,
      [req.body.code || code, name, description, code]
    );

    return res.send({ company: results.rows[0] });
  } catch (e) {
    return next(e);
  }
});

router.delete("/:code", async (req, res, next) => {
  try {
    const { code } = req.params;
    const results = db.query("DELETE FROM companies WHERE code = $1", [code]);
    return res.send({ status: "DELETED!" });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
