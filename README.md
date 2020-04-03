# GoReduc_API

AWS Lambda Api for [Goreduc](https://github.com/MiniJez/MSPR_app_mobile)

## Documentaion

See [this Swagger json](Documentation/dev-gr-dev-swagger.json) for the api routes.

## Developpement

Make sur to have :

- Node 12.x+
- [serverless](https://github.com/serverless/serverless) installed globally (```npm install -g serverless```)

Run ```npm install``` to install dependencies

Don't forget to change the variables:

```yaml
service: <change me>
custom:
  settings:
    REDUCS_TABLE : <change me>
    USERS_TABLE : <change me>
    BUCKET : <change me>
```

## Deployement

To deployer you need to have your `~./aws/credentials` set up correctly

Run ```serverless deploy``` and observe the magic

## Documents

AWS Api

tutorial : <https://github.com/hidjou/classsed-lambda-dynamodb-api/blob/master/handler.js>

<https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#put-property>

<https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GettingStarted.NodeJs.03.html>
