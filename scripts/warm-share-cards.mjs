// 批量生成全部品牌分享卡（普通版+二维码版）到 share-cards-out/
// 用法: node scripts/warm-share-cards.mjs [--limit 10]
// 本地起生产服务逐张抓取渲染结果；已生成的文件会跳过，可断点续跑。
// 生成后用 scripts/upload-share-cards.mjs 传进 R2 桶。
import { spawn, execSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const PORT = 3109;
const BASE = `http://localhost:${PORT}`;
const OUT = path.join(process.cwd(), "share-cards-out");
const li = process.argv.indexOf("--limit");
const LIMIT = li >= 0 ? Number(process.argv[li + 1]) : Infinity;

function brandIds() {
  const dir = path.join(process.cwd(), "src", "data", "rice", "sources");
  const ids = new Set();
  for (const f of readdirSync(dir)) {
    if (!f.endsWith(".ts")) continue;
    const text = readFileSync(path.join(dir, f), "utf8");
    for (const m of text.matchAll(/\bid:\s*"([a-z0-9-]+)"/g)) ids.add(m[1]);
  }
  return [...ids].sort();
}

async function waitReady() {
  for (let i = 0; i < 90; i++) {
    try { const r = await fetch(BASE + "/"); if (r.ok) return; } catch {}
    await new Promise(r => setTimeout(r, 2000));
  }
  throw new Error("等了3分钟服务还没响应，看上面服务器自己打印的报错");
}

async function main() {
  if (!existsSync(path.join(process.cwd(), ".next", "BUILD_ID"))) {
    console.log("没有现成构建，先 npm run build（几分钟）…");
    execSync("npm run build", { stdio: "inherit", shell: true });
  }
  console.log("启动本地服务（日志直接打印，看到 Ready 才算起）…");
  const server = spawn("npx", ["next", "start", "-p", String(PORT)], { shell: true, stdio: "inherit" });
  const cleanup = () => { try {
    if (process.platform === "win32") execSync(`taskkill /pid ${server.pid} /T /F`, { stdio: "ignore" });
    else server.kill();
  } catch {} };
  process.on("exit", cleanup);
  try {
    await waitReady();
    const ids = brandIds().slice(0, LIMIT);
    console.log(`品牌 ${ids.length} 个，每家 2 张，开始…`);
    mkdirSync(OUT, { recursive: true });
    let ok = 0, fail = 0, bytes = 0;
    for (const [i, id] of ids.entries()) {
      for (const [suffix, p] of [["", `/api/rice/share-card/${id}`], ["-qr", `/api/rice/share-card/${id}/qr`]]) {
        const file = path.join(OUT, `${id}${suffix}.png`);
        if (existsSync(file)) { ok++; bytes += readFileSync(file).length; continue; }
        try {
          const res = await fetch(BASE + p);
          if (!res.ok) throw new Error("HTTP " + res.status);
          const buf = Buffer.from(await res.arrayBuffer());
          writeFileSync(file, buf); ok++; bytes += buf.length;
        } catch (e) { fail++; console.log(`  失败 ${id}${suffix}: ${e.message}`); }
      }
      console.log(`[${i + 1}/${ids.length}] ${id}`);
    }
    console.log(`\n=== 汇总 === 成功 ${ok} 张 / 失败 ${fail} 张 / 总大小 ${(bytes / 1048576).toFixed(1)} MB / 平均 ${ok ? Math.round(bytes / ok / 1024) : 0} KB`);
    console.log(`输出目录: ${OUT}`);
  } finally { cleanup(); }
}
main().catch(e => { console.error(e); process.exit(1); });
