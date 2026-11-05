// server.js -- CampusEats Catalogue REST API (Node + Express)
const express = require('express');
const app = express();

app.use(express.json());           // read JSON request bodies (Part 4)
app.use(express.static('public')); // serve the web page (Part 5)

// the menu -- in memory for now (a real database in Lecture 10)
let items = [
  { id: 1, name: 'Veg Thali',   price: 90, veg: true },
  { id: 2, name: 'Paneer Roll', price: 70, veg: true },
];
let nextId = 3;

// GET /items -- list the whole menu
// Extension: GET /items?veg=true (or veg=false) filters using req.query
app.get('/items', (req, res) => {
  const { veg } = req.query;
  if (veg === 'true')  return res.json(items.filter(i => i.veg));
  if (veg === 'false') return res.json(items.filter(i => !i.veg));
  res.json(items);
});

// GET /items/:id -- one dish, or 404
app.get('/items/:id', (req, res) => {
  const item = items.find(i => i.id === Number(req.params.id));
  if (!item) return res.status(404).json({ error: 'not found' });
  res.json(item);
});

// POST /items -- add a dish
app.post('/items', (req, res) => {
  const { name, price, veg } = req.body;               // what the client sent
  if (!name) return res.status(422).json({ error: 'name required' });
  const item = {
    id: nextId++,
    name,
    price: Number(price) || 0,
    veg: !(veg === false || veg === 'false'),          // defaults to veg if not sent
  };
  items.push(item);
  res.status(201).json(item);                          // 201 Created + the new dish
});

// Extension: DELETE /items/:id -- find it, remove it, reply 204 (or 404)
app.delete('/items/:id', (req, res) => {
  const index = items.findIndex(i => i.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'not found' });
  items.splice(index, 1);
  res.status(204).end();                               // 204 No Content
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Catalogue on http://localhost:${PORT}`));
