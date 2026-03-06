import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
dotenv.config();

const cleanEnv = (key: string) => {
    let val = process.env[key] || '';
    if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1);
    }
    return val;
};

const endpoint = cleanEnv('R2_ENDPOINT') || `https://${cleanEnv('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`;
const accessKeyId = cleanEnv('R2_ACCESS_KEY_ID');
const secretAccessKey = cleanEnv('R2_SECRET_ACCESS_KEY');

console.log('[S3 Service] Initializing R2 Client...');
console.log(`[S3 Service] Endpoint: ${endpoint}`);
console.log(`[S3 Service] Access Key length: ${accessKeyId.length}`);

const s3 = new AWS.S3({
    endpoint: endpoint,
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,
    signatureVersion: 'v4',
    s3ForcePathStyle: true,
});

const BUCKET_NAME = cleanEnv('R2_BUCKET_NAME') || 'coelho';

export const uploadFile = async (fileBuffer: Buffer, mimetype: string, originalName: string): Promise<string> => {
    const extension = originalName.split('.').pop();
    const key = `uploads/${uuidv4()}.${extension}`;

    await s3
        .putObject({
            Bucket: BUCKET_NAME,
            Key: key,
            Body: fileBuffer,
            ContentType: mimetype
        })
        .promise();

    const publicUrl = process.env.R2_PUBLIC_URL;
    return publicUrl ? `${publicUrl}/${key}` : `${endpoint}/${BUCKET_NAME}/${key}`;
};

export const deleteFile = async (url: string): Promise<void> => {
    try {
        let fileKey = url;
        if (url.includes(BUCKET_NAME)) {
            fileKey = url.split(`${BUCKET_NAME}/`)[1];
        }

        await s3
            .deleteObject({
                Bucket: BUCKET_NAME,
                Key: fileKey,
            })
            .promise();
        console.log(`Deleted file: ${fileKey}`);
    } catch (error) {
        console.error('Error deleting file: ', error);
    }
};
