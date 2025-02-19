const { DynamoDBClient, CreateTableCommand } = require("@aws-sdk/client-dynamodb");

const client = new DynamoDBClient({ region: "us-east-2" });

async function createTables() {
    try {
        // Create Screens table
        const screensTable = new CreateTableCommand({
            TableName: "DigitalSignage_Screens",
            KeySchema: [
                { AttributeName: "screenId", KeyType: "HASH" }
            ],
            AttributeDefinitions: [
                { AttributeName: "screenId", AttributeType: "S" }
            ],
            ProvisionedThroughput: {
                ReadCapacityUnits: 5,
                WriteCapacityUnits: 5
            }
        });

        // Create Playlists table
        const playlistsTable = new CreateTableCommand({
            TableName: "DigitalSignage_Playlists",
            KeySchema: [
                { AttributeName: "playlistId", KeyType: "HASH" }
            ],
            AttributeDefinitions: [
                { AttributeName: "playlistId", AttributeType: "S" }
            ],
            ProvisionedThroughput: {
                ReadCapacityUnits: 5,
                WriteCapacityUnits: 5
            }
        });

        // Execute table creation
        console.log("Creating Screens table...");
        await client.send(screensTable);
        console.log("Screens table created successfully!");

        console.log("Creating Playlists table...");
        await client.send(playlistsTable);
        console.log("Playlists table created successfully!");

    } catch (error) {
        console.error("Error creating DynamoDB tables:", error);
    }
}

createTables();