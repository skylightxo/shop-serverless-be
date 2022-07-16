"use strict";

const products = require("./products.json").products;

module.exports.hello = async (event) => {
  const { productId } = event.queryStringParameters;
  const product = products.find((product) => product.id === productId);

  if (!product) {
    return {
      statusCode: 404,
      body: JSON.stringify({
        message: "Product not found",
      }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify(product, null, 2),
  };
};
