const { S3Client } = require("@aws-sdk/client-s3");

const s3 = new S3Client({
    region: process.env.S3_REGION,
    endpoint: process.env.S3_ENDPOINT || undefined, // vide = AWS ; rempli = R2/MinIO
    credentials: { accessKeyId: process.env.S3_KEY, secretAccessKey: process.env.S3_SECRET },
    forcePathStyle: !!process.env.S3_ENDPOINT,
});
module.exports = s3;
