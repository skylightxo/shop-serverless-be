const Joi = require("joi");

export const newProductSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().allow(null, "").optional(),
  price: Joi.number().integer().greater(0).allow(null).optional(),
  count: Joi.number().integer().min(0).allow(null).optional(),
});
