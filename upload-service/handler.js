const AWS = require("aws-sdk");
const { parse, getBoundary } = require("./multipart-parse");
const s3 = new AWS.S3();

const BUCKET_NAME = process.env.FILE_UPLOAD_BUCKET_NAME;

async function getSignedUrl(params) {
  return new Promise((resolve, reject) => {
    s3.getSignedUrl("putObject", params, (error, signedUrl) => {
      if (error) return reject(error);

      resolve(signedUrl);
    });
  });
}

async function bulkUpload(files, name) {
  const promises = [];
  const signedUrls = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const params = {
      Bucket: BUCKET_NAME,
      Key: `upload/${name + i > 0 ? i : ""}.csv`,
      Body: file.data,
      ContentType: "text/csv",
    };
    const signedUrl = await getSignedUrl(params);

    signedUrls.push(signedUrl);
    promises.push(s3.upload(params).promise());
  }

  await Promise.all(promises);
  return signedUrls;
}

module.exports.upload = async (event) => {
  const body = Buffer.from(event.body.toString(), "base64");
  const boundary = getBoundary(event.headers["content-type"]);
  const parsedFiles = parse(body, boundary);
  const {
    queryStringParameters: { name },
  } = event;

  const response = {
    isBase64Encoded: false,
    statusCode: 200,
  };

  try {
    const signedUrls = await bulkUpload(parsedFiles, name);

    response.body = JSON.stringify({
      message: "Successfully uploaded file(s) to S3",
      signedUrls,
    });
  } catch (e) {
    console.error(e);
    response.body = JSON.stringify({
      message: "File failed to upload",
      errorMessage: e,
    });
    response.statusCode = 500;
  }

  return response;
};
