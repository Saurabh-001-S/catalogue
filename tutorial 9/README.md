# CampusEats - Secured Catalogue

The CampusEats Catalogue service from Assignment 8, now with a **lock on it**:
a login that issues a **JWT**, a middleware that **authenticates** every request,
and a **role rule** that controls who may change data.

Companion to **CS543 Lecture 11 - Securing the API** and its hands-on tutorial.

## Run it

```bash
npm install
cp .env.example .env     # then put a long random value in JWT_SECRET
npm start                # -> Secured Catalogue on http://localhost:3000
```

It runs without a `.env` too (it falls back to a dev secret), but set one
before you demo or deploy.

## Seed users

| email               | password      | role         |
|---------------------|---------------|--------------|
| asha@campus.edu     | customer123   | `customer`   |
| mealhub@campus.edu  | resto123      | `restaurant` |

Passwords are **bcrypt-hashed at startup** - the plain text is never stored.

| email               | password      | role         |
|---------------------|---------------|--------------|
| admin@campus.edu    | admin123      | `admin`      |

## The two guards

- **auth** - reads `Authorization: Bearer <token>`, verifies it with
  `jwt.verify`. Missing / invalid / expired -> **401**.
- **requireRole(...)** - checks `req.user.role` set by `auth`. Wrong role -> **403**.

```
app.post('/items', auth, requireRole('restaurant','admin'), handler);
//                   ^who are you?   ^are you allowed?
```

## Routes

| Method | Path       | Guard                                   | Success |
|--------|------------|-----------------------------------------|---------|
| POST   | `/login`   | none (public)                           | 200 + token |
| GET    | `/items`   | `auth`                                  | 200 |
| POST   | `/items`   | `auth` + `requireRole('restaurant','admin')` | 201 |

## Try the five cases (curl)

```bash
# 1) No token -> 401
curl -i localhost:3000/items

# 2) Login -> token
TOKEN=$(curl -s localhost:3000/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"mealhub@campus.edu","password":"resto123"}' | sed 's/.*"token":"//;s/".*//')

# 3) With token -> 200 (read the menu)
curl -i localhost:3000/items -H "Authorization: Bearer $TOKEN"

# 4) restaurant role adds a dish -> 201
curl -i localhost:3000/items -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"name":"Masala Dosa","price":80}'

# 5) customer on the write route -> 403
CUST=$(curl -s localhost:3000/login -H 'Content-Type: application/json' \
  -d '{"email":"asha@campus.edu","password":"customer123"}' | sed 's/.*"token":"//;s/".*//')
curl -i localhost:3000/items -H "Authorization: Bearer $CUST" \
  -H 'Content-Type: application/json' -d '{"name":"Hack","price":0}'
```

## Extras (from "Where to go next")

| Method | Path           | Guard | Rule |
|--------|----------------|-------|------|
| DELETE | `/items/:id`   | `auth` + restaurant/admin | 204 |
| POST   | `/orders`      | `auth` + customer/admin | 201, owned by caller |
| GET    | `/orders`      | `auth` | admin: all; others: only their own |
| GET    | `/orders/:id`  | `auth` + ownership check | someone else's order -> 403 (IDOR protection) |

The secret is read from `.env` via `dotenv` (`.env` is git-ignored).

---
Dr. Pramit Mazumdar - pramit.mazumdar@iiitvadodara.ac.in
