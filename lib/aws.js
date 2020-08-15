import AWS from 'aws-sdk';

class _AWS {

  initialize() {
    AWS.config.region = 'eu-west-2';
    AWS.config.credentials = new AWS.CognitoIdentityCredentials({
        IdentityPoolId: 'eu-west-2:90ab4a10-d197-4bea-bb99-a14427d1779d',
    });
  }
}

export default new _AWS();
