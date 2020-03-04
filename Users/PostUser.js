'use strict';

var AWS = require('aws-sdk');
var documentClient = new AWS.DynamoDB.DocumentClient();

exports.handler = function (event, context, callback) {
    var params = {
            TableName: process.env.TABLE_NAME,
            Item: {
                "ID": uuidv4(),
                "Name": "test",
                "time": new Date().toISOString()
            }
    };
    documentClient.put(params, function (err, data) {
        if (err) {
            console.error("Unable to write item. Error JSON:", JSON.stringify(err, null, 2));
            callback(err, null);
        } else {
            console.log("PostReducs succeeded:", JSON.stringify(data, null, 2));
            var response = {
                "isBase64Encoded": false,
                "statusCode": 200,
                "headers": {
                    "Access-Control-Allow-Origin": "*", // Required for CORS support to work
                },
                "body": JSON.stringify(params.Item)
            }
            callback(null, response);
        }
    });
};

//TODO : should use the npm package
function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}