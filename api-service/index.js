import express from 'express'
import multer from 'multer'
import morgan from 'morgan'
import { lookup } from 'mime-types'
import cors from 'cors'

import { scanTable, getItem, putItem, deleteItem } from './dynamodb.js'
import { getObject, uploadObject, deleteObject } from './s3.js'

const app = express()
app.use(cors())
app.use(express.json())
app.use(morgan('tiny'))

// Limit Uploads to 6 files, max size 1MB each per todo
const upload = multer({
  limits: {
    fileSize: '1MB',
    files: 6
  }
})
const uploader = upload.array('image', 6)

app.get('/favicon.ico', (req, res) => {
  res.status(204).end()
})

// get image
//
// Param `imageId` corresponds to the key of an image file in S3
app.get('/api/images/:imageId', async (req, res) => {
  const params = req.params
  const imageId = params.imageId
  const stream = await getObject(imageId)
  const contentType = stream.headers['content-type'] || lookup(imageId)
  res.setHeader('Content-Type', contentType)
  stream.pipe(res)
})

// get all todos
app.get('/api/todos', async (req, res) => {
  const items = await scanTable()
  res.json(items)
})

// create new todo
//
// Payload (req.body):
//   description / type: String / required
//
// Files (req.files):
//   images / type: File/Buffer / optional
app.post('/api/todos', uploader, async (req, res) => {
  const files = req?.files || []
  // Uploads images to S3, returns array of S3 keys for uploaded files
  const images = await Promise.all(
    files.map(file => uploadObject(file))
  )
  const body = req.body
  const description = body.description
  const newTodo = {
    description,
    created: Date.now(),
    completed: false
  }
  // If images were included with todo includes array of S3 keys for images with todo
  if (images.length) newTodo.images = images
  const item = await putItem(newTodo)
  res.json(item)
})

// get todo
//
// Param `todoId` corresponds to the id of a todo stored in DynamoDB
app.get('/api/todos/:todoId', async (req, res) => {
  const params = req.params
  const todoId = params.todoId
  const item = await getItem(todoId)
  res.json(item)
})

// update todo
//
// Param `todoId` corresponds to the id of a todo stored in DynamoDB
//
// Payload (req.body):
//   description / type: String / optional
//   completed / type: Boolean / optional
app.put('/api/todos/:todoId', async (req, res) => {
  const params = req.params
  const todoId = params.todoId
  const existingItem = await getItem(todoId)
  const body = req.body
  const newItem = { ...existingItem, ...body }
  const item = await putItem(newItem)
  res.json(item)
})

// delete todo
//
// Param `todoId` corresponds to the id of a todo stored in DynamoDB
app.delete('/api/todos/:todoId', async (req, res) => {
  const params = req.params
  const todoId = params.todoId
  // Gets todo to be deleted from DynamoDB
  const item = await getItem(todoId)
  const images = item.images || []
  // If todo has associated images in S3, then delete those images
  await Promise.all([
    deleteItem(todoId),
    ...images.map(imageId => deleteObject(imageId))
  ])
  // Returned delete todo's id to indicate it was successfully deleted
  res.json({ id: todoId })
})

const port = 3000
const server = app.listen(port, err =>
  console[err ? 'error' : 'log'](err || `Server running on ${port}`)
)

process.once('SIGTERM', () => {
  console.log('SIGTERM received')
  server.close(err => {
    console[err ? 'error' : 'log'](err || 'Server closed')
    process.exit(err ? 1 : 0)
  })
})
