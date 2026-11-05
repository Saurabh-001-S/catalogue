# CampusEats Catalogue — CS543 Tutorial 08 (Node & Express)

A small end-to-end web service: an HTML/CSS page that talks to a REST API (Node + Express) holding an in-memory menu of dishes.

## Run

```bash
npm install        # installs express
node server.js     # or: npm start
```

Open http://localhost:3000

## API

| Method | Path              | Description                          | Status codes      |
|--------|-------------------|--------------------------------------|-------------------|
| GET    | `/items`          | List the whole menu                  | 200               |
| GET    | `/items?veg=true` | Filter by veg / non-veg (`req.query`) | 200               |
| GET    | `/items/:id`      | One dish                             | 200, 404          |
| POST   | `/items`          | Add a dish (`{name, price, veg}`)    | 201, 422          |
| DELETE | `/items/:id`      | Remove a dish                        | 204, 404          |

The last two rows of extensions (`?veg=` filter and `DELETE`) implement the tutorial's "Where to go next" exercises.

## Test with curl

```bash
curl localhost:3000/items
curl localhost:3000/items/1
curl -i localhost:3000/items/99                       # 404 Not Found
curl -i -X POST localhost:3000/items \
  -H "Content-Type: application/json" \
  -d '{"name":"Masala Dosa","price":60}'              # 201 Created
curl "localhost:3000/items?veg=true"
curl -i -X DELETE localhost:3000/items/3              # 204 No Content
```

## Front-end

- Lists dishes fetched from `GET /items` on page load
- "Add a dish" form sends `POST /items`, then refreshes the list (shows the error if name is missing)
- All / Veg only / Non-veg filter buttons use `GET /items?veg=...`
- × button on each dish sends `DELETE /items/:id`

## Structure

```
catalogue/
  server.js          <- the Express REST API
  package.json
  public/
    index.html       <- the web page (fetch + form)
    style.css
```

Note: data is in memory, so it resets when the server restarts (a database comes in Lecture 10).
