import express from 'express'
import pg from 'pg'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const { Pool } = pg
const app = express()
const PORT = process.env.PORT || 8000
const isProd = process.env.NODE_ENV === 'production'

const __dirname = dirname(fileURLToPath(import.meta.url))

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    'postgresql://app:7977e176f93735151e2566f75938377e4329fd5f53c705f6698d258649a5948e@svc-prod-postgresql-jstr-postgres:5432/app?sslmode=disable',
  ssl: false,
})

await pool.query(`
  CREATE TABLE IF NOT EXISTS todos (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`)

app.use(express.json())

app.get('/api/todos', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM todos ORDER BY created_at DESC')
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Database error' })
  }
})

app.post('/api/todos', async (req, res) => {
  try {
    const { title } = req.body
    if (!title?.trim()) return res.status(400).json({ error: 'Title required' })
    const { rows } = await pool.query(
      'INSERT INTO todos (title) VALUES ($1) RETURNING *',
      [title.trim()]
    )
    res.status(201).json(rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Database error' })
  }
})

app.patch('/api/todos/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'UPDATE todos SET completed = NOT completed WHERE id = $1 RETURNING *',
      [req.params.id]
    )
    if (!rows.length) return res.status(404).json({ error: 'Not found' })
    res.json(rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Database error' })
  }
})

app.delete('/api/todos/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM todos WHERE id = $1', [req.params.id])
    res.status(204).send()
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Database error' })
  }
})

if (isProd) {
  app.use(express.static(join(__dirname, 'dist')))
  app.get('/{*path}', (req, res) => {
    res.sendFile(join(__dirname, 'dist', 'index.html'))
  })
}

app.listen(PORT, () => console.log(`Server on port ${PORT}`))
