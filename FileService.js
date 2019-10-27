const Pool = require('pg').Pool;
const uuid = require('uuidv4').default;
const AWS = require('aws-sdk');
const appConfig = require('./config/config.json');
AWS.config.update({region: appConfig.region});
AWS.config.accessKeyId = appConfig.accessKeyId;
AWS.config.secretAccessKey = appConfig.secretAccessKey;

const s3 = new AWS.S3();

// const pool = new Pool({
//     user: 'rkmb',
//     host: '127.0.0.1',
//     database: 'boxitdb',
//     password: 'rkmb',
//     port: 5432,
// });

const pool = new Pool({
    user: 'postgres',
    host: 'boxitdbcluster.cluster-cqzofxi0wmq3.us-east-2.rds.amazonaws.com',
    database: 'boxitdb',
    password: 'postgres',
    port: 5432,
});

const createFileDetails = (request, response, token_info) => {
    console.log("Inside createFileDetails REQUEST BODY ", JSON.stringify(request.body));
    let id = uuid();
    let first_name = token_info.given_name;
    let last_name = token_info.family_name;
    let email = token_info.email;
    let user_file_name = request.body.user_file_name;
    let unique_file_name = request.body.unique_file_name;
    let file_url = "file_url";
    let file_description = request.body.file_description;

    var options = {
        timeZone: "America/Los_Angeles",
        year: 'numeric', month: 'numeric', day: 'numeric',
        hour: 'numeric', minute: 'numeric', second: 'numeric'
    };
    var formatter = new Intl.DateTimeFormat([], options);
    let file_uploaded_at = formatter.format(new Date());
    let file_updated_at = formatter.format(new Date());


    console.log("createFileDetails Inserting id %s , first_name %s, last_name %s, email %s, user_file_name %s, unique_file_name %s, file_url %s, file_description %s",
        id, first_name, last_name, email, user_file_name, unique_file_name, file_url, file_description);

    pool.query('INSERT INTO file_details (id, first_name, last_name, email, user_file_name, unique_file_name, file_url, file_description, file_uploaded_at, file_updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
        [id, first_name, last_name, email, user_file_name, unique_file_name, file_url, file_description, file_uploaded_at, file_updated_at],
        (error, results) => {
            if (error) {
                throw error
            }
            return response.status(201).send(results);
        })
};
const updateFileDetails = (request, response, token_info) => {
    console.log("Inside updateFileDetails REQUEST BODY ", JSON.stringify(request.body));
    let email = token_info.email;
    let user_file_name = request.body.user_file_name;
    let unique_file_name = request.body.unique_file_name;
    var options = {
        timeZone: "America/Los_Angeles",
        year: 'numeric', month: 'numeric', day: 'numeric',
        hour: 'numeric', minute: 'numeric', second: 'numeric'
    };
    var formatter = new Intl.DateTimeFormat([], options);
    let file_updated_at = formatter.format(new Date());

    console.log("updateFileDetails Updating  email %s, user_file_name %s, unique_file_name %s, file_updated_at %s",
        email, user_file_name, unique_file_name, file_updated_at);

    pool.query('UPDATE file_details SET file_updated_at = $1 WHERE email = $2 AND user_file_name = $3 AND unique_file_name =$4',
        [file_updated_at, email, user_file_name, unique_file_name],
        (error, results) => {
            if (error) {
                throw error
            }
            return response.status(200).send(results);
        })
};

const getFileDetails = (request, response, token_info) => {
    console.log("Inside getFileDetails ");
    let email = token_info.email;
    let isAdmin = 'false';
    if (token_info.hasOwnProperty('cognito:groups')) {
        console.log("Found cognito:groups key in token_info", token_info['cognito:groups']);
        if (token_info['cognito:groups'].includes('myadmingroup')) {
            console.log("Setting isAdmin to true for email ", email);
            isAdmin = 'true';
        }
    }

    console.log("getFileDetails  email ", email);
    if (isAdmin === 'true') {
        console.log("Fetching All since isAdmin is true for email ", email);
        pool.query('SELECT * FROM file_details',
            (error, results) => {
                if (error) {
                    console.log(error);
                    throw error;
                }
                response.setHeader("Access-Control-Allow-Origin", "*");
                response.setHeader("Content-Type", "application/json");
                return response.status(200).contentType("application/json").send(JSON.stringify(results.rows));
            })

    } else {
        console.log("Fetching only user specific since isAdmin is false for email ", email);
        pool.query('SELECT * FROM file_details where email = $1', [email],
            (error, results) => {
                if (error) {
                    console.log(error);
                    throw error;
                }
                response.setHeader("Access-Control-Allow-Origin", "*");
                response.setHeader("Content-Type", "application/json");
                return response.status(200).contentType("application/json").send(JSON.stringify(results.rows));
            })
    }

}

const getSignedUrl = (request, response, token_info) => {
    console.log("$$$$$$$$$$$$  EXECUTING getSignedUrl $$$$$$$$$$$$");
    // console.log("************* event ", JSON.stringify(event));
    const bucket = appConfig.bucket_name;
    const name = request.body.user_file_name;
    const email = token_info.email;
    let params = {};
    console.log('*********** getSignedUrl is_existing_file = ', request.body.is_existing_file);
    console.log('*********** getSignedUrl user_file_name or key = ', name);
    console.log('*********** getSignedUrl EMAIL FROM token_info = ', email);
    if (request.body.is_existing_file && request.body.is_existing_file === 'true') {
        // key: `${uuid()}#${name}`
        pool.query('SELECT unique_file_name FROM file_details where user_file_name = $1 and email = $2', [name, email])
            .then((results) => {
                console.log("getSignedUrl results of select ", results);
                console.log("getSignedUrl results.rows[0].unique_file_name ", results.rows[0].unique_file_name);
                params = {
                    Bucket: bucket,
                    Fields: {
                        key: results.rows[0].unique_file_name
                    }
                };
                return createSignedUrlHelper(params, response);
            })
            .catch((err) => {
                console.log("getSignedUrl Error occurred in getSignedUrl", err);
            })
    } else {
        params = {
            Bucket: bucket,
            Fields: {
                key: `${name}`
            }
        };
        // key: `${uuid()}_${name}`
        return createSignedUrlHelper(params, response);
    }
}

const deleteFile = (request, response, token_info) => {
    try {
        console.log("Executing deleteFile with request body ", JSON.stringify(request.body));
        let responseCode = 200;
        const fileDetailId = request.params.id;
        const email = token_info.email;
        let params = {};
        pool.query('SELECT unique_file_name FROM file_details where id = $1', [fileDetailId])
            .then((results) => {
                console.log("deleteFile results of select ", results);
                console.log("deleteFile results.rows[0].unique_file_name ", results.rows[0].unique_file_name);
                params = {
                    Bucket: appConfig.bucket_name,
                    Key: results.rows[0].unique_file_name
                };
                console.log("Executing s3 deleteFile with params  ", JSON.stringify(params));
                s3.deleteObject(params, function (err, data) {
                    if (err) {
                        console.error('Error while delete object %s %s', err, JSON.stringify(params));
                        let response1 = {
                            statusCode: 500,
                            headers: {
                                "Content-Type": "application/json",
                                "Access-Control-Allow-Origin": "*",
                                "Access-Control-Allow-Credentials": true
                            },
                            body: JSON.stringify({'error': err})
                        };
                        // callback(null, response);
                        response.setHeader("Content-Type", "application/json");
                        response.setHeader("Access-Control-Allow-Origin", "*");
                        response.setHeader("Access-Control-Allow-Credentials", true);
                        return response.status(500).send(response1);
                    } else {
                        console.log('Successfully deleted object from s3', data);
                        console.log('Deleting now from file_details id %s', fileDetailId);
                        pool.query('DELETE FROM file_details WHERE  id = $1', [fileDetailId],
                            (error, results) => {
                                if (error) {
                                    console.log(error);
                                    throw error;
                                }
                                // response.status(200).send(results)
                                let response1 = {
                                    statusCode: responseCode,
                                    headers: {
                                        "Content-Type": "application/json",
                                        "Access-Control-Allow-Origin": "*",
                                        "Access-Control-Allow-Credentials": true
                                    },
                                    body: {
                                        s3_result: data,
                                        delete_query_result: results
                                    }
                                };
                                response.setHeader("Access-Control-Allow-Origin", "*");
                                response.setHeader("Content-Type", "application/json");
                                response.setHeader("Access-Control-Allow-Credentials", true);

                                return response.status(200).contentType("application/json").send(response1);
                            });

                        // callback(null, response);
                    }
                });
            })
            .catch((err) => {
                console.log("getSignedUrl Error occurred in getSignedUrl", err);
            })

    } catch (e) {
        const response1 = {
            err: e.message,
            body: "error occured"
        };
        console.log("^^^^^^ ERROR RESPONSE deleting from s3 or db", JSON.stringify(response1));
        return response.status(500).send(response1);
    }
}

const createSignedUrlHelper = (params, response) => {
    try {
        let responseCode = 200;
        s3.createPresignedPost(params, function (err, data) {
            if (err) {
                console.error('Presigning post data encountered an error', err);
                let response1 = {
                    statusCode: 500,
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*",
                        "Access-Control-Allow-Credentials": true
                    },
                    body: JSON.stringify({'error': err})
                };
                // callback(null, response);
                return response.status(500).send(`Error getting signed url: ${response1}`);
            } else {
                console.log('The createPresignedPost data is', data);
                let response1 = {
                    statusCode: responseCode,
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*",
                        "Access-Control-Allow-Credentials": true
                    },
                    body: data
                };
                response.setHeader("Access-Control-Allow-Origin", "*");
                return response.status(200).contentType("application/json").send(response1);
                // callback(null, response);
            }
        });
    } catch (e) {
        const response1 = {
            err: e.message,
            body: "error occurred"
        };
        console.log("^^^^^^ ERROR RESPONSE ", JSON.stringify(response1));
        return response.status(500).send(`Error getting signed url: ${response1}`);
    }
}

module.exports = {
    createFileDetails, getSignedUrl, getFileDetails, updateFileDetails, deleteFile
};
