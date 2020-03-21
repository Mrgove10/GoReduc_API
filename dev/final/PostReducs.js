'use strict';

var AWS = require('aws-sdk');
var documentClient = new AWS.DynamoDB.DocumentClient();

exports.handler = function (event, context, callback) {
    var mainId = uuidv4().split("-")[0];
    var params = {
        TableName: process.env.TABLE_NAME,
        Item: new Object()
    };
    if (event.body !== null && event.body !== undefined) {
        let body = JSON.parse(event.body);
        params.Item = {
            "ID": mainId,
            "ScanID": mainId,
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
        response(callback, "ReductionPercent is not in a valid Range", true);
    }
    else {
        documentClient.put(params, function (err, data) {
            if (err) {
                console.error("Unable to write item. Error JSON:", JSON.stringify(err, null, 2));
                callback(err, null);
            } else {
                response(callback, params.Item.mainId, false)
            }
        });
    }
}


/**
 * returns the response
 * @param {callback} callback
 * @param {string} text 
 * @param {boolean} err 
 */
function response(callback, text, err) {
    var response = {
        "isBase64Encoded": false,
        "statusCode": 200,
        "headers": {
            "Access-Control-Allow-Origin": "*", // Required for CORS support to work
        },
        "body": JSON.stringify(text)
    };
    if (err == true) {
        callback(err, response);
    } else {
        callback(null, response);
    }
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