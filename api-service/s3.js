import {
  S3Client,
  GetObjectCommand,
  DeleteObjectCommand
} from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { extension } from 'mime-types'
import { randomUUID } from 'crypto'

const S3Endpoint = process.env.S3_ENDPOINT
const S3Bucket = process.env.S3_BUCKET

const s3Client = new S3Client({
  endpoint: S3Endpoint
})

const sendCommand = async command => await s3Client.send(command)

// Get an S3 object matching the provided key, returns object as a buffer
export const getObject = async key => {
  const params = {
    Bucket: S3Bucket,
    Key: key
  }
  const command = new GetObjectCommand(params)
  const data = await sendCommand(command)
  return data.Body
}

// Uploads file to S3, generates string UUID as key for resulting object
export const uploadObject = async ({ stream, detectedMimeType, clientReportedMimeType }) => {
  const ext = extension(detectedMimeType || clientReportedMimeType)
  const id = randomUUID()
  const key = `${id}.${ext}`
  const params = {
    Bucket: S3Bucket,
    Key: key,
    Body: stream,
    ContentType: detectedMimeType || clientReportedMimeType
  }
  const upload = new Upload({
    client: s3Client,
    params
  })
  await upload.done()
  return key
}

// Deletes object matching the provided key
export const deleteObject = async key => {
  const params = {
    Bucket: S3Bucket,
    Key: key
  }
  const command = new DeleteObjectCommand(params)
  const data = await sendCommand(command)
  return data
}
