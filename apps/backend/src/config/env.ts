try {
  process.loadEnvFile();
} catch {
  // In production environments (Docker/Render/Railway), env vars are provided directly via process.env
}

export {};

