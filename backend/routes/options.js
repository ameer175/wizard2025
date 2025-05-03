const express = require('express');
const router = express.Router();
const pool = require('../db');

// הוספת אפשרות לשאלה
router.post('/', async (req, res) => {
  const { question_id, option_text } = req.body;
  try {
    const [result] = await pool.execute(
      'INSERT INTO question_options (question_id, option_text) VALUES (?, ?)',
      [question_id, option_text]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: 'DB error', details: err.message });
  }
});

// שליפת כל האפשרויות לשאלה
router.get('/:questionId', async (req, res) => {
  const { questionId } = req.params;
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM question_options WHERE question_id = ?',
      [questionId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'DB error', details: err.message });
  }
});

module.exports = router;
