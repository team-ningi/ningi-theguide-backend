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
original_filename: { type: String, index: true },
saved_filename: { type: String, index: true },
custom_filename: { type: String, index: true },
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


/* DOCUMENTS ***
--GET
- GET AN UPLOADED DOCUMENT

- WHEN LISTING OUT A SPECIFIC TYPE OF CONTENT

--POST
- WHEN CREATING CONTENT

-PUT
- WHEN EDITING EXISTING CONTENT


/* AUDIT ***
--GET
- TO VIEW HISTORICAL QUESTION / ANSWERS

--POST
- WHEN THE CHATBOT RESPONDS , WE WRITE IT HERE FOR HISTORY