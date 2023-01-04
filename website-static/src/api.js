export const fetchAllTodos = async () => {
  const res = await window.fetch('/api/todos')
  return await res.json()
}

export const fetchTodo = async id => {
  const res = await window.fetch(`/api/todos/${id}`)
  return await res.json()
}

export const createTodo = async (description, images) => {
  const formData = new FormData()
  formData.append('description', description)
  images.forEach(({ file }) => {
    formData.append('image', file)
  })
  const res = await window.fetch(
    '/api/todos/',
    { method: 'POST', body: formData }
  )
  return await res.json()
}

export const updateTodo = async item => {
  const res = await window.fetch(
    `/api/todos/${item.id}`,
    {
      method: 'PUT',
      body: JSON.stringify(item),
      headers: {
        'Content-Type': 'application/json'
      }
    }
  )
  return await res.json()
}

export const deleteTodo = async id => {
  const res = await window.fetch(
    `/api/todos/${id}`,
    { method: 'DELETE' }
  )
  return await res.json()
}
