/**
 * Yerel geliştirme veritabanı — gerçek PostgreSQL, gömülü.
 *
 * `prisma dev` sunucusu Windows'ta çok sayıda eşzamanlı bağlantı altında
 * (özellikle `next build` işçileri) bağlantıları düşürüyordu. Bunun yerine
 * `.devdb/` altında gerçek bir PostgreSQL çalıştırıyoruz.
 *
 * Sunucu `pg_ctl` ile başlatılır: bu betik bittikten sonra da ayakta kalır,
 * node sürecine bağlı değildir.
 *
 * Yayında bunun yerine Neon kullanılacak; bu betik sadece yereldir.
 *
 *   npm run db:start    başlat (ilk çalıştırmada PostgreSQL'i indirir)
 *   npm run db:stop     durdur
 *   npm run db:status   durum
 */

import { execFileSync, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import EmbeddedPostgres from "embedded-postgres";

const ROOT = resolve(import.meta.dirname, "..");
const DATA_DIR = resolve(ROOT, ".devdb");
const LOG_FILE = resolve(ROOT, ".devdb", "server.log");
const PORT = 55432;
const USER = "champ";
const PASSWORD = "champ";
const DATABASE = "thechamp";

const BIN = resolve(
  ROOT,
  "node_modules/@embedded-postgres",
  process.platform === "win32" ? "windows-x64" : `${process.platform}-x64`,
  "native/bin",
);

const exe = (name: string) =>
  resolve(BIN, process.platform === "win32" ? `${name}.exe` : name);

export const DEV_DATABASE_URL = `postgresql://${USER}:${PASSWORD}@127.0.0.1:${PORT}/${DATABASE}?schema=public&connection_limit=5`;

function pgCtl(args: string[], quiet = false): number {
  const result = spawnSync(exe("pg_ctl"), ["-D", DATA_DIR, ...args], {
    stdio: quiet ? "pipe" : "inherit",
    encoding: "utf8",
  });
  return result.status ?? 1;
}

function isRunning(): boolean {
  return pgCtl(["status"], true) === 0;
}

/** Veri dizini yoksa initdb çalıştırır (PostgreSQL binary'sini de indirir). */
async function ensureInitialised() {
  if (existsSync(resolve(DATA_DIR, "PG_VERSION"))) return;

  console.log("• ilk kurulum: PostgreSQL indiriliyor…");
  await mkdir(DATA_DIR, { recursive: true });

  const pg = new EmbeddedPostgres({
    databaseDir: DATA_DIR,
    user: USER,
    password: PASSWORD,
    port: PORT,
    persistent: true,
    // Windows sistem locale'i ("Turkish_Türkiye.1254") ASCII olmayan karakter
    // içeriyor ve initdb bunu reddediyor; C locale + UTF8 ile kuruyoruz.
    initdbFlags: ["--locale=C", "--encoding=UTF8"],
  });
  await pg.initialise();
  console.log("✓ veri dizini hazırlandı");
}

function createDatabaseIfMissing() {
  const psql = exe("psql");
  const conn = ["-h", "127.0.0.1", "-p", String(PORT), "-U", USER, "-d", "postgres"];
  const env = { ...process.env, PGPASSWORD: PASSWORD };

  const exists = spawnSync(
    psql,
    [...conn, "-tAc", `SELECT 1 FROM pg_database WHERE datname='${DATABASE}'`],
    { encoding: "utf8", env },
  );

  if (exists.stdout?.trim() === "1") return;

  execFileSync(psql, [...conn, "-c", `CREATE DATABASE ${DATABASE}`], { env, stdio: "pipe" });
  console.log(`✓ "${DATABASE}" veritabanı oluşturuldu`);
}

async function main() {
  const command = process.argv[2] ?? "start";

  if (command === "stop") {
    if (!isRunning()) {
      console.log("• zaten çalışmıyor");
      return;
    }
    pgCtl(["-m", "fast", "stop"]);
    console.log("✓ yerel veritabanı durduruldu");
    return;
  }

  if (command === "status") {
    console.log(isRunning() ? "✓ çalışıyor" : "• çalışmıyor");
    return;
  }

  await ensureInitialised();

  if (isRunning()) {
    console.log("• zaten çalışıyor");
  } else {
    const code = pgCtl(["-l", LOG_FILE, "-o", `-p ${PORT}`, "-w", "start"]);
    if (code !== 0) {
      console.error(`✗ başlatılamadı. Log: ${LOG_FILE}`);
      process.exit(1);
    }
    console.log("✓ yerel PostgreSQL başlatıldı");
  }

  createDatabaseIfMissing();

  console.log(`\n  DATABASE_URL="${DEV_DATABASE_URL}"`);
  console.log("  durdurmak için: npm run db:stop");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
