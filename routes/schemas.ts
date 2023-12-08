import Joi from "joi";

export const uuidSchema = Joi.object({
  uuid: Joi.string().required(),
});

export const uuidAndEmailSchema = Joi.object({
  uuid: Joi.string().required(),
  email: Joi.string().required(),
});

export const searchDocsSchema = Joi.object({
  user_id: Joi.string().required(),
  skip: Joi.number().required(),
  limit: Joi.number().required(),
  embedded: Joi.any().required(),
  search: Joi.string().optional(),
  file_type: Joi.string().optional(),
});

export const searchTemplatesSchema = Joi.object({
  user_id: Joi.string().required(),
  skip: Joi.number().required(),
  limit: Joi.number().required(),
  search: Joi.string().optional(),
  file_type: Joi.string().optional(),
});

export const searchReportsSchema = Joi.object({
  user_id: Joi.string().required(),
  skip: Joi.number().required(),
  report_type: Joi.string().required(),
  limit: Joi.number().required(),
  search: Joi.string().optional(),
  file_type: Joi.string().optional(),
});

export const addHistorySchema = Joi.object({
  user_id: Joi.string().required(),
  history: Joi.array().required(),
  metadata: Joi.object().optional(),
});

export const addDocumentSchema = Joi.object({
  user_id: Joi.string().required(),
  label: Joi.string().required().allow(""),
  additional_context: Joi.string().optional().allow(""),
  type_of_embedding: Joi.string().required(), // image | document
  file_url: Joi.string().required(),
  file_type: Joi.string().required(),
  saved_filename: Joi.string().required(),
  original_filename: Joi.string().required(),
  custom_filename: Joi.string().required().allow(""),
  metadata: Joi.object().optional(),
  document_group_id: Joi.object().optional(),
});

export const addDocumentGroupSchema = Joi.object({
  user_id: Joi.string().required(),
  label: Joi.string().required().allow(""),
  document_ids: Joi.array().required(),
  metadata: Joi.object().optional(),
});

export const addTemplateSchema = Joi.object({
  user_id: Joi.string().required(),
  label: Joi.string().required().allow(""),
  file_url: Joi.string().required(),
  file_type: Joi.string().required(),
  saved_filename: Joi.string().required(),
  original_filename: Joi.string().required(),
  custom_filename: Joi.string().required().allow(""),
  metadata: Joi.object().optional(),
});

export const addTagsSchema = Joi.object({
  user_id: Joi.string().required(),
  label: Joi.string().required(),
  tags: Joi.array().optional(),
  metadata: Joi.object().optional(),
});

export const updateTagsSchema = Joi.object({
  id: Joi.string().required(),
  label: Joi.string().required(),
  tags: Joi.array().optional(),
  metadata: Joi.object().optional(),
});

export const addReportSchema = Joi.object({
  initial_prompt: Joi.string().required(),
  user_id: Joi.string().required(),
  report_name: Joi.string().required(),
  report_type: Joi.string().required(),
  file_type: Joi.string().required(),
  tags: Joi.array().required(),
  tag_chunks_to_process: Joi.array().required(),
  tag_chunks_processed: Joi.array().required(),
  tagResults: Joi.object().required(),
  base_template_url: Joi.string().required().allow(""),
  generated_report_url: Joi.string().required().allow(""),
  document_ids: Joi.array().required(),
  report_hidden: Joi.boolean().required(),
  generated_report: Joi.boolean().required(),
  metadata: Joi.object().optional(),
});

export const updateReportSchema = Joi.object({
  user_id: Joi.string().required(),
  report_id: Joi.string().required(),
  generated_report_url: Joi.string().required(),
  generated_report: Joi.boolean().required(),
});

export const updateReportTagsProcessedSchema = Joi.object({
  user_id: Joi.string().required(),
  report_id: Joi.string().required(),
  tag_chunks_to_process: Joi.array().required(),
  tag_chunks_processed: Joi.array().required(),
});

export const resetEmbedFlagSchema = Joi.object({
  embed_flag: Joi.boolean().required(),
  document_id: Joi.string().required(),
});

export const UpdateDocumentGroupSchema = Joi.object({
  document_id: Joi.string().required(),
  document_group_id: Joi.string().required(),
});

export const updateDocGroupSchema = Joi.object({
  document_group_id: Joi.string().required(),
  label: Joi.string().optional(),
  documentIds: Joi.array().optional(),
});

export const generateDocxSchema = Joi.object({
  tags: Joi.object().required(),
  reportId: Joi.string().required(),
  templateURL: Joi.string().required(),
  outputName: Joi.string().required(),
});

export const questionSchema = Joi.object({
  question: Joi.string().required(),
  documentIds: Joi.array().optional(),
});

export const getTagsSchema = Joi.object({
  additionalPrompt: Joi.string().required().allow(""),
  tags: Joi.array().required(),
  reportId: Joi.string().required(),
  documentIds: Joi.array().required(),
});

export const idSchema = Joi.object({
  id: Joi.string().required(),
});

export const userIdSchema = Joi.object({
  user_id: Joi.string().required(),
});

export const getDocsSchema = Joi.object({
  user_id: Joi.string().required(),
  embedded: Joi.any().required(),
});

export const getReportsSchema = Joi.object({
  user_id: Joi.string().required(),
});

export const createIndexSchema = Joi.object({
  index_name: Joi.string().required(),
  vector_dimension: Joi.number().required(),
});

export const createEmbeddingsSchema = Joi.object({
  additional_context: Joi.string().optional().allow(""),
  type_of_embedding: Joi.string().required(), // image | document
  user_id: Joi.string().required(),
  document_url: Joi.string().required(),
  document_id: Joi.string().required(),
  file_type: Joi.string().required(),
});

export const refineTextSchema = Joi.object({
  original_text: Joi.string().required(),
  document_id: Joi.string().required(),
});

export const embedRefinedTextSchema = Joi.object({
  user_id: Joi.string().required(),
  document_id: Joi.string().required(),
  textToEmbed: Joi.string().required(),
});

export const emailSchema = Joi.object({
  email: Joi.string().required(),
});

export const emailAddressSchema = Joi.object({
  email_address: Joi.string().required(),
});

export const updateUserSchema = Joi.object({
  uuid: Joi.string().required(),
  email: Joi.string().optional(),
  first_name: Joi.string().optional(),
  last_name: Joi.string().optional(),
  phone_number: Joi.string().optional(),
  address_line1: Joi.string().optional(),
  address_line2: Joi.string().optional(),
  address_line3: Joi.string().optional(),
  address_line4: Joi.string().optional(),
  role: Joi.string().optional(),
  superUser: Joi.boolean().optional(),
  metadata: Joi.object().optional(),
  company: Joi.string().optional(),
});

export const updateHistorySchema = Joi.object({
  user_id: Joi.string().required(),
  history: Joi.array().required(),
  metadata: Joi.object().optional(),
});

export const returnPresignedURLSchema = Joi.object({
  user_id: Joi.string().optional(),
  file: Joi.string().required(),
});
