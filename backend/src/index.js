const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/api/items', async (req, res) => {
  try {
    const { search, category, minPrice, maxPrice } = req.query;
    const conditions = [];
    const values = [];

    if (search) {
      values.push(`%${search}%`);
      conditions.push(`(name ILIKE $${values.length} OR description ILIKE $${values.length})`);
    }

    if (category) {
      values.push(category);
      conditions.push(`category = $${values.length}`);
    }

    if (minPrice) {
      values.push(parseFloat(minPrice));
      conditions.push(`price >= $${values.length}`);
    }

    if (maxPrice) {
      values.push(parseFloat(maxPrice));
      conditions.push(`price <= $${values.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const query = `SELECT id, name, category, price, quantity, description FROM items ${where} ORDER BY id ASC`;
    const result = await db.query(query, values);
    res.json(result.rows);
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Unable to fetch items' });
  }
});

app.get('/api/drawings', async (req, res) => {
  try {
    const { date, minDate, maxDate, ball, powerball, powerPlay } = req.query;
    const conditions = [];
    const values = [];

    if (date) {
      values.push(date);
      conditions.push(`draw_date = $${values.length}`);
    }
    if (minDate) {
      values.push(minDate);
      conditions.push(`draw_date >= $${values.length}`);
    }
    if (maxDate) {
      values.push(maxDate);
      conditions.push(`draw_date <= $${values.length}`);
    }
    if (ball) {
      values.push(parseInt(ball, 10));
      const idx = values.length;
      conditions.push(`(
        white_ball_1 = $${idx} OR
        white_ball_2 = $${idx} OR
        white_ball_3 = $${idx} OR
        white_ball_4 = $${idx} OR
        white_ball_5 = $${idx}
      )`);
    }
    if (powerball) {
      values.push(parseInt(powerball, 10));
      conditions.push(`powerball = $${values.length}`);
    }
    if (powerPlay) {
      values.push(powerPlay);
      conditions.push(`power_play ILIKE $${values.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const query = `SELECT draw_date, white_ball_1, white_ball_2, white_ball_3, white_ball_4, white_ball_5, powerball, power_play FROM powerball_drawings ${where} ORDER BY draw_date DESC`;
    const result = await db.query(query, values);
    res.json(result.rows);
  } catch (error) {
    console.error('Drawings API error:', error);
    res.status(500).json({ error: 'Unable to fetch drawings' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});
