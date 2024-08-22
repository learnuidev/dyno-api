const DynamoDB = require("aws-sdk/clients/dynamodb");
const DocumentClient = new DynamoDB.DocumentClient();

// eslint-disable-next-line no-undef
const { USERS_TABLE, USER_PREFERENCE_TABLE } = process.env;

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

    return event;
  } else {
    // otherwise do nothing
    return event;
  }
};
