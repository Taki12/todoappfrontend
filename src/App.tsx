import { useState, useEffect, useCallback } from 'react'

interface Todo {
  id: number
  title: string
  completed: boolean
  created_at: string
}

function App() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  const fetchTodos = useCallback(async () => {
    try {
      const res = await fetch('/api/todos')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: Todo[] = await res.json()
      setTodos(data)
      setError(null)
    } catch (err) {
      setError('Failed to load todos. Is the server running?')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTodos()
  }, [fetchTodos])

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault()
    const title = newTitle.trim()
    if (!title) return

    setAdding(true)
    try {
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const todo: Todo = await res.json()
      setTodos(prev => [todo, ...prev])
      setNewTitle('')
    } catch (err) {
      setError('Failed to add todo.')
      console.error(err)
    } finally {
      setAdding(false)
    }
  }

  const toggleTodo = async (id: number) => {
    try {
      const res = await fetch(`/api/todos/${id}`, { method: 'PATCH' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const updated: Todo = await res.json()
      setTodos(prev => prev.map(t => (t.id === id ? updated : t)))
    } catch (err) {
      setError('Failed to update todo.')
      console.error(err)
    }
  }

  const deleteTodo = async (id: number) => {
    try {
      const res = await fetch(`/api/todos/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setTodos(prev => prev.filter(t => t.id !== id))
    } catch (err) {
      setError('Failed to delete todo.')
      console.error(err)
    }
  }

  const remaining = todos.filter(t => !t.completed).length

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <h1 className="title">Todo App</h1>
          {!loading && (
            <p className="subtitle">
              {remaining === 0
                ? todos.length > 0
                  ? 'All tasks completed!'
                  : 'No tasks yet'
                : `${remaining} of ${todos.length} task${todos.length !== 1 ? 's' : ''} remaining`}
            </p>
          )}
        </header>

        {error && (
          <div className="error-banner">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="error-close">×</button>
          </div>
        )}

        <form onSubmit={addTodo} className="add-form">
          <input
            type="text"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="What needs to be done?"
            className="add-input"
            disabled={adding}
          />
          <button type="submit" className="add-btn" disabled={adding || !newTitle.trim()}>
            {adding ? 'Adding…' : 'Add'}
          </button>
        </form>

        <div className="todo-list">
          {loading ? (
            <div className="loading">
              <div className="spinner" />
              <span>Loading todos…</span>
            </div>
          ) : todos.length === 0 ? (
            <div className="empty">
              <span className="empty-icon">✓</span>
              <p>Nothing to do! Add a task above.</p>
            </div>
          ) : (
            todos.map(todo => (
              <div key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
                <label className="todo-label">
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => toggleTodo(todo.id)}
                    className="todo-checkbox"
                  />
                  <span className="todo-title">{todo.title}</span>
                </label>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="delete-btn"
                  aria-label="Delete todo"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>

        {todos.length > 0 && todos.some(t => t.completed) && (
          <div className="footer">
            <button
              className="clear-btn"
              onClick={async () => {
                const completed = todos.filter(t => t.completed)
                await Promise.all(completed.map(t => deleteTodo(t.id)))
              }}
            >
              Clear completed ({todos.filter(t => t.completed).length})
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
