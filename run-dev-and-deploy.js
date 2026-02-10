/**
 * Chạy lần lượt: pull → start:dev → Cloudflare Tunnel (bắt URL) → cập nhật wrangler.toml → deploy.
 * Chạy: node run-dev-and-deploy.js
 * (Cần Node >= 18)
 */

const { spawn, spawnSync, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = process.cwd();
const WRANGLER_TOML = path.join(PROJECT_ROOT, 'wrangler.toml');
const CLOUDFLARED_EXE = process.env.CLOUDFLARED_EXE || 'E:\\Datnd15\\Tool\\cloudflared.exe';
const TUNNEL_URL_REGEX = /https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/g;
const UPSTREAM_URL_REGEX = /(UPSTREAM_URL\s*=\s*)"[^"]*"/;

function log(step, msg) {
  console.log(`\n========================================`);
  console.log(`[${step}] ${msg}`);
  console.log('========================================');
}

function run(cmd, opts = {}) {
  return execSync(cmd, { encoding: 'utf8', cwd: PROJECT_ROOT, ...opts });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function captureTunnelUrl(timeoutMs = 35000) {
  return new Promise((resolve, reject) => {
    const child = spawn(CLOUDFLARED_EXE, ['tunnel', '--url', 'http://localhost:3000'], {
      cwd: PROJECT_ROOT,
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
    });

    let buffer = '';
    const timer = setTimeout(() => {
      child.stdout?.destroy();
      child.stderr?.destroy();
      child.unref();
      const m = buffer.match(TUNNEL_URL_REGEX);
      if (m && m[0]) return resolve(m[0]);
      reject(new Error('Timeout: không bắt được URL tunnel trong ' + timeoutMs + 'ms'));
    }, timeoutMs);

    child.stdout?.on('data', (chunk) => {
      buffer += chunk.toString();
      const m = buffer.match(TUNNEL_URL_REGEX);
      if (m && m[0]) {
        clearTimeout(timer);
        child.stdout?.destroy();
        child.stderr?.destroy();
        child.unref();
        resolve(m[0]);
      }
    });
    child.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

function updateWranglerToml(newUpstreamUrl) {
  let content = fs.readFileSync(WRANGLER_TOML, 'utf8');
  if (!UPSTREAM_URL_REGEX.test(content)) {
    throw new Error('Không tìm thấy UPSTREAM_URL trong wrangler.toml');
  }
  content = content.replace(UPSTREAM_URL_REGEX, `$1"${newUpstreamUrl}"`);
  fs.writeFileSync(WRANGLER_TOML, content, 'utf8');
  console.log('Đã cập nhật wrangler.toml: UPSTREAM_URL =', newUpstreamUrl);
}

async function main() {
  console.log('Project root:', PROJECT_ROOT);
  console.log('cloudflared:', CLOUDFLARED_EXE);

  try {
    // 1. Pull
    log('1/4', 'Pull code mới nhất từ GitHub');
    run('git pull');
  } catch (e) {
    console.error('Lỗi git pull:', e.message);
    process.exit(1);
  }

  // 2. Start dev (detached)
  log('2/4', 'Khởi động NestJS (start:dev)');
  const dev = spawn('npm', ['run', 'start:dev'], {
    cwd: PROJECT_ROOT,
    detached: true,
    stdio: 'ignore',
    shell: true,
  });
  dev.unref();
  console.log('Đã mở process start:dev (chạy nền). Đợi ~20s...');
  await sleep(20000);

  // 3. Cloudflare Tunnel + bắt URL
  log('3/4', 'Chạy Cloudflare Tunnel và bắt URL');
  let tunnelUrl;
  try {
    tunnelUrl = await captureTunnelUrl(35000);
    console.log('Tunnel URL:', tunnelUrl);
  } catch (e) {
    console.error('Lỗi tunnel:', e.message);
    process.exit(1);
  }

  // Cập nhật wrangler.toml
  try {
    updateWranglerToml(tunnelUrl);
  } catch (e) {
    console.error('Lỗi cập nhật wrangler.toml:', e.message);
    process.exit(1);
  }

  // 4. Deploy
  log('4/4', 'Deploy lên Cloudflare Workers');
  const deployResult = spawnSync('npx', ['wrangler', 'deploy'], {
    cwd: PROJECT_ROOT,
    stdio: 'inherit',
    shell: true,
  });
  if (deployResult.status !== 0) {
    console.error('wrangler deploy kết thúc với mã lỗi:', deployResult.status);
  }

  console.log('\n========================================');
  console.log('Hoàn tất. NestJS và Tunnel vẫn chạy nền.');
  console.log('Swagger qua Worker: https://o2o-backend-gateway.o2ocare-sys.workers.dev/api/docs');
  console.log('========================================\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
