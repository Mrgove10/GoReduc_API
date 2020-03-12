'use strict';

var AWS = require('aws-sdk');
var documentClient = new AWS.DynamoDB.DocumentClient();

exports.handler = function (event, context, callback) {
    var mainId = uuidv4();
    var params = {
        TableName: process.env.TABLE_NAME,
        Item: new Object()
    };
    if (event.body !== null && event.body !== undefined) {
        let body = JSON.parse(event.body);
        params.Item = {
            "ID": mainId,
            "ScanID": mainId.split("-")[0],
            "Title": body.Title,
            "Description": body.Description,
            "ProductCategories": body.ProductCategories,
            "ReductionPercent": body.ReductionPercent,
            "CreationDate": new Date().toISOString(),
            "Valid": body.Valid,
            "UserView": body.UserView,
            "ValidUntil": body.ValidUntil,
            "ValidStores": body.ValidStores
        };
    }

    if (params.Item.ReductionPercent < 0 || params.Item.ReductionPercent > 100) {
        console.log("PostReducs Failed:");
        var response = createError("406", "ReductionPercent is not in a valid Range");
        callback(null, response);
    }
    else {
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
                    "body": JSON.stringify(params.Item.mainId)
                };
                callback(null, response);

            }
        });
    }
}

/**
 * Creates the error responce body
 * @param {string} errorCode 
 * @param {string} errorMessage 
 */
function createError(errorCode, errorMessage) {
    var response = {
        "isBase64Encoded": false,
        "statusCode": errorCode,
        "headers": {
            "Access-Control-Allow-Origin": "*", // Required for CORS support to work
        },
        "body": JSON.stringify(errorMessage)
    };
    return response;
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