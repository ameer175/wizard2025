const express = require('express');
const router = express.Router();
const pool = require('../db');

// שמירת תשובות של טופס
router.post('/', async (req, res) => {
  const { form_id, responder_name, answers } = req.body;

  try {
    const timestamp = new Date();

    for (const questionId in answers) {
      const value = answers[questionId];
      const answerText = Array.isArray(value) ? value.join(', ') : value;

      await pool.execute(
        `INSERT INTO form_responses (form_id, question_id, answer_text, responder_name, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [form_id, questionId, answerText, responder_name || 'אנונימי', timestamp]
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error('DB error:', err);
    res.status(500).json({ error: 'DB error', details: err.message });
  }
});


module.exports = router;
