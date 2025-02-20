const express = require('express');
const bodyParser = require('body-parser');
const pool = require('./db');
const bcrypt = require('bcrypt');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(cors());

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
  const { name, price, description, image, filter_makan } = req.body;

  // Konversi price ke number
  const numericPrice = parseFloat(price.replace(/,/g, ''));

  try {
    const newMenu = await pool.query(
      'INSERT INTO menu (name, price, description, image, filter_makan) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, numericPrice, description, image, filter_makan]
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
  const { name, price, description, image } = req.body;

  // Konversi price ke integer
  const integerPrice = parseInt(price, 10);

  // Tambahkan logging untuk memeriksa data yang diterima
  console.log('Request Body:', req.body);

  try {
    const updateValues = [name, integerPrice, description];
    if (image) {
      updateValues.push(image);
    }
    updateValues.push(id);

    const query = `
      UPDATE menu 
      SET name = $1, price = $2, description = $3
      ${image ? ', image = $4' : ''} 
      WHERE menu_id = $${image ? 5 : 4} RETURNING *;
    `;

    const updateMenu = await pool.query(query, updateValues);
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

app.post('/data_sellers', async (req, res) => {
  const { seller_name, contact_info, address, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newSeller = await pool.query(
      'INSERT INTO data_sellers (seller_name, contact_info, address, password) VALUES ($1, $2, $3, $4) RETURNING *',
      [seller_name, contact_info, address, hashedPassword]
    );
    res.json(newSeller.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

app.get('/data_sellers', async (req, res) => {
  try {
    const alldata_sellers = await pool.query('SELECT * FROM data_sellers');
    res.json(alldata_sellers.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

app.put('/data_sellers/:id', async (req, res) => {
  const { id } = req.params;
  const { seller_name, contact_info, address, password } = req.body;
  try {
    let updateValues = [seller_name, contact_info, address, id];
    let updateSeller;
    
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateValues = [seller_name, contact_info, address, hashedPassword, id];
      updateSeller = await pool.query(
        'UPDATE data_sellers SET seller_name = $1, contact_info = $2, address = $3, password = $4 WHERE seller_id = $5 RETURNING *',
        updateValues
      );
    } else {
      updateSeller = await pool.query(
        'UPDATE data_sellers SET seller_name = $1, contact_info = $2, address = $3 WHERE seller_id = $4 RETURNING *',
        updateValues
      );
    }
    res.json(updateSeller.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

app.delete('/data_sellers/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM data_sellers WHERE seller_id = $1', [id]);
    res.json({ message: 'Seller deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

app.get('/data_sellers/:seller_id', async (req, res) => {
  const { seller_id } = req.params;
  try {
    const seller = await pool.query('SELECT * FROM data_sellers WHERE seller_id = $1', [seller_id]);
    if (seller.rows.length === 0) {
      return res.status(404).json({ message: 'Seller not found' });
    }
    res.json(seller.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

app.get('/menu/:seller_id', async (req, res) => {
  const { seller_id } = req.params;
  try {
    const menuBySeller = await pool.query('SELECT * FROM menu WHERE seller_id = $1', [seller_id]);
    res.json(menuBySeller.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
}); 

app.get('/menu/filter/:filter_makan', async (req, res) => {
  const { filter_makan } = req.params;
  try {
    const filteredMenu = await pool.query('SELECT * FROM menu WHERE filter_makan = $1', [filter_makan]);
    res.json(filteredMenu.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});