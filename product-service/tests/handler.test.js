const { getProductsList } = require("../handler");
const { getProductsById } = require("../handler");
const { products } = require("../products.json");

describe("getProductsList", () => {
  it("returns all products", async () => {
    const data = await getProductsList();
    expect(JSON.parse(data.body)).toEqual(products);
  });
});

describe("getProductsById", () => {
  it("returns required product", async () => {
    const data = await getProductsById({ pathParameters: { productId: "1" } });
    expect(JSON.parse(data.body)).toEqual(products[0]);
  });

  it("gets 404 error & error message, when product is not found", async () => {
    const nonExistingId = (products.length + 1).toString();
    const data = await getProductsById({
      pathParameters: { productId: nonExistingId },
    });
    const statusCode = data.statusCode;
    const body = JSON.parse(data.body);
    expect({ message: body.message, statusCode }).toEqual({
      message: "Product not found",
      statusCode: 404,
    });
  });
});
