const basicAuthorizer = async (event, _, cb) => {
  console.log(JSON.stringify(event));
  const { type, authorizationToken, methodArn } = event;

  if (type !== "TOKEN") {
    cb("Unauthorized");
  }

  try {
    const authorizationTokenParts = authorizationToken.split(" ");
    const [tokenType, token] = authorizationTokenParts;

    let isAllowed = true;
    let userName = "__NONE__";

    if (
      !authorizationToken ||
      authorizationTokenParts.length !== 2 ||
      tokenType !== "Basic" ||
      !token
    ) {
      isAllowed = false;
    } else {
      try {
        const encodedCredentials = authorizationToken.split(" ")[1];

        const buffer = Buffer.from(encodedCredentials, "base64");
        const [login, password] = buffer.toString("utf-8").split(":");

        userName = login;

        console.log(
          `username: ${userName} and password: ${password}, buffer = ${buffer.toString(
            "utf-8"
          )}`
        );

        const expectedUserPassword = "superuser";

        isAllowed = expectedUserPassword === password;
      } catch (e) {
        isAllowed = false;
      }
    }

    const policy = {
      userName,
      policyDocument: {
        Version: "2012-10-17",
        Statement: [
          {
            Action: "execute-api:Invoke",
            Effect: isAllowed ? "Allow" : "Deny",
            Resource: methodArn,
          },
        ],
      },
    };

    cb(null, policy);
  } catch (error) {
    cb(error.message);
  }
};

module.exports = {
  basicAuthorizer,
};
