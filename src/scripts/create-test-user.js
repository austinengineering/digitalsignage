require('dotenv').config({ path: '.env.local' });
const { CognitoIdentityProviderClient, AdminCreateUserCommand, AdminSetUserPasswordCommand } = require("@aws-sdk/client-cognito-identity-provider");

// Debug logging
console.log("Environment variables loaded:");
console.log("Region:", process.env.NEXT_PUBLIC_AWS_REGION);
console.log("User Pool ID:", process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID);
console.log("Client ID:", process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID);

const client = new CognitoIdentityProviderClient({ 
    region: process.env.NEXT_PUBLIC_AWS_REGION || "us-east-2"
});

const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
const email = "test@example.com";
const password = "Test123!";

if (!userPoolId) {
    console.error("Error: NEXT_PUBLIC_COGNITO_USER_POOL_ID not found in .env.local");
    process.exit(1);
}

async function createTestUser() {
    try {
        console.log("Creating user in pool:", userPoolId);
        
        // Create user
        const createUserResponse = await client.send(new AdminCreateUserCommand({
            UserPoolId: userPoolId,
            Username: email,
            UserAttributes: [
                {
                    Name: "email",
                    Value: email
                },
                {
                    Name: "email_verified",
                    Value: "true"
                }
            ],
            MessageAction: "SUPPRESS"
        }));

        console.log("User creation response:", createUserResponse);

        // Set permanent password
        await client.send(new AdminSetUserPasswordCommand({
            UserPoolId: userPoolId,
            Username: email,
            Password: password,
            Permanent: true
        }));

        console.log("Test user created successfully!");
        console.log("Email:", email);
        console.log("Password:", password);
    } catch (error) {
        console.error("Detailed error:", error);
        if (error.message) console.error("Error message:", error.message);
        if (error.$metadata) console.error("Error metadata:", error.$metadata);
    }
}

createTestUser();