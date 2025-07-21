import { resolve } from "path";
import { existsSync, readdirSync, readFileSync, statSync } from "fs";

const rootDirs = ["src/app", "src/components", "src/hooks"]
  .map((folder) => resolve(folder))
  .filter(existsSync); // ✅ Adjust this if needed
const searchTerm = "useSearchParams";

function scanDir(dirPath: string): string[] {
  const entries = readdirSync(dirPath);
  return entries.flatMap((entry) => {
    const fullPath = resolve(dirPath, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      return scanDir(fullPath);
    } else if (stat.isFile() && fullPath.endsWith(".tsx")) {
      return [fullPath];
    }
    return [];
  });
}

function isSafe(content: string): boolean {
  const isClient =
    content.includes('"use client"') || content.includes("'use client'");
  const dynamicImport = content.includes("ssr: false");
  const suspense =
    content.includes("<Suspense") || content.includes("React.Suspense");
  const inEffect = content.includes("useEffect");

  return isClient || dynamicImport || suspense || inEffect;
}

console.log("🔍 Scanning for unsafe useSearchParams()...");

const tsxFiles = rootDirs.flatMap(scanDir);
const unsafeUsages: string[] = [];

tsxFiles.forEach((filePath) => {
  const content = readFileSync(filePath, "utf-8");

  if (content.includes(searchTerm)) {
    if (!isSafe(content)) {
      unsafeUsages.push(filePath);
      console.log("🚨 Possibly unsafe:", filePath);
    }
  }
});

if (unsafeUsages.length === 0) {
  console.log("✅ All useSearchParams() usages appear safe.");
} else {
  console.log(`❗ Found ${unsafeUsages.length} potentially unsafe file(s).`);
}
