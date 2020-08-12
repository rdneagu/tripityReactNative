import { Lambda } from 'aws-sdk';

async function invokeLambda(functionName, invocationType, data) {
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

export { invokeLambda };
