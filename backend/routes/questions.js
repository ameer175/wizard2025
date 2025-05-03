const express = require('express');
const router = express.Router();
const pool = require('../db');

router.post('/', async (req, res) => {
  const { form_id, question_text, answer_type } = req.body;
  try {
    const [result] = await pool.execute(
      'INSERT INTO questions (form_id, question_text, answer_type) VALUES (?, ?, ?)',
      [form_id, question_text, answer_type]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error(err);  // חשוב
    res.status(500).json({ error: 'DB error', details: err.message });
  }
});


// שליפת שאלות לפי מזהה טופס
router.get('/:formId', async (req, res) => {
  const { formId } = req.params;
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM questions WHERE form_id = ?',
      [formId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'DB error', details: err.message });
  }
});

module.exports = router;
