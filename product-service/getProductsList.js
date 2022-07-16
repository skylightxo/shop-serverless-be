"use strict";

const products = require("./products.json").products;

module.exports.hello = async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify(products, null, 2),
  };
};
