const AWS = require("aws-sdk");

const DynamoDB = require("aws-sdk/clients/dynamodb");
const DocumentClient = new DynamoDB.DocumentClient();

const sqs = new AWS.SQS();

const sendEmail = async ({ QueueUrl, subject, recipient, body }) => {
  const response = await sqs
    .sendMessage({
      QueueUrl,
      MessageBody: JSON.stringify({
        subject,
        recipient,
        body,
      }),
    })
    .promise();
  return response;
};

const { USERS_TABLE, COMPOSE_EMAIL_QUEUE_URL, USER_PREFERENCE_TABLE } =
  process.env;

module.exports.handler = async (event) => {
  if (event.triggerSource === "PostConfirmation_ConfirmSignUp") {
    // if the user has confirmed sign up -> then save the user in the db

    const { email } = event.request.userAttributes;

    const user = {
      email,
      roles: ["roles/customer"],
      compositionsCount: 0,
      likesCount: 0,
      followersCount: 0,
      followingCount: 0,
      createdAt: new Date().toJSON(),
    };

    // create new user
    await DocumentClient.put({
      TableName: USERS_TABLE,
      Item: user,
      ConditionExpression: "attribute_not_exists(email)",
    }).promise();

    // create new user preference
    await DocumentClient.put({
      TableName: USER_PREFERENCE_TABLE,
      Item: {
        userId: email,
      },
      ConditionExpression: "attribute_not_exists(userId)",
    }).promise();

    // email user - testing
    await sendEmail({
      QueueUrl: COMPOSE_EMAIL_QUEUE_URL,
      subject: "Welcome to Compose",
      body: "Welcome to Mandarino, next gen AI language learning platform",
      recipient: email,
    });

    return event;
  } else {
    // otherwise do nothing
    return event;
  }
};
