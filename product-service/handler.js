"use strict";

const { Client } = require("pg");
const { newProductSchema } = require("./schemas/product.schema");
const AWS = require("aws-sdk");
const { createProducts, sendNewProductsNotification } = require("./methods.js");

const { PG_HOST, PG_PORT, PG_DATABASE, PG_USERNAME, PG_PASSWORD } = process.env;

const defaultDbOptions = {
  host: PG_HOST,
  port: PG_PORT,
  database: PG_DATABASE,
  user: PG_USERNAME,
  password: PG_PASSWORD,
};

const createClient = (dbOptions = {}) =>
  new Client({ ...defaultDbOptions, ...dbOptions });

const catalogBatchProcess = async (event) => {
  const products = event.Records.map(({ body }) => JSON.parse(body));
  try {
    await createProducts(products);
    await sendNewProductsNotification(products);
  } catch (error) {
    console.log(error);
  }
};

const getProductsById = async (event) => {
  const client = createClient();
  await client.connect();

  const { productId } = event.pathParameters;

  console.log(event, productId);

  try {
    const { rows: products } = await client.query(
      `
            SELECT p.id, p.title, p.description, p.price, s.count
            FROM products p
            JOIN stocks s on s.product_id = p.id
            WHERE p.id=$1
      `,
      [productId]
    );

    return {
      statusCode: 200,
      body: JSON.stringify(products[0], null, 2),
      headers: {
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
      },
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Internal server error",
      }),
    };
  } finally {
    await client.end();
  }
};

const getProductsList = async (event) => {
  const client = createClient();

  console.log(event);

  try {
    await client.connect();
    const { rows: products } = await client.query(
      `
            SELECT p.id, p.title, p.description, p.price, s.count
            FROM products p
            JOIN stocks s on s.product_id = p.id
        `
    );

    return {
      statusCode: 200,
      body: JSON.stringify(products, null, 2),
      headers: {
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
      },
    };
  } catch (error) {
    console.log(error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Internal server error",
      }),
    };
  } finally {
    await client.end();
  }
};

const createProduct = async (event) => {
  console.log(event);

  const reqBody = JSON.parse(event.body);
  const { error } = newProductSchema.validate(reqBody);

  if (error) {
    const validationErrorDetails = error.details
      .map((detail) => detail.message)
      .join(" ");

    return {
      statusCode: 400,
      body: JSON.stringify({
        message: `Validation error, ${validationErrorDetails}`,
      }),
    };
  }

  const client = createClient();
  await client.connect();

  const { title, description, price, count } = reqBody;

  try {
    client.query("BEGIN");

    const { rows } = await client.query(
      `
            INSERT INTO products (title, description, price)
            VALUES ($1, $2, $3)
            RETURNING id
    `,
      [title, description, price]
    );

    const newProductId = rows[0].id;

    await client.query(
      `
            INSERT INTO stocks (product_id, count) 
            VALUES ($1, $2)
    `,
      [newProductId, count]
    );

    await client.query("COMMIT");

    return {
      statusCode: 201,
      body: JSON.stringify({
        id: newProductId,
      }),
      headers: {
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
      },
    };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Internal server error",
      }),
    };
  } finally {
    await client.end();
  }
};

module.exports = {
  getProductsById,
  getProductsList,
  createProduct,
  catalogBatchProcess,
};
