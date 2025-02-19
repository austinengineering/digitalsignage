require('dotenv').config({ path: '.env.local' });
const { DynamoDBClient, CreateTableCommand } = require("@aws-sdk/client-dynamodb");

const client = new DynamoDBClient({ region: "us-east-2" });

async function createPlaylistTable() {
    try {
        const command = new CreateTableCommand({
            TableName: "DigitalSignage_Playlists",
            KeySchema: [
                { AttributeName: "id", KeyType: "HASH" }
            ],
            AttributeDefinitions: [
                { AttributeName: "id", AttributeType: "S" }
            ],
            ProvisionedThroughput: {
                ReadCapacityUnits: 5,
                WriteCapacityUnits: 5
            }
        });

        const response = await client.send(command);
        console.log("Playlist table created successfully:", response);
    } catch (error) {
        console.error("Error creating playlist table:", error);
    }
}

createPlaylistTable();