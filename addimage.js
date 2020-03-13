const AWS = require('aws-sdk');
//AWS.config.update({ region: process.env.REGION || 'us-east-1' });
const s3 = new AWS.S3({ signatureVersion: 'v4' });

exports.handler = function (event, context, callback) {
    const actionId = 1;
    const s3Params = {
        Bucket: 'goreduc',
        Key: `${actionId}.jpg`,
        ContentType: 'image/jpeg',
        //    ACL: 'public-read',
    };

    let uploadURL = s3.getSignedUrl('putObject', s3Params);
    var response = {
        "isBase64Encoded": false,
        "statusCode": 200,
        "headers": {
            "Access-Control-Allow-Origin": "*", // Required for CORS support to work
        },
        "body": JSON.stringify({
            "uploadURL": uploadURL,
            "photoFilename": `${actionId}.jpg`
        })
    };
    callback(null, response);

}

/**
 * Creates a V4 UUID 
 */
function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}