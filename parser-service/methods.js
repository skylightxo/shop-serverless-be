const AWS = require("aws-sdk");
const s3 = new AWS.S3();
const csv = require('csv-parser')

const BUCKET_NAME = process.env.FILE_UPLOAD_BUCKET_NAME;

async function csvParse(stream) {
  const chunks = [];

  return new Promise((resolve, reject) => {
    stream
      .pipe(csv())
      .on('data', (data) => chunks.push(data))
      .on('end', () => resolve(chunks))
      .on('error', (err) => reject(err))
  })
}

async function getReadStreamsFromRecords(records) {
  return records.map(record => {
    const params = { Bucket: BUCKET_NAME, Key: record.s3.object.key }

    return s3.getObject(params).createReadStream()
  })
}

async function bulkUpload(files) {
  const promises = files.map(file => {
    const params = {
      Bucket: BUCKET_NAME,
      Key: `parsed/${new Date().toISOString()}.json`,
      Body: Buffer.from(JSON.stringify({ data: file })),
      ContentEncoding: 'base64',
      ContentType: 'application/json; charset=utf-8'
    };

    return s3.upload(params).promise()
  })

  return await Promise.all(promises)
}

async function bulkDelete(records) {
  const promises = records.map(record => {
    const params = {
      Bucket: BUCKET_NAME,
      Key: record.s3.object.key
    }

    return s3.deleteObject(params).promise()
  })

  return await Promise.all(promises)
}

module.exports = {
  csvParse,
  getReadStreamsFromRecords,
  bulkUpload,
  bulkDelete
}