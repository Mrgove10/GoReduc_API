'use strict';

//Imports
const AWS = require('aws-sdk');
const uuid = require('uuid/v4');

const db = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10' });
const s3 = new AWS.S3();

//Constant table names
const ReducsTable = process.env.REDUCS_TABLE;
const UsersTable = process.env.USERS_TABLE;

/**
 * Create a response
 * @param {*} statusCode 
 * @param {*} message 
 */
function response(statusCode, message) {
  return {
    statusCode: statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify(message)
  };
}

/**
 * sort by date
 * @param {*} a 
 * @param {*} b 
 */
function sortByDate(a, b) {
  if (a.CreationDate > b.CreationDate) {
    return -1;
  }
  else {
    return 1;
  }
}

/**
 * 🟢Api status
 */
module.exports.status = (event, context, callback) => {
  callback(null, response(202, {
    status: "UP",
    serverTime: new Date()
  }));
};

/**
 * 🟢Get static variables
 */
module.exports.statics = (event, context, callback) => {
  callback(null, response(202,
    {
      Cities: [
        "Paris",
        "Grenoble",
        "Marseille",
        "Bordeau",
        "Montpellier",
        "Lyon",
        "Nantes",
        "Toulouse",
        "Nice",
        "Lille"
      ],
      Categories: [
        "Shoes",
        "Jeans",
        "T-Shirt",
        "Sock",
        "Pants",
        "Sweat",
        "Hats",
        "Accessories",
        "Others"
      ]
    }));
};

/**
  🟢Create a reduc
  Model
  {
    "Title": "Title",
    "Description": "Bonjour je suis la desciption",
    "ProductCategories": [
      "Shoes",
      "Jeans"
    ],  
    "ReductionPercent": "15",
    "Valid": true,
    "UserView": true,
    "ValidUntil": "2020-02-12T08:14:45.450Z",
    "ValidStores": [
      "Grenoble",
      "Marseille"
    ]
  }
 */
module.exports.createReduc = (event, context, callback) => {
  const reqBody = JSON.parse(event.body);

  if (!reqBody.Title && reqBody.Title.trim() === "" && !reqBody.Description && reqBody.Description.trim() === "") {
    return callback(null, response(400, { error: 'reduc must have title and desscription' }));
  }

  var tmpId = uuid();
  var tempSmallId = tmpId.split('-');
  var reduc = {
    id: tmpId,
    ScanID: tempSmallId[0],
    Title: reqBody.Title,
    Description: reqBody.Description,
    ProductCategories: reqBody.ProductCategories,
    ReductionPercent: reqBody.ReductionPercent,
    CreationDate: new Date().toISOString(),
    Valid: reqBody.Valid,
    UserView: reqBody.UserView,
    ValidUntil: reqBody.ValidUntil,
    ValidStores: reqBody.ValidStores
  };

  const params = {
    TableName: ReducsTable,
    Item: reduc
  };

  return db.put(params)
    .promise()
    .then(() => {
      callback(null, response(201, reduc));
    })
    .catch(err => response(null, response(err.statusCode, err)));
};

/**
 * Adds an image
 */
module.exports.imageReduc = (event, context, callback) => {
  callback(null, response(501, { message: 'Not implemented' }));

  let buffer = Buffer.from(event.body, 'base64');
  console.log("Starting File saving!");

  const params = {
    Bucket: 'goreduc',
    Key: `${uuid()}.png`,
    Body: buffer,
    ContentEncoding: 'base64'
  };

  s3.putObject(params)
    .promise()
    .then(res => {
      callback(null, response(200,
        {
          message: 'item created'
        }
      ));
    })
    .catch(err => response(null, response(err.statusCode, err)));
};

/**
 * 🟢Get all reducs
 */
module.exports.getReducs = (event, context, callback) => {
  const postid = event.pathParameters.id;

  if (postid == "all") {

    const params = {
      TableName: ReducsTable
    };

    return db.scan(params)
      .promise()
      .then(res => {
        callback(null, response(200, res.Items.sort(sortByDate)));
      })
      .catch(err => response(null, response(err.statusCode, err)));
  }
  else {

    const params = {
      Key: {
        id: postid
      },
      TableName: ReducsTable
    };

    return db.get(params)
      .promise()
      .then(res => {
        if (res.Item) {
          callback(null, response(200, res.Item));
        }
        else {
          callback(null, response(404,
            {
              error: 'Reduc Not found'
            }
          ));
        }
      })
      .catch(err => response(null, response(err.statusCode, err)));
  }
};

/**
 * Update a reduction
 */
module.exports.updateReduc = (event, context, callback) => {
  const postid = event.pathParameters.id;
  const reqBody = JSON.parse(event.body);
  const paramName = body.paramName;
  const paramValue = body.paramValue;

  const params = {
    Key: {
      id: postid
    },
    TableName: ReducsTable,
    ConditionExpression: 'attribute_exists(id)',
    UpdateExpression: 'SET title = :title, body = :body',
    ExpressionAttributeValues: {
      ':title': title,
      ':body': body
    },
    ReturnValues: 'ALL_NEW'
  };

  return db.update(params)
    .promise()
    .then(res => {
      callback(null, response(200, res));
    })
    .catch(err => response(null, response(err.statusCode, err)));
};

/**
 * 🟢Delete a reduction
 */
module.exports.deleteReduc = (event, context, callback) => {
  const postid = event.pathParameters.id;

  const params = {
    Key: {
      id: postid
    },
    TableName: ReducsTable
  };

  return db.delete(params)
    .promise()
    .then(() => {
      callback(null, response(200,
        {
          message: 'reduc deleted succesfully'
        }
      ));
    })
    .catch(err => response(null, response(err.statusCode, err)));
};

/**
  🟢Creates a user
  Model
  {
    "id":"10734202-e1fc-4df5-81c7-0e65eef0a5f8"
  }
*/
module.exports.createUser = (event, context, callback) => {
  const reqBody = JSON.parse(event.body);

  if (reqBody.id !== null && reqBody.id !== undefined) {
    return callback(null, response(400, { error: 'user must have an id' }));
  }

  var user = {
    id: reqBody.ID,
    SignUpDate: new Date().toISOString(),
    Reducs: []
  };

  const params = {
    TableName: UsersTable,
    Item: user
  };

  return db.put(params)
    .promise()
    .then(() => {
      callback(null, response(201, user));
    })
    .catch(err => response(null, response(err.statusCode, err)));
};

/**
 * 🟢Returns if a user existes or not 
 */
module.exports.getUser = (event, context, callback) => {
  const userid = event.pathParameters.id;

  const params = {
    Key: {
      id: userid
    },
    TableName: UsersTable
  };

  return db.get(params)
    .promise()
    .then(res => {
      if (res.Item) {
        callback(null, response(200,
          {
            message: true
          }
        ));
      }
      else {
        callback(null, response(404,
          {
            error: 'User Not found',
            message: false
          }
        ));
      }
    })
    .catch(err => response(null, response(err.statusCode, err)));

};

/**
  🟢Adds a reduc to the user
  Model
  {
    ScanId: "32aec8ce"
  }
 */
module.exports.addReducToUser = (event, context, callback) => {
  const userid = event.pathParameters.id;
  const reqBody = JSON.parse(event.body);
  const scanid = reqBody.ScanId;

  const params = {
    Key: {
      id: userid
    },
    TableName: UsersTable,
    ConditionExpression: 'attribute_exists(id)',
    UpdateExpression: 'ADD Reducs :r',
    ExpressionAttributeValues: {
      ':r': scanid
    },
    ReturnValues: 'ALL_NEW'
  };

  return db.update(params)
    .promise()
    .then(res => {
      callback(null, response(200, res));
    })
    .catch(err => response(null, response(err.statusCode, err)));
};

/**
 * Gets the user info
 */
module.exports.infoUser = (event, context, callback) => {
  callback(null, response(501,
    {
      message: 'Not implemented'
    }
  ));
  /*
  const id = event.pathParameters.id;
  var reducs = [];

  //gets all the reducs
  var paramsreducs = {
    TableName: ReducsTable
  };


  return db.get(paramsreducs)
    .promise()
    .then(res => {
      if (res.Item) {
        reducs = res.Item
      }
    })
    .catch(err => response(null, response(err.statusCode, err)));


  /*
  
    documentClient.scan(params, function (err, data) {
      if (err) {
        console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
        callback(null, response(501, err));
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
        TableName: UsersTable,
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
    }, 150);*/
};
