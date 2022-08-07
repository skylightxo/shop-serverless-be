const { buildResponse, getSignedUrl } = require("./methods");

module.exports.importProductsFile = async (event) => {
  const name = event.queryStringParameters.name;
  console.log(JSON.stringify(event)); 

  try {
    const url = await getSignedUrl(name);
    console.log(url);

    return {
      statusCode: 200,
      body: JSON.stringify({
        body: url,
      }),
      headers: {
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
      },
    };
  } catch (e) {
    console.error(e);
    return buildResponse(null, "File failed to upload", 500, e);
  }
};
