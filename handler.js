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
        "T-Shirts",
        "Socks",
        "Pants",
        "Sweats",
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
    .catch(err => response(null, response(500, err)));
};

/**
  🟢Adds an image
  Model
  { 
    "base64": "base64 value of the image",
    "key": "fbbc4d0e"
  }
 */
module.exports.imageReduc = (event, context, callback) => {
  const reqBody = JSON.parse(event.body);
  const buf = Buffer.from(reqBody.base64.replace(/^data:image\/\w+;base64,/, ""), 'base64');
  var data = {
    Bucket: process.env.BUCKET,
    Key: reqBody.key + '.jpeg',
    Body: buf,
    ContentEncoding: 'base64',
    ContentType: 'image/jpeg',
    ACL: 'public-read'
  };

  s3.putObject(data, function (err, data) {
    if (err) {
      callback(null, response(500, err));
    }
  }).promise()
    .then(() => {
      callback(null, response(200,
        {
          "url": `https://goreduc.s3.amazonaws.com/${data.Key}`
        }
      ));
    });
};

/**
 * 🟢Get all reducs or a specifique one with the scanid
 */
module.exports.getReducs = (event, context, callback) => {
  const scanid = event.pathParameters.id;

  if (scanid == "all") { //we want all the reducs
    const params = {
      TableName: ReducsTable
    };

    return db.scan(params)
      .promise()
      .then(res => {
        callback(null, response(200, res.Items.sort(sortByDate)));
      })
      .catch(err => response(null, response(500, err)));
  }
  else { //we want a particular reduction

    const params = {
      TableName: ReducsTable
    };
    let total = 0;
    return db.scan(params)
      .promise()
      .then(res => {
        res.Items.forEach(item => {
          if (item.ScanID == scanid) {
            callback(null, response(200, item));
            total++;
          }
        })
        if(total === 0){
          callback(null, response(404, "Not found"));
        }
      })
      .catch(err => response(null, response(500, err)));
  }
};

/**
 * 🟢Update a reduction
 */
module.exports.updateReduc = (event, context, callback) => {
  const reducid = event.pathParameters.id;
  const reqBody = JSON.parse(event.body);

  const newTitle = reqBody.Title
  const newDescription = reqBody.Description
  const newProductCategories = reqBody.ProductCategories
  const newReductionPercent = reqBody.ReductionPercent
  const newValid = reqBody.Valid
  const newValidUntil = reqBody.ValidUntil
  const newValidStores = reqBody.ValidStores
  const newUserView = reqBody.UserView

  const params = {
    Key: {
      id: reducid
    },
    TableName: ReducsTable,
    ConditionExpression: 'attribute_exists(id)',
    UpdateExpression: `SET Title = :title,
    Description = :desscription,
    ProductCategories = :ProductCategories,
    ValidStores = :ValidStores,
    ReductionPercent = :ReductionPercent,
    newValid = :newValid,
    ValidUntil = :ValidUntil,
    UserView = :UserView`,
    ExpressionAttributeValues: {
      ':title': newTitle,
      ':desscription': newDescription,
      ':ProductCategories': newProductCategories,
      ':ReductionPercent': newReductionPercent,
      ':newValid': newValid,
      ':ValidUntil': newValidUntil,
      ':ValidStores': newValidStores,
      ':UserView': newUserView
    },
    ReturnValues: 'ALL_NEW'
  };

  return db.update(params)
    .promise()
    .then(res => {
      callback(null, response(200, res));
    })
    .catch(err => {
      callback(null, response(500, err));
      //    response(null, response(500, err))
    });
};

/**
 * 🟢Delete a reduction
 */
module.exports.deleteReduc = (event, context, callback) => {
  const params = {
    Key: {
      id: event.pathParameters.id
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
    .catch(err => response(null, response(500, err)));
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
    .catch(err => response(null, response(500, err)));
};

/**
 * 🟢Returns if a user existes or not 
 */
module.exports.getUser = (event, context, callback) => {
  const params = {
    Key: {
      id: event.pathParameters.id
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
    .catch(err => response(null, response(500, err)));
};

/**
  🟢Adds a reduc to the user
  Model
  {
    "ScanId": "32aec8ce"
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
    UpdateExpression: 'SET Reducs = list_append(Reducs, :r)',
    ExpressionAttributeValues: {
      ':r': [scanid]
    },
    ReturnValues: 'UPDATED_NEW'
  };

  return db.update(params)
    .promise()
    .then(() => {
      const paramsReturn = {
        TableName: ReducsTable
      };
      return db.scan(paramsReturn)
        .promise()
        .then(res => {
          res.Items.forEach(element => {
            if (element.ScanID == scanid) {
              callback(null, response(200, element));
            }
          });
        })
        .catch(err => response(null, response(500, err)));
    })
    .catch(err => response(null, response(500, err)));
};

/**
 * 🟢Gets the user info
 */
module.exports.infoUser = (event, context, callback) => {
  if (event.pathParameters.id === null || event.pathParameters.id === undefined) {
    return callback(null, response(400, { error: 'User id can not be null' }));
  }
  //user table parameters
  const paramsUser = {
    Key: {
      id: event.pathParameters.id
    },
    TableName: UsersTable
  };

  //reducs table parameters
  var paramsReducs = {
    TableName: ReducsTable
  };

  //gets all the reducs
  return db.scan(paramsReducs)
    .promise()
    .then(res => {
      let allReducs = res.Items;

      //gets the user
      return db.get(paramsUser)
        .promise()
        .then(res => {
          if (res.Item) { //if we found a user for that id
            let tempReducList = [];
            allReducs.forEach(generalReduc => {
              if (res.Item.Reducs.includes(generalReduc.ScanID)) {
                tempReducList.push(generalReduc);
              }
            });
            res.Item.Reducs = tempReducList; //replaces all the reductions

            callback(null, response(200, res.Item));
          }
          else {
            callback(null, response(404,
              {
                error: 'User Not found'
              }
            ));
          }
        })
        .catch(err => response(null, response(500, err)));
    })
    .catch(err => response(null, response(500, err)));
};
