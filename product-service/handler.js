"use strict";

const { Client } = require("pg");
const { newProductSchema } = require("./schemas/product.schema");

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

const getProductsById = async (event) => {
  const client = createClient();
  await client.connect();

  const { productId } = event.pathParameters;

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

const getProductsList = async (event) => {
  const client = createClient();
  await client.connect();

  try {
    const { rows: products } = await client.query(
      `
            SELECT p.id, p.title, p.description, p.price, s.count
            FROM products p
            JOIN stocks s on s.product_id = p.id
        `
    );

    return products;
  } catch (error) {
    console.log(error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: error.message,
      }),
    };
  } finally {
    await client.end();
  }
};

const createProduct = async (data) => {
  const { error } = newProductSchema.validate(data);

  if (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: `Validation error, ${error.details.message}`,
      }),
    };
  }

  const client = createClient();
  await client.connect();

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
            VALUE ($1, $2)
    `,
      [newProductId, count]
    );

    await client.query("COMMIT");

    return newProductId;
  } catch (error) {
    await client.query("ROLLBACK");

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
};
