'use strict';

var AWS = require('aws-sdk');
var documentClient = new AWS.DynamoDB.DocumentClient();

exports.handler = function (event, context, callback) {
    var response = {
        "isBase64Encoded": false,
        "statusCode": 200,
        "headers": {
            "Access-Control-Allow-Origin": "*", // Required for CORS support to work
        },
        "body": JSON.stringify(event['pathParameters'])
    }
    callback(null, response);

    //return event['pathParameters'];
    /* var params = {
          TableName: process.env.TABLE_NAME
      };
      documentClient.scan(params, function (err, data) {
          if (err) {
              callback(err, null);
          } else {
              callback(null, data.Items);
          }
      });*/

}