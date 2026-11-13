const crypto = require("crypto");
const { PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const s3 = require("../config/s3");

async function televerser(buffer, contentType) { // dépose, renvoie la CLÉ
    const cle = `justificatifs/${crypto.randomUUID()}.jpg`;
    await s3.send(new PutObjectCommand({ Bucket: process.env.S3_BUCKET, Key: cle,
    Body: buffer, ContentType: contentType }));
    return cle;
}

async function lienTemporaire(cle) { // lien signé 5 min
    return getSignedUrl(s3, new GetObjectCommand({ Bucket: process.env.S3_BUCKET, Key: cle }),
    { expiresIn: 300 });
}

module.exports = { televerser, lienTemporaire };