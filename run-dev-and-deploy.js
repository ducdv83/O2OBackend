/**
 * Chạy lần lượt: start:dev → Cloudflare Tunnel (bắt URL) → cập nhật wrangler.toml → deploy.
 * Chạy: node run-dev-and-deploy.js
 * (Cần Node >= 18)
 */

const { spawn, spawnSync, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = process.cwd();
const WRANGLER_TOML = path.join(PROJECT_ROOT, 'wrangler.toml');
const CLOUDFLARED_EXE = process.env.CLOUDFLARED_EXE || 'E:\\Datnd15\\Tool\\cloudflared.exe';
// URL quick tunnel (cloudflared có thể in ra stdout hoặc stderr)
const TUNNEL_URL_REGEX = /https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/g;
const UPSTREAM_URL_REGEX = /(UPSTREAM_URL\s*=\s*)"[^"]*"/;

const PREFIX_DEV = '[NestJS]';

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

function captureTunnelUrl(timeoutMs = 45000) {
  return new Promise((resolve, reject) => {
    console.log('Đang chạy cloudflared (đọc cả stdout + stderr)...');
    const child = spawn(CLOUDFLARED_EXE, ['tunnel', '--url', 'http://localhost:3000'], {
      cwd: PROJECT_ROOT,
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
      windowsHide: true,
    });

    let buffer = '';

    function tryResolve() {
      const m = buffer.match(TUNNEL_URL_REGEX);
      if (m && m[0]) {
        clearTimeout(timer);
        child.stdout?.destroy();
        child.stderr?.destroy();
        child.unref();
        resolve(m[0]);
      }
    }

    const timer = setTimeout(() => {
      child.stdout?.destroy();
      child.stderr?.destroy();
      child.unref();
      const m = buffer.match(TUNNEL_URL_REGEX);
      if (m && m[0]) return resolve(m[0]);
      console.error('--- Output từ cloudflared (stdout + stderr) ---');
      console.error(buffer || '(rỗng)');
      console.error('--- Kết thúc ---');
      reject(new Error('Timeout: không bắt được URL tunnel trong ' + timeoutMs + 'ms. Kiểm tra cloudflared có chạy đúng và in ra URL dạng https://xxx.trycloudflare.com'));
    }, timeoutMs);

    child.stdout?.on('data', (chunk) => {
      const s = chunk.toString();
      buffer += s;
      process.stdout.write(s);
      tryResolve();
    });
    child.stderr?.on('data', (chunk) => {
      const s = chunk.toString();
      buffer += s;
      process.stderr.write(s);
      tryResolve();
    });
    child.on('error', (err) => {
      clearTimeout(timer);
      console.error('Lỗi spawn cloudflared:', err.message);
      reject(err);
    });
    child.on('exit', (code, signal) => {
      if (code !== 0 && code !== null) {
        console.error('cloudflared thoát với code:', code, 'signal:', signal);
      }
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

  // 1. Start dev (không mở cửa sổ, log ra cùng console có prefix; process chạy nền)
  log('1/3', 'Khởi động NestJS (start:dev)');
  const dev = spawn('npm', ['run', 'start:dev'], {
    cwd: PROJECT_ROOT,
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
    windowsHide: true,
  });
  dev.stdout.setEncoding('utf8');
  dev.stderr.setEncoding('utf8');
  dev.stdout.on('data', (chunk) => {
    String(chunk).split(/\r?\n/).filter(Boolean).forEach((line) => console.log(`${PREFIX_DEV} ${line}`));
  });
  dev.stderr.on('data', (chunk) => {
    String(chunk).split(/\r?\n/).filter(Boolean).forEach((line) => console.log(`${PREFIX_DEV} ${line}`));
  });
  dev.on('error', (err) => console.error(PREFIX_DEV, 'Lỗi:', err.message));
  dev.unref();
  console.log('Đã khởi động start:dev (log bên dưới). Đợi ~20s...');
  await sleep(20000);

  // 2. Cloudflare Tunnel + bắt URL
  log('2/3', 'Chạy Cloudflare Tunnel và bắt URL');
  if (!fs.existsSync(CLOUDFLARED_EXE)) {
    console.error('Không tìm thấy cloudflared tại:', CLOUDFLARED_EXE);
    console.error('Sửa CLOUDFLARED_EXE trong script hoặc set biến môi trường CLOUDFLARED_EXE.');
    process.exit(1);
  }
  let tunnelUrl;
  try {
    tunnelUrl = await captureTunnelUrl(45000);
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

  // 3. Deploy
  log('3/3', 'Deploy lên Cloudflare Workers');
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
