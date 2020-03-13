'use strict';

var AWS = require('aws-sdk');
var documentClient = new AWS.DynamoDB.DocumentClient();

/**
 * Main function
 */
exports.handler = function (event, context, callback) {
    //gets the over info of the user
    returnUser(callback, event['pathParameters']["id"], retrieveAllReducs(callback, documentClient), documentClient);
};

/**
 * Retreives all the Reducs
 */
function retrieveAllReducs(callback, documentClient) {
    try {
        //Dynamodb params
        var params = {
            TableName: process.env.TABLE_NAME_REDUCS
        };
        documentClient.scan(params, function (err, data) {
            if (err) response(callback, err, true);
            return data.Items;
        });
    }
    catch (error) {
        response(callback, error, true);
    }
}

/**
 * returns the user
 */
function returnUser(callback, id, reducs, documentClient) {
    try {
        //Dynamodb params
        var paramsUser = {
            TableName: process.env.TABLE_NAME_USERS,
            Key: {
                "ID": id,
            }
        };
        documentClient.get(paramsUser, function (err, data) {
            if (err) throw err;
            var Reducs = data.Item.Reducs;
            data.Item.ReducsListTemp = [] //temporary user list
            if (Reducs != null || Reducs != undefined) {
                //foreach reduction in a user
                Reducs.forEach(r => {
                    if (r != null || r != undefined || r != "") {
                        //foreach reduction in the database
                        reducs.forEach(rb => {
                            if (rb != null || rb != undefined || r != "") {
                                // if the id is the same and the reduc can be seen by a user
                                //if (rb.ID == r && rb.UserView == true) {
                                data.Item.ReducsListTemp.push(rb); //add the info to the temporary list
                                // }
                            }
                        });
                    }
                });
            }
            data.Item.ReducsList = data.Item.ReducsListTemp;
            //delete data.Item.ReducsListTemp;
            response(callback, data, false);
        });
    }
    catch (error) {
        response(callback, error, true);
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

