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
 * Api status
 */
module.exports.status = (event, context, callback) => {
  callback(null, response(202, {
    staus: "UP",
    serverTime: new Date()
  }));
};

/**
 * Create a reduc
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
 * Get all reducs
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
 * Delete a post
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
 * Creates a user
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
 * Returns if a user existes or not 
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
 * Adds a reduc to the user
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
};
