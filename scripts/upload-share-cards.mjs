// 把 share-cards-out/ 的卡片传进 R2 桶 komesomme-assets 的 share-cards/v1/ 下
// 需要环境变量 R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY（R2 的 S3 密钥对，一次性使用即可）
// 依赖：npm i --no-save @aws-sdk/client-s3
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const ACCOUNT = "92114b6151613965b59c1ff3a7b610f5";
const BUCKET = "komesomme-assets";
const PREFIX = "share-cards/v1/";
const DIR = path.join(process.cwd(), "share-cards-out");

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${ACCOUNT}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const files = readdirSync(DIR).filter(f => f.endsWith(".png")).sort();
console.log(`待传 ${files.length} 张…`);
let ok = 0, fail = 0;
const queue = [...files];
async function worker() {
  while (queue.length) {
    const f = queue.shift();
    try {
      await s3.send(new PutObjectCommand({
        Bucket: BUCKET, Key: PREFIX + f,
        Body: readFileSync(path.join(DIR, f)),
        ContentType: "image/png",
        CacheControl: "public, max-age=31536000, immutable",
      }));
      ok++;
      if (ok % 50 === 0) console.log(`  ${ok}/${files.length}`);
    } catch (e) { fail++; console.log(`  失败 ${f}: ${e.message}`); }
  }
}
await Promise.all(Array.from({ length: 8 }, worker));
console.log(`\n=== 汇总 === 成功 ${ok} / 失败 ${fail}`);
console.log(`公开地址示例: https://assets.komesomme.jp/${PREFIX}yumepirika.png`);
