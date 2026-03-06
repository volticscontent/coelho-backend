import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
dotenv.config();

const endpoint = process.env.R2_ENDPOINT || `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

const s3 = new AWS.S3({
    endpoint: endpoint,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    signatureVersion: 'v4',
    s3ForcePathStyle: true,
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'coelho';

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
