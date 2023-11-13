/*
****************************************
     DATABASE
****************************************

****************************************
*     USERS
* when a user does a successful ENGAGE AUTH they will get added to this table
* by default it will only contain the email address
****************************************
_id
email: { type: mongoose.SchemaTypes.Email, index: true },
first_name: { type: String },
last_name: { type: String },
address_line1: { type: String },
address_line2: { type: String },
address_line3: { type: String },
address_line4: { type: String },
phone_number: { type: String },
company: { type: String, index: true },
role: { type: String, default: "readOnly" },
metadata: { type: mongoose.SchemaTypes.Mixed },
created_at: { type: Date },
updated_at: { type: Date },


****************************************
*    DOCUMENTS -
* This is a collection for all of the uploaded documents
****************************************
_id
user_id: { type: String, index: true },
label: { type: String },
file_url: { type: String },
file_type: { type: String, index: true },
original_filename: { type: String, index: true },
saved_filename: { type: String, index: true },
custom_filename: { type: String, index: true },
embedding_created: { type: Boolean, default: false },
metadata: { type: mongoose.SchemaTypes.Mixed },
created_at: { type: Date },
updated_at: { type: Date },


****************************************
*    TEMPLATES -
* This is a collection for all of the uploaded documents
****************************************
_id
user_id: { type: String, index: true },
label: { type: String },
file_url: { type: String },
file_type: { type: String, index: true },
original_filename: { type: String, index: true },
tags: { type: Array },
saved_filename: { type: String, index: true },
custom_filename: { type: String, index: true },
metadata: { type: mongoose.SchemaTypes.Mixed },
created_at: { type: Date },
updated_at: { type: Date },


****************************************
*    REPORTS -
* This is a collection for all of the generated reports
* inside the metadata will be tags_prompt object and also tag_results object
****************************************
_id
user_id: { type: String, index: true },
report_name: { type: String, index: true },
report_type: { type: String, index: true },
base_template_url: { type: String },
generated_report_url: { type: String },
document_ids: { type: Array },
metadata: { type: mongoose.SchemaTypes.Mixed },
created_at: { type: Date },
updated_at: { type: Date },


****************************************
*    AUDIT -
* This is a collection for all the question/answrs from the llm
* document_ids is a comma separated string of the documents used 
****************************************
_id
user_id: { type: String, index: true },
document_ids: { type: String },
question: { type: String },
answer: { type: String },
report_hidden: { type: Boolean,default: false },
metadata: { type: mongoose.SchemaTypes.Mixed },
created_at: { type: Date },
updated_at: { type: Date },


**************************************************
     WHEN ARE DATABASES INTERACTED WITH
**************************************************
/* USERS ***
--GET
- on successful Engage Auth to login

--POST
- if GET request fails , make POST request and create user in the db

--PUT
- when user changes profile details

/* TEMPLATES ***
--GET
- GET AN UPLOADED TEMPLATE

--POST
- WHEN CREATING TEMPLATE

-PUT
- WHEN EDITING TAGS FOR  TEMPLATE 


/* DOCUMENTS ***
--GET
- GET AN UPLOADED DOCUMENT

- WHEN LISTING OUT A SPECIFIC TYPE OF CONTENT

--POST
- WHEN CREATING CONTENT

-PUT
- WHEN EDITING EXISTING CONTENT

/* REPORTS ***
--GET
- GET A GENERATED REPORT

--POST
- WHEN GENERATING A REPORT

-PUT
- WHEN RE GENERATING A REPORT

-DELETE
- WHEN RE REMOVING A REPORT (set flag to hide)


/* AUDIT ***
--GET
- TO VIEW HISTORICAL QUESTION / ANSWERS

--POST
- WHEN THE CHATBOT RESPONDS , WE WRITE IT HERE FOR HISTORY