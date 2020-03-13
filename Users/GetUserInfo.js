'use strict';

var AWS = require('aws-sdk');
var documentClient = new AWS.DynamoDB.DocumentClient();

exports.handler = function (event, context, callback) {
    var id = event['pathParameters']["id"];
    var reducs = [];

    //gets all the reducs
    var params = {
        TableName: process.env.TABLE_NAME2
    };
    documentClient.scan(params, function (err, data) {
        if (err) {
            console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
            callback(err, null);
        } else {
            console.log("GetReducs succeeded:", JSON.stringify(data, null, 2));
            reducs = data.Items;
        }
    });

    // we set a timout of 150 milisenconds to make sure the first database request is finished
    // overwise we might get empty information on the first request
    setTimeout(() => {
        //gets the over info of the user
        var paramsUser = {
            TableName: process.env.TABLE_NAME,
            Key: {
                "ID": id,
            }
        };
        documentClient.get(paramsUser, function (err, data) {
            if (err) {
                console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
                callback(err, null);
            } else {
                data.Item.ReducsList = [];
                data.Item.Reducs.forEach(reducUser => {
                    reducs.forEach(reducBase => {
                        if (reducBase.ID == reducUser && reducBase.UserView == true) {
                            data.Item.ReducsList.push(reducBase);
                        }
                    });
                });
                delete data.Item.Reducs;
                console.log("GetReducs succeeded:", JSON.stringify(data, null, 2));
                var response = {
                    "isBase64Encoded": false,
                    "statusCode": 200,
                    "headers": {
                        "Access-Control-Allow-Origin": "*", // Required for CORS support to work
                    },
                    "body": JSON.stringify(data)
                };
                callback(null, response);
            }
        });
    }, 150);
}; 