CREATE TABLE file_details
(
    id character varying(255) PRIMARY KEY,
    first_name character varying(255),
    last_name character varying(255),
    email character varying(255),
    user_file_name character varying(255),
    unique_file_name character varying(255),
    file_url character varying(255),
    file_description character varying(255),
    file_uploaded_at timestamp with time zone NOT NULL,
    file_updated_at timestamp with time zone NOT NULL
);
