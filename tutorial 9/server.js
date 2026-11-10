// server.js -- the CampusEats Catalogue, now SECURED (Node + Express)
// Authentication (JWT) + Authorization (roles) on top of a plain REST service.

const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config(); // load JWT_SECRET / PORT from .env

const app = express();
app.use(express.json());

// The signing secret lives in the environment, never in the code.
// A fallback is provided so the project runs out-of-the-box for the demo.
const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

// Seed users -- passwords are hashed once at startup (never stored in plain text).
const users = [
  { id: 1, email: 'asha@campus.edu',    role: 'customer',   hash: bcrypt.hashSync('customer123', 10) },
  { id: 2, email: 'mealhub@campus.edu', role: 'restaurant', hash: bcrypt.hashSync('resto123', 10)    },
  { id: 3, email: 'admin@campus.edu',   role: 'admin',      hash: bcrypt.hashSync('admin123', 10)   },
];

let items = [
  { id: 1, name: 'Veg Thali',   price: 90 },
  { id: 2, name: 'Paneer Roll', price: 70 },
];
let nextId = 3;

// Orders belong to the customer (userId) who placed them -- used for the object-level check.
let orders = [
  { id: 1, userId: 1, itemId: 1, qty: 2 },   // asha's order
  { id: 2, userId: 99, itemId: 2, qty: 1 },  // someone else's order
];
let nextOrderId = 3;

// POST /login  -- verify the password, hand back a signed JWT.
app.post('/login', (req, res) => {
  const user = users.find(u => u.email === req.body.email);
  if (!user || !bcrypt.compareSync(req.body.password, user.hash))
    return res.status(401).json({ error: 'bad login' });
  const token = jwt.sign({ sub: user.id, role: user.role }, SECRET, { expiresIn: '1h' });
  res.json({ token });
});

// Authentication -- WHO are you? (verify the token, else 401)
function auth(req, res, next) {
  const token = (req.get('Authorization') || '').split(' ')[1];
  try { req.user = jwt.verify(token, SECRET); next(); }
  catch { res.status(401).json({ error: 'invalid or missing token' }); }
}

// Authorization -- are you ALLOWED? (check the role, else 403)
function requireRole(...allowed) {
  return (req, res, next) =>
    allowed.includes(req.user.role) ? next() : res.status(403).json({ error: 'forbidden' });
}

// GET /items  -- any authenticated user may read the menu.
app.get('/items', auth, (req, res) => res.json(items));

// POST /items -- only a restaurant (or admin) may add a dish.
app.post('/items', auth, requireRole('restaurant', 'admin'), (req, res) => {
  const { name, price } = req.body;
  if (!name) return res.status(422).json({ error: 'name required' });
  const item = { id: nextId++, name, price: Number(price) || 0 };
  items.push(item);
  res.status(201).json(item);
});

// DELETE /items/:id -- restaurant or admin may remove a dish.
app.delete('/items/:id', auth, requireRole('restaurant', 'admin'), (req, res) => {
  const i = items.findIndex(x => x.id === Number(req.params.id));
  if (i === -1) return res.status(404).json({ error: 'not found' });
  items.splice(i, 1);
  res.status(204).end();
});

// ---- Object-level authorization (IDOR protection) ----
// Admin may see everything; anyone else only their OWN orders.
const canAccess = (user, order) => user.role === 'admin' || order.userId === user.sub;

// POST /orders -- a customer (or admin) places an order; it is owned by the caller.
app.post('/orders', auth, requireRole('customer', 'admin'), (req, res) => {
  const { itemId, qty } = req.body;
  if (!items.some(i => i.id === Number(itemId))) return res.status(422).json({ error: 'valid itemId required' });
  const order = { id: nextOrderId++, userId: req.user.sub, itemId: Number(itemId), qty: Number(qty) || 1 };
  orders.push(order);
  res.status(201).json(order);
});

// GET /orders -- admin sees all orders, others see only their own.
app.get('/orders', auth, (req, res) => res.json(orders.filter(o => canAccess(req.user, o))));

// GET /orders/:id -- the specific resource check: is THIS order yours?
app.get('/orders/:id', auth, (req, res) => {
  const order = orders.find(o => o.id === Number(req.params.id));
  if (!order) return res.status(404).json({ error: 'not found' });
  if (!canAccess(req.user, order)) return res.status(403).json({ error: 'forbidden' });
  res.json(order);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Secured Catalogue on http://localhost:${PORT}`));
