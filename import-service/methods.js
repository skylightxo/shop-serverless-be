const AWS = require("aws-sdk");
const s3 = new AWS.S3();

function extractName(key) {
  return key.split("/")[1].split(".")[0];
}

const BUCKET_NAME = process.env.FILE_UPLOAD_BUCKET_NAME;
const EXPIRES_IN = process.env.EXPIRES_IN;

async function bulkUpload(files, name) {
  const promises = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const params = {
      Bucket: BUCKET_NAME,
      Key: `upload/${i > 0 ? name + i : name}.csv`,
      Body: file.data,
      ContentType: "text/csv",
    };
    promises.push(s3.upload(params).promise());
  }

  return await Promise.all(promises);
}

async function bulkUrls(files) {
  const urls = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const params = {
      Bucket: BUCKET_NAME,
      Key: `parsed/${extractName(file.key)}.json`,
      Expires: Number(EXPIRES_IN),
    };
    urls.push(await s3.getSignedUrlPromise("getObject", params));
  }

  return urls;
}

function buildResponse(body, message, code = 200, error = null) {
  return {
    isBase64Encoded: false,
    statusCode: code,
    message,
    body: JSON.stringify(body),
    error,
  };
}

module.exports = {
  bulkUpload,
  bulkUrls,
  buildResponse,
};
