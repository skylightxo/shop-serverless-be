"use strict";

const { products } = require("../products.json");

const getProductsById = async (event) => {
  const { productId } = event.pathParameters;
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

const getProductsList = async (event) => {
  if (!products) {
    return {
      statusCode: 404,
      body: JSON.stringify({
        message: "Products not found",
      }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify(products, null, 2),
  };
};

module.exports = {
  getProductsById,
  getProductsList,
};
