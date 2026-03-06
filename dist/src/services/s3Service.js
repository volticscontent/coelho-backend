"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFile = exports.uploadFile = void 0;
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const uuid_1 = require("uuid");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const endpoint = process.env.R2_ENDPOINT || `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
const s3 = new aws_sdk_1.default.S3({
    endpoint: endpoint,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    signatureVersion: 'v4',
    s3ForcePathStyle: true,
});
const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'coelho';
const uploadFile = async (fileBuffer, mimetype, originalName) => {
    const extension = originalName.split('.').pop();
    const key = `uploads/${(0, uuid_1.v4)()}.${extension}`;
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
exports.uploadFile = uploadFile;
const deleteFile = async (url) => {
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
    }
    catch (error) {
        console.error('Error deleting file: ', error);
    }
};
exports.deleteFile = deleteFile;
