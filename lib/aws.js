import AWS, { Lambda } from 'aws-sdk';

class _AWS {

  ready() {
    AWS.config.region = 'eu-west-2';
    AWS.config.credentials = new AWS.CognitoIdentityCredentials({
        IdentityPoolId: 'eu-west-2:90ab4a10-d197-4bea-bb99-a14427d1779d',
    });
  }

  async invokeLambda(functionName, invocationType, data) {
    const lambda = new Lambda({ region: 'eu-west-2', apiVersion: '2015-03-31' });
    const response = await lambda.invoke({
      FunctionName: functionName,
      InvocationType: invocationType,
      Payload: JSON.stringify(data),
      LogType: 'None'
    }).promise();
  
    const result = JSON.parse(response.Payload);
    if (result.errorMessage) {
      let error = result.errorMessage;
      try {
        error = JSON.parse(result.errorMessage);
      } catch(e) { }
  
      throw error;
    }
    return JSON.parse(result);
  }

  async invokeGateway() {
    console.log('oops');
  }
}

export default new _AWS();
