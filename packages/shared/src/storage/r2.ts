import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../env';

export function getR2Client() {
	if (!env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY || !env.R2_ACCOUNT_ID) {
		throw new Error('R2 credentials not configured');
	}
	return new S3Client({
		region: 'auto',
		endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
		credentials: {
			accessKeyId: env.R2_ACCESS_KEY_ID,
			secretAccessKey: env.R2_SECRET_ACCESS_KEY,
		},
	});
}

export async function getSignedUploadUrl(key: string, contentType: string, expiresInSeconds = 600) {
	if (!env.R2_BUCKET) throw new Error('R2_BUCKET not set');
	const client = getR2Client();
	const cmd = new PutObjectCommand({ Bucket: env.R2_BUCKET, Key: key, ContentType: contentType });
	return getSignedUrl(client, cmd, { expiresIn: expiresInSeconds });
}

export async function getSignedDownloadUrl(key: string, expiresInSeconds = 600) {
	if (!env.R2_BUCKET) throw new Error('R2_BUCKET not set');
	const client = getR2Client();
	const cmd = new GetObjectCommand({ Bucket: env.R2_BUCKET, Key: key });
	return getSignedUrl(client, cmd, { expiresIn: expiresInSeconds });
}