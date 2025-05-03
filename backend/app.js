const express = require('express');
const cors = require('cors');
require('dotenv').config();

const formRoutes = require('./routes/forms');
const questionRoutes = require('./routes/questions');
const optionRoutes = require('./routes/options');
const responsesRoutes = require('./routes/responses');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/forms', formRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/options', optionRoutes);
app.use('/api/responses', responsesRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
