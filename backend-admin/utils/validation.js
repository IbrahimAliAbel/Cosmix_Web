const Joi = require('joi');
const { PRODUCT_CATEGORIES } = require('../config/constants'); // TAMBAHAN

const productSchema = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  description: Joi.string().min(10).max(500).required(),
  price: Joi.alternatives().try(
    Joi.number().positive(),
    Joi.string().pattern(/^\d+$/).custom((value) => parseInt(value))
  ).required(),
  category: Joi.string()
    .valid(...Object.values(PRODUCT_CATEGORIES)) // TAMBAHAN: Validate category
    .required(),
  image: Joi.any().optional(),
  imageUrl: Joi.string().uri().optional(),
  imageFileId: Joi.string().optional()
}).unknown(true);

const updateProductSchema = Joi.object({
  name: Joi.string().min(3).max(100).optional(),
  description: Joi.string().min(10).max(500).optional(),
  price: Joi.alternatives().try(
    Joi.number().positive(),
    Joi.string().pattern(/^\d+$/).custom((value) => parseInt(value))
  ).optional(),
  category: Joi.string()
    .valid(...Object.values(PRODUCT_CATEGORIES)) // TAMBAHAN: Validate category
    .optional(),
  image: Joi.any().optional(),
  imageUrl: Joi.string().uri().optional(),
  imageFileId: Joi.string().optional()
}).unknown(true);

module.exports = {
  productSchema,
  updateProductSchema
};

