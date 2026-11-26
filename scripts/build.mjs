import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(projectRoot, "index.html");
const envPath = path.join(projectRoot, ".env");
const outputDirectory = path.join(projectRoot, "dist");
const outputPath = path.join(outputDirectory, "index.html");

function parseEnvFile(contents) {
  const values = {};

  for (const line of contents.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match || match[1].startsWith("#")) continue;
    values[match[1]] = match[2].replace(/^(['"])(.*)\1$/, "$2");
  }

  return values;
}

let fileEnv = {};
try {
  fileEnv = parseEnvFile(await readFile(envPath, "utf8"));
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

const env = { ...fileEnv, ...process.env };
const requiredVariables = [
  "FIREBASE_API_KEY",
  "FIREBASE_AUTH_DOMAIN",
  "FIREBASE_PROJECT_ID",
  "FIREBASE_STORAGE_BUCKET",
  "FIREBASE_MESSAGING_SENDER_ID",
  "FIREBASE_APP_ID"
];
const missingVariables = requiredVariables.filter((name) => !env[name]);

if (missingVariables.length > 0) {
  throw new Error(`Missing Firebase environment variables: ${missingVariables.join(", ")}`);
}

const firebaseConfig = {
  apiKey: env.FIREBASE_API_KEY,
  authDomain: env.FIREBASE_AUTH_DOMAIN,
  projectId: env.FIREBASE_PROJECT_ID,
  storageBucket: env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID,
  appId: env.FIREBASE_APP_ID
};

if (env.FIREBASE_MEASUREMENT_ID) {
  firebaseConfig.measurementId = env.FIREBASE_MEASUREMENT_ID;
}

const source = await readFile(sourcePath, "utf8");
const configMarker = "window.__EMBEDDED_FIREBASE_CONFIG__ = null;";

if (!source.includes(configMarker)) {
  throw new Error("Firebase config marker was not found in index.html.");
}

const output = source.replace(
  configMarker,
  `window.__EMBEDDED_FIREBASE_CONFIG__ = ${JSON.stringify(firebaseConfig)};`
);

await mkdir(outputDirectory, { recursive: true });
await writeFile(outputPath, output);
console.log(`Built ${path.relative(projectRoot, outputPath)} with Firebase config.`);
