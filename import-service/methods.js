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
  console.log(promises);

  return await Promise.all(promises);
}

async function getSignedUrl(name) {
  const params = {
    Bucket: BUCKET_NAME,
    Key: `uploaded/${name}`,
    Expires: Number(EXPIRES_IN),
  };
  const url = await s3.getSignedUrlPromise("getObject", params);

  return url;
}

function buildResponse(body, message, code = 200, error = null) {
  return {
    isBase64Encoded: false,
    statusCode: code,
    message,
    body: JSON.stringify(body),
    error,
    headers: {
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
    },
  };
}

module.exports = {
  bulkUpload,
  buildResponse,
  getSignedUrl,
};
