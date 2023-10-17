import Joi from "joi";

export const addDocumentSchema = Joi.object({
  user_id: Joi.string().required(),
  label: Joi.string().required().allow(""),
  file_url: Joi.string().required(),
  file_type: Joi.string().required(),
  saved_filename: Joi.string().required(),
  original_filename: Joi.string().required(),
  custom_filename: Joi.string().required().allow(""),
  metadata: Joi.object().optional(),
});

export const questionSchema = Joi.object({
  question: Joi.string().required(),
  documentIds: Joi.array().optional(),
});

export const idSchema = Joi.object({
  id: Joi.string().required(),
});

export const createIndexSchema = Joi.object({
  index_name: Joi.string().required(),
  vector_dimension: Joi.number().required(),
});

export const createEmbeddingsSchema = Joi.object({
  user_id: Joi.string().required(),
  document_url: Joi.string().required(),
  document_id: Joi.string().required(),
  file_type: Joi.string().required(),
});

export const emailSchema = Joi.object({
  email: Joi.string().required(),
});

export const emailAddressSchema = Joi.object({
  email_address: Joi.string().required(),
});

export const updateUserSchema = Joi.object({
  email_address: Joi.string().required(),
  first_name: Joi.string().optional(),
  last_name: Joi.string().optional(),
  phone_number: Joi.string().optional(),
  address_line1: Joi.string().optional(),
  address_line2: Joi.string().optional(),
  address_line3: Joi.string().optional(),
  address_line4: Joi.string().optional(),
  role: Joi.string().optional(),
  company: Joi.string().optional(),
  metadata: Joi.object().optional(),
});
