require('dotenv').config({ path: '.env.local' });
const { CognitoIdentityProviderClient, CreateUserPoolCommand, CreateUserPoolClientCommand } = require("@aws-sdk/client-cognito-identity-provider");

const client = new CognitoIdentityProviderClient({ region: "us-east-2" });

async function createFullCognitoSetup() {
    try {
        // Create User Pool
        const createPoolCommand = new CreateUserPoolCommand({
            PoolName: "DigitalSignageUserPool",
            AdminCreateUserConfig: {
                AllowAdminCreateUserOnly: true
            },
            AutoVerifiedAttributes: ["email"],
            Policies: {
                PasswordPolicy: {
                    MinimumLength: 8,
                    RequireUppercase: true,
                    RequireLowercase: true,
                    RequireNumbers: true,
                    RequireSymbols: true
                }
            }
        });

        console.log("Creating User Pool...");
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
                "ALLOW_REFRESH_TOKEN_AUTH",
                "ALLOW_USER_SRP_AUTH",
                "ALLOW_ADMIN_USER_PASSWORD_AUTH"
            ],
            AllowedOAuthFlows: ["code"],
            AllowedOAuthScopes: ["email", "openid", "profile"],
            CallbackURLs: ["http://localhost:3000"],
            LogoutURLs: ["http://localhost:3000"]
        });

        console.log("Creating User Pool Client...");
        const clientResult = await client.send(createClientCommand);
        console.log("App Client created:", clientResult.UserPoolClient.ClientId);

        // Save IDs to .env.local
        const envContent = `
NEXT_PUBLIC_COGNITO_USER_POOL_ID=${userPoolId}
NEXT_PUBLIC_COGNITO_CLIENT_ID=${clientResult.UserPoolClient.ClientId}`;
        
        require('fs').writeFileSync('.env.local', envContent, { flag: 'a' });
        console.log("Configuration saved to .env.local");
        
    } catch (error) {
        console.error("Error creating Cognito resources:", error);
        if (error.message) console.error("Error message:", error.message);
    }
}

createFullCognitoSetup();