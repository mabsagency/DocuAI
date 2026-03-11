// Stub S3/MinIO storage helper

import AWS from "aws-sdk";

const s3 = new AWS.S3({
  endpoint: process.env.S3_ENDPOINT || "http://localhost:9000",
  accessKeyId: process.env.S3_ACCESS_KEY || "minioadmin",
  secretAccessKey: process.env.S3_SECRET_KEY || "minioadmin",
  s3ForcePathStyle: true,
  signatureVersion: "v4",
});

export async function uploadDoc(key: string, content: string) {
  await s3.putObject({ Bucket: process.env.S3_BUCKET || "docuai", Key: key, Body: content }).promise();
  return `https://${process.env.S3_BUCKET || "docuai"}.s3.amazonaws.com/${key}`;
}

export async function getDoc(key: string) {
  const resp = await s3.getObject({ Bucket: process.env.S3_BUCKET || "docuai", Key: key }).promise();
  return resp.Body;
}
