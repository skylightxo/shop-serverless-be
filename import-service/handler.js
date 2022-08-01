const { parse, getBoundary } = require("./multipart-parse");
const { bulkUpload, bulkUrls, buildResponse } = require("./methods");

module.exports.import = async (event) => {
  const {
    queryStringParameters: { name },
  } = event;
  const body = Buffer.from(event.body.toString(), "base64");
  const boundary = getBoundary(event.headers["content-type"]);
  const parsedFiles = parse(body, boundary);

  try {
    const files = await bulkUpload(parsedFiles, name);
    const urls = await bulkUrls(files);

    return buildResponse({ urls }, "Successfully uploaded file(s) to S3");
  } catch (e) {
    console.error(e);
    return buildResponse(null, "File failed to upload", 500, e);
  }
};
