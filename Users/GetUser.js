'use strict';

var AWS = require('aws-sdk');
var documentClient = new AWS.DynamoDB.DocumentClient();

exports.handler = function (event, context, callback) {
    var id = event['pathParameters']["id"];

    var params = {
        TableName: process.env.TABLE_NAME,
        Key: {
            "ID": id,
        }
    };
    documentClient.get(params, function (err, data) {
        if (err) {
            console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
            callback(err, null);
        } else {
            console.log("GetReducs succeeded:", JSON.stringify(data, null, 2));
            var response = {
                "isBase64Encoded": false,
                "statusCode": 200,
                "headers": {
                    "Access-Control-Allow-Origin": "*", // Required for CORS support to work
                },
                "body": JSON.stringify(data)
            }
            callback(null, response);
        }
    });

}