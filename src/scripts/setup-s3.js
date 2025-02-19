const { S3Client, CreateBucketCommand, PutBucketCorsCommand } = require("@aws-sdk/client-s3");

const client = new S3Client({ region: "us-east-2" });
const BUCKET_NAME = "digital-signage-media-" + Math.random().toString(36).substring(2, 15);

async function createS3Bucket() {
    try {
        // Create bucket
        console.log(`Creating bucket: ${BUCKET_NAME}...`);
        await client.send(new CreateBucketCommand({
            Bucket: BUCKET_NAME,
            CreateBucketConfiguration: {
                LocationConstraint: "us-east-2"
            }
        }));

        // Configure CORS
        console.log("Configuring CORS...");
        await client.send(new PutBucketCorsCommand({
            Bucket: BUCKET_NAME,
            CORSConfiguration: {
                CORSRules: [
                    {
                        AllowedHeaders: ["*"],
                        AllowedMethods: ["GET", "PUT", "POST", "DELETE"],
                        AllowedOrigins: ["*"],  // In production, restrict this to your domain
                        ExposeHeaders: []
                    }
                ]
            }
        }));

        // Add bucket name to .env.local
        const envContent = `\nNEXT_PUBLIC_S3_BUCKET_NAME=${BUCKET_NAME}`;
        require('fs').appendFileSync('.env.local', envContent);
        
        console.log("S3 bucket created and configured successfully!");
        console.log("Bucket name added to .env.local");

    } catch (error) {
        console.error("Error setting up S3:", error);
    }
}

createS3Bucket();