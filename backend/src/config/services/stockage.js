const crypto = require("crypto");
const { PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const s3 = require("../s3");

async function televerser(buffer, contentType) { // dépose, renvoie la CLÉ
    const extensions = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
    const extension = extensions[contentType];
    if (!extension) throw new Error("Format d’image non pris en charge");
    const cle = `justificatifs/${crypto.randomUUID()}.${extension}`;
    await s3.send(new PutObjectCommand({ Bucket: process.env.S3_BUCKET, Key: cle,
    Body: buffer, ContentType: contentType }));
    return cle;
}

async function lienTemporaire(cle) { // lien signé 5 min
    return getSignedUrl(s3, new GetObjectCommand({ Bucket: process.env.S3_BUCKET, Key: cle }),
    { expiresIn: 300 });
}

module.exports = { televerser, lienTemporaire };