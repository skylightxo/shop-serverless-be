const AWS = require("aws-sdk");
const s3 = new AWS.S3();
const csv = require('csv-parser')

const BUCKET_NAME = process.env.FILE_UPLOAD_BUCKET_NAME;

async function csvParse({ stream, key }) {
  const chunks = [];

  return new Promise((resolve, reject) => {
    stream
      .pipe(csv())
      .on('data', (data) => chunks.push(data))
      .on('end', () => resolve({ file: chunks, key }))
      .on('error', (err) => reject(err))
  })
}

async function getReadStreamsFromRecords(records) {
  return records.map(record => {
    const params = { Bucket: BUCKET_NAME, Key: record.s3.object.key }

    return {
      stream: s3.getObject(params).createReadStream(),
      key: record.s3.object.key.split('/')[1].split('.')[0]
    }
  })
}

async function bulkUpload(files) {
  const promises = files.map(({ file, key }) => {
    const params = {
      Bucket: BUCKET_NAME,
      Key: `parsed/${key}.json`,
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