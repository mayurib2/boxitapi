var AWS = require('aws-sdk');

exports.handler = async (event, context) => {
    AWS.config.update({region: 'us-east-1'});
    AWS.config.update({

        region: 'us-east-1'
    });
    console.log("event ",JSON.stringify(event));
    try {
        let fileName, bucketName;
        event.Records.forEach(function(record) {
        fileName = record.s3.object.key;
        bucketName = record.s3.bucket.name;
    });
// Create sendEmail params
        var params = {
            Destination: { /* required */
                CcAddresses: [
                    'bhisemayuri@gmail.com'
                    /* more items */
                ],
                ToAddresses: [
                    'bhisemayuri@gmail.com'
                    /* more items */
                ]
            },
            Message: { /* required */
                Body: { /* required */
                    Html: {
                        Charset: "UTF-8",
                        Data: `${fileName} file deleted from bucket ${bucketName}`
                    },
                    Text: {
                        Charset: "UTF-8",
                        Data: "TEXT HAHAHA"
                    }
                },
                Subject: {
                    Charset: 'UTF-8',
                    Data: 'ALERT: File deleted from bucket'
                }
            },
            Source: 'bhisemayuri@gmail.com', /* required */
            ReplyToAddresses: [
                'bhisemayuri@gmail.com',
                /* more items */
            ]
        };
        var sendPromise = await new AWS.SES({apiVersion: '2010-12-01'}).sendEmail(params).promise();
        const response = {
            statusCode: 200,
            body: JSON.stringify(sendPromise)
    };
        return response;


    } catch (err) {
        console.log("******* ERROR IS  IS ", err);
    }

}
