const express = require("express");
const ExpressError = require("../expressError");
const router = express.Router();
const db = require("../db");

router.get("/industries", async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT i.code AS industry_code, i.industry, ARRAY_AGG(ci.comp_code) AS companies
         FROM industries AS i
         LEFT JOIN company_industries AS ci ON i.code = ci.industry_code
         GROUP BY i.code, i.industry`
    );

    return res.json({ industries: result.rows });
  } catch (e) {
    return next(e);
  }
});

router.post("/industries", async (req, res, next) => {
  try {
    const { code, industry } = req.body;

    const result = await db.query(
      `INSERT INTO industries (code, industry)
         VALUES ($1, $2)
         RETURNING code, industry`,
      [code, industry]
    );

    return res.status(201).json({ industry: result.rows[0] });
  } catch (e) {
    return next(e);
  }
});

router.post("/industries/:industry_code/companies", async (req, res, next) => {
  try {
    const { industry_code } = req.params;
    const { comp_code } = req.body;

    const result = await db.query(
      `INSERT INTO company_industries (industry_code, comp_code)
         VALUES ($1, $2)
         RETURNING industry_code, comp_code`,
      [industry_code, comp_code]
    );

    return res.status(201).json({ association: result.rows[0] });
  } catch (e) {
    return next(e);
  }
});
