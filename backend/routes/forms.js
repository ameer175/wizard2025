const express = require('express');
const router = express.Router();
const pool = require('../db');

router.post('/', async (req, res) => {
  const { title } = req.body;
  try {
    const [result] = await pool.execute(
      'INSERT INTO forms (title) VALUES (?)',
      [title]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: 'DB error', details: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM forms');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'DB error', details: err.message });
  }
});


router.get('/:formId/full', async (req, res) => {
  const { formId } = req.params;
  try {
    const [questions] = await pool.execute(
      'SELECT * FROM questions WHERE form_id = ?',
      [formId]
    );

    for (let q of questions) {
      if (q.answer_type === 'radio' || q.answer_type === 'checkbox') {
        const [options] = await pool.execute(
          'SELECT * FROM question_options WHERE question_id = ?',
          [q.id]
        );
        q.options = options;
      }
    }

    const [form] = await pool.execute(
      'SELECT * FROM forms WHERE id = ?',
      [formId]
    );

    res.json({
      form: form[0],
      questions,
    });
  } catch (err) {
    res.status(500).json({ error: 'DB error', details: err.message });
  }
});

router.get('/:formId/responses', async (req, res) => {
  const { formId } = req.params;

  try {
    // טען את שאלות הטופס
    const [questions] = await pool.execute(
      'SELECT id, question_text FROM questions WHERE form_id = ?',
      [formId]
    );

    // טען את כל התשובות הקשורות
    const [responses] = await pool.execute(
      'SELECT question_id, answer_text, created_at FROM form_responses WHERE form_id = ? ORDER BY created_at DESC',
      [formId]
    );

    // ארגן לפי שאלה
    const result = questions.map((q) => {
      const qResponses = responses
        .filter((r) => r.question_id === q.id)
        .map((r) => ({ answer: r.answer_text, time: r.created_at }));

      return { question: q.question_text, responses: qResponses };
    });

    res.json(result);
  } catch (err) {
    console.error('DB error:', err);
    res.status(500).json({ error: 'DB error', details: err.message });
  }
});

router.get('/:formId/responses-grouped', async (req, res) => {
  const { formId } = req.params;

  try {
    // שליפת כל התשובות של הטופס
    const [rows] = await pool.execute(
      'SELECT responder_name, question_id, answer_text, created_at FROM form_responses WHERE form_id = ? ORDER BY created_at DESC',
      [formId]
    );

    // שליפת כל השאלות של הטופס
    const [questions] = await pool.execute(
      'SELECT id, question_text FROM questions WHERE form_id = ?',
      [formId]
    );

    // מיפוי מזהי שאלות לטקסט השאלה
    const questionMap = {};
    questions.forEach((q) => {
      questionMap[q.id] = q.question_text;
    });

    // קיבוץ התשובות לפי ממלא הטופס
    const grouped = {};
    rows.forEach((row) => {
      const key = `${row.responder_name}_${row.created_at.toISOString()}`;
      if (!grouped[key]) {
        grouped[key] = {
          responder_name: row.responder_name,
          created_at: row.created_at,
          answers: [],
        };
      }
      grouped[key].answers.push({
        question: questionMap[row.question_id],
        answer: row.answer_text,
      });
    });

    // המרת האובייקט למערך
    const result = Object.values(grouped);

    res.json(result);
  } catch (err) {
    console.error('DB error:', err);
    res.status(500).json({ error: 'DB error', details: err.message });
  }
});

// שליפת רשימת ממלאים לפי form_id
router.get('/:formId/responders', async (req, res) => {
  const { formId } = req.params;

  try {
    const [rows] = await pool.execute(
      `SELECT DISTINCT responder_name, created_at 
       FROM form_responses 
       WHERE form_id = ?
       ORDER BY created_at DESC`,
      [formId]
    );

    res.json(rows);
  } catch (err) {
    console.error('DB error:', err);
    res.status(500).json({ error: 'DB error', details: err.message });
  }
});


router.get('/:formId/responses/by-responder', async (req, res) => {
  const { formId } = req.params;
  const { name } = req.query;

  try {
    // נטען את כל השאלות של הטופס
    const [questions] = await pool.execute(
      'SELECT id, question_text FROM questions WHERE form_id = ?',
      [formId]
    );

    const questionMap = {};
    questions.forEach((q) => {
      questionMap[q.id] = q.question_text;
    });

    // נטען את התשובות האחרונות של הממלא הזה לפי תאריך
    const [responses] = await pool.execute(
      `SELECT question_id, answer_text 
       FROM form_responses 
       WHERE form_id = ? AND responder_name = ?
       ORDER BY created_at DESC`,
      [formId, name]
    );

    // נמפה לפי שאלה
    const result = responses.map((r) => ({
      question: questionMap[r.question_id],
      answer: r.answer_text,
    }));

    res.json({ responder: name, answers: result });
  } catch (err) {
    console.error('DB error:', err);
    res.status(500).json({ error: 'DB error', details: err.message });
  }
});



module.exports = router;
