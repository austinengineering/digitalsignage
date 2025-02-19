require('dotenv').config({ path: '.env.local' });
const { DynamoDBClient, CreateTableCommand } = require("@aws-sdk/client-dynamodb");

const client = new DynamoDBClient({ region: "us-east-2" });

async function createMediaTable() {
    try {
        const command = new CreateTableCommand({
            TableName: "DigitalSignage_Media",
            KeySchema: [
                { AttributeName: "mediaId", KeyType: "HASH" }
            ],
            AttributeDefinitions: [
                { AttributeName: "mediaId", AttributeType: "S" }
            ],
            ProvisionedThroughput: {
                ReadCapacityUnits: 5,
                WriteCapacityUnits: 5
            }
        });

        const response = await client.send(command);
        console.log("Media table created successfully:", response);
    } catch (error) {
        console.error("Error creating media table:", error);
    }
}

createMediaTable();