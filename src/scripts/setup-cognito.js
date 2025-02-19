const { CognitoIdentityProviderClient, CreateUserPoolCommand, CreateUserPoolClientCommand } = require("@aws-sdk/client-cognito-identity-provider");

const client = new CognitoIdentityProviderClient({ region: "us-east-2" });

async function createUserPool() {
    try {
        // Create User Pool
        const createPoolCommand = new CreateUserPoolCommand({
            PoolName: "DigitalSignageUserPool",
            Policies: {
                PasswordPolicy: {
                    MinimumLength: 8,
                    RequireUppercase: true,
                    RequireLowercase: true,
                    RequireNumbers: true,
                    RequireSymbols: true
                }
            },
            AutoVerifiedAttributes: ["email"],
            Schema: [
                {
                    Name: "email",
                    AttributeDataType: "String",
                    Required: true,
                    Mutable: true
                }
            ]
        });

        const userPoolResult = await client.send(createPoolCommand);
        const userPoolId = userPoolResult.UserPool.Id;
        console.log("User Pool created:", userPoolId);

        // Create App Client
        const createClientCommand = new CreateUserPoolClientCommand({
            UserPoolId: userPoolId,
            ClientName: "DigitalSignageClient",
            GenerateSecret: false,
            ExplicitAuthFlows: [
                "ALLOW_USER_PASSWORD_AUTH",
                "ALLOW_REFRESH_TOKEN_AUTH"
            ]
        });

        const clientResult = await client.send(createClientCommand);
        console.log("App Client created:", clientResult.UserPoolClient.ClientId);

        // Save IDs to .env.local
        const envContent = `
NEXT_PUBLIC_COGNITO_USER_POOL_ID=${userPoolId}
NEXT_PUBLIC_COGNITO_CLIENT_ID=${clientResult.UserPoolClient.ClientId}
`;
        require('fs').appendFileSync('.env.local', envContent);
        
    } catch (error) {
        console.error("Error creating Cognito resources:", error);
    }
}

createUserPool();