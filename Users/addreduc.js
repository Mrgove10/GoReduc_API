'use strict';

var AWS = require('aws-sdk');
var documentClient = new AWS.DynamoDB.DocumentClient();

exports.handler = function (event, context, callback) {
    var id = event['pathParameters']["id"];
    var params = {
        TableName: process.env.TABLE_NAME,
        Item: {
            "ID": id
        }
    };

    if (event.body !== null && event.body !== undefined) {
        documentClient.get(params, function (err, data) {
            if (err) {
                var response = {
                    "isBase64Encoded": false,
                    "statusCode": 200,
                    "headers": {
                        "Access-Control-Allow-Origin": "*", // Required for CORS support to work
                    },
                    "body": JSON.stringify(err)
                };
                callback(null, response);
            } else {
                data.Item.Reducs.push(event.body.ScanId)
                var response = {
                    "isBase64Encoded": false,
                    "statusCode": 200,
                    "headers": {
                        "Access-Control-Allow-Origin": "*", // Required for CORS support to work
                    },
                    "body": JSON.stringify(data.Item)
                };
                callback(null, response);

            }
        });
    }
};