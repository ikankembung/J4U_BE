const express = require('express');
const bodyParser = require('body-parser');
const pool = require('./db');
const bcrypt = require('bcrypt');
const vercel = require('vercel');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

const validateUserInput = (data) => {
  const { nis, password, email, phone_number, kelas } = data;
  if (!nis || !password || !email || !phone_number || !kelas) {
    throw new Error("All fields are required");
  }
};

app.post('/users', async (req, res) => {
  const { nis, password, email, phone_number, kelas } = req.body;
  try {
    validateUserInput(req.body);
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await pool.query(
      'INSERT INTO users (nis, password, email, phone_number, kelas) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [nis, hashedPassword, email, phone_number, kelas]
    );
    res.status(201).json(newUser.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(400).send(err.message);
  }
});

app.get('/users', async (req, res) => {
  try {
    const allUsers = await pool.query('SELECT * FROM users');
    res.json(allUsers.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

app.get('/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const user = await pool.query('SELECT * FROM users WHERE user_id = $1', [id]);
    if (user.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

app.put('/users/:id', async (req, res) => {
  const { id } = req.params;
  const { nis, password, email, phone_number, kelas } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const updateUser = await pool.query(
      'UPDATE users SET nis = $1, password = $2, email = $3, phone_number = $4, kelas = $5 WHERE user_id = $6 RETURNING *',
      [nis, hashedPassword, email, phone_number, kelas, id]
    );
    if (updateUser.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(updateUser.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

app.delete('/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const deleteUser = await pool.query('DELETE FROM users WHERE user_id = $1 RETURNING *', [id]);
    if (deleteUser.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

app.post('/menu', async (req, res) => {
  const { name, price, description } = req.body;
  try {
    const newMenu = await pool.query(
      'INSERT INTO menu (name, price, description) VALUES ($1, $2, $3) RETURNING *',
      [name, price, description]
    );
    res.json(newMenu.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

app.get('/menu', async (req, res) => {
  try {
    const allMenu = await pool.query('SELECT * FROM menu');
    res.json(allMenu.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

app.put('/menu/:id', async (req, res) => {
  const { id } = req.params;
  const { name, price, description } = req.body;
  try {
    const updateMenu = await pool.query(
      'UPDATE menu SET name = $1, price = $2, description = $3 WHERE menu_id = $4 RETURNING *',
      [name, price, description, id]
    );
    res.json(updateMenu.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

app.delete('/menu/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM menu WHERE menu_id = $1', [id]);
    res.json({ message: 'Menu deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

app.post('/couriers', async (req, res) => {
  const { name, phone_number } = req.body;
  try {
    const newCourier = await pool.query(
      'INSERT INTO couriers (name, phone_number) VALUES ($1, $2) RETURNING *',
      [name, phone_number]
    );
    res.json(newCourier.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

app.post('/order_items', async (req, res) => {
  const { order_id, menu_id, quantity } = req.body;
  try {
    const newOrderItem = await pool.query(
      'INSERT INTO order_items (order_id, menu_id, quantity) VALUES ($1, $2, $3) RETURNING *',
      [order_id, menu_id, quantity]
    );
    res.json(newOrderItem.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

app.post('/sellers', async (req, res) => {
  const { name, email, phone_number } = req.body;
  try {
    const newSeller = await pool.query(
      'INSERT INTO sellers (name, email, phone_number) VALUES ($1, $2, $3) RETURNING *',
      [name, email, phone_number]
    );
    res.json(newSeller.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

app.get('/sellers', async (req, res) => {
  try {
    const allSellers = await pool.query('SELECT * FROM sellers');
    res.json(allSellers.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

app.put('/sellers/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, phone_number } = req.body;
  try {
    const updateSeller = await pool.query(
      'UPDATE sellers SET name = $1, email = $2, phone_number = $3 WHERE seller_id = $4 RETURNING *',
      [name, email, phone_number, id]
    );
    res.json(updateSeller.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

app.delete('/sellers/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM sellers WHERE seller_id = $1', [id]);
    res.json({ message: 'Seller deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
  vercel();
});