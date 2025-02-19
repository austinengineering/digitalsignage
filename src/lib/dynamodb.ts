import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  PutCommand, 
  QueryCommand, 
  DeleteCommand, 
  ScanCommand 
} from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
  region: process.env.NEXT_PUBLIC_AWS_REGION,
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!
  }
});

const docClient = DynamoDBDocumentClient.from(client, {
    marshallOptions: {
      // Add this configuration to remove undefined values
      removeUndefinedValues: true,
    }
  });

export interface MediaFile {
  mediaId: string;
  fileName: string;
  displayName: string;  // New field
  description?: string; // New field
  fileUrl: string;
  fileType: string;
  uploadDate: string;
  userId: string;
}

export interface PlaylistItem {
  id: string;
  mediaFile: MediaFile;
  duration: number | null; // Changed from number | undefined to number | null
}

export interface Playlist {
  id: string;
  name: string;
  items: PlaylistItem[];
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export async function addMediaFile(mediaFile: MediaFile) {
  const command = new PutCommand({
    TableName: 'DigitalSignage_Media',
    Item: mediaFile
  });

  return docClient.send(command);
}

export async function listMediaFiles() {
  const command = new ScanCommand({
    TableName: 'DigitalSignage_Media'
  });

  const response = await docClient.send(command);
  return response.Items as MediaFile[];
}

export async function deleteMediaFile(mediaId: string) {
  const command = new DeleteCommand({
    TableName: 'DigitalSignage_Media',
    Key: { mediaId }
  });

  return docClient.send(command);
}

export async function createPlaylist(playlist: Playlist) {
  const command = new PutCommand({
    TableName: 'DigitalSignage_Playlists',
    Item: playlist
  });

  return docClient.send(command);
}

export async function updatePlaylist(playlist: Playlist) {
  const command = new PutCommand({
    TableName: 'DigitalSignage_Playlists',
    Item: {
      ...playlist,
      updatedAt: new Date().toISOString()
    }
  });

  return docClient.send(command);
}

export async function listPlaylists() {
  const command = new ScanCommand({
    TableName: 'DigitalSignage_Playlists'
  });

  const response = await docClient.send(command);
  return response.Items as Playlist[];
}

export async function deletePlaylist(playlistId: string) {
  const command = new DeleteCommand({
    TableName: 'DigitalSignage_Playlists',
    Key: { id: playlistId }
  });

  return docClient.send(command);
}

export async function updateMediaFile(mediaFile: MediaFile) {
    const command = new PutCommand({
      TableName: 'DigitalSignage_Media',
      Item: mediaFile
    });
  
    return docClient.send(command);
  }

  