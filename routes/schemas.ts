import Joi from "joi";

export const updateContentSchema = Joi.object({
  content_id: Joi.string().required(),
  title: Joi.string().required(),
  image_url: Joi.string().required(),
  content: Joi.string().required(),
});

export const createContentSchema = Joi.object({
  author: Joi.string().required(),
  user_id: Joi.string().required(),
  title: Joi.string().required(),
  image_url: Joi.string().required(),
  content: Joi.string().required(),
  type: Joi.string().required(),
  metadata: Joi.object().optional(),
});

export const idSchema = Joi.object({
  id: Joi.string().required(),
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
