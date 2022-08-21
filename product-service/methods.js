import { SNS } from "aws-sdk";

export const sendNewProductsNotification = async (newProducts) => {
  const sns = new SNS({ region: process.env.REGION });

  const expensiveNewProducts = [];
  const nonExpensiveNewProducts = [];

  newProducts.forEach((product) => {
    if (product.price >= 100) {
      expensiveNewProducts.push(product);
    } else {
      nonExpensiveNewProducts.push(product);
    }
  });

  const sendNotification = async (products, isExpensiveProducts) => {
    try {
      const result = await sns
        .publish({
          Subject: `New ${
            isExpensiveProducts ? "expensive" : ""
          } products are created!`,
          Message: JSON.stringify(products),
          TopicArn: process.env.SNS_ARN,
          MessageAttributes: {
            IsExpensive: {
              DataType: "String",
              StringValue: isExpensiveProducts.toString(),
            },
          },
        })
        .promise();

      console.log("Send notification for ", products, " with result ", result);
    } catch (error) {
      console.log("Send notification for ", products, "with error ", error);
    }
  };

  expensiveNewProducts.length > 0 &&
    (await sendNotification(expensiveNewProducts, true));
  nonExpensiveNewProducts.length > 0 &&
    (await sendNotification(nonExpensiveNewProducts, false));
};

export const createProducts = async (products) => {
  products.forEach((product) => {
    const { error } = newProductSchema.validate(product);
    if (error) {
      throw error;
    }
  });

  const client = createClient();
  await client.connect();

  try {
    client.query("BEGIN");

    const formattedProducts = products.map(({ title, description, price }) => [
      title,
      description,
      price,
    ]);

    const { rows } = await client.query(
      `insert into products (title, description, price) values %L returning id`,
      formattedProducts
    );
    const newProductIds = rows.map(({ id }) => id);

    const formattedCount = products.map(({ count }, index) => [
      newProductIds[index],
      count,
    ]);

    await client.query(
      `insert into stocks (product_id, count) values %L`,
      formattedCount
    );

    await client.query("COMMIT");

    return newProductIds;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
};

module.exports = {
  sendNewProductsNotification,
  createProducts,
};
