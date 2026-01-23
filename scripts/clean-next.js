const fs = require('fs');
const path = require('path');

function rm(targetPath) {
  try {
    fs.rmSync(targetPath, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
    return true;
  } catch (e) {
    // Retry once with a manual walk if rmSync chokes on special entries.
    try {
      if (!fs.existsSync(targetPath)) return true;
      for (const entry of fs.readdirSync(targetPath, { withFileTypes: true })) {
        const full = path.join(targetPath, entry.name);
        if (entry.isDirectory()) rm(full);
        else fs.rmSync(full, { force: true });
      }
      fs.rmdirSync(targetPath);
      return true;
    } catch {
      return false;
    }
  }
}

const nextDir = path.join(process.cwd(), '.next');
if (rm(nextDir)) {
  // eslint-disable-next-line no-console
  console.log('Cleaned .next');
} else {
  // eslint-disable-next-line no-console
  console.warn('Failed to clean .next (continuing)');
}
