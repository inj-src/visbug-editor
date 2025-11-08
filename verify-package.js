#!/usr/bin/env node
/**
 * Package verification script
 * Run before publishing to verify package structure
 */

const fs = require("fs");
const path = require("path");

const packageRoot = __dirname;
const errors = [];
const warnings = [];

console.log("🔍 Verifying visbug-editor package...\n");

// Check required files exist
const requiredFiles = [
  "package.json",
  "README.md",
  "LICENSE",
  "types/index.d.ts",
  "dist/visbug-editor.esm.js",
  "dist/visbug-editor.browser.js",
  "dist/visbug-editor.cjs.js",
  "dist/visbug-editor.umd.js",
];

console.log("📁 Checking required files...");
requiredFiles.forEach((file) => {
  const filePath = path.join(packageRoot, file);
  if (!fs.existsSync(filePath)) {
    errors.push(`Missing required file: ${file}`);
    console.log(`  ❌ ${file}`);
  } else {
    console.log(`  ✅ ${file}`);
  }
});

// Check package.json structure
console.log("\n📦 Checking package.json...");
const packageJson = require("./package.json");

const requiredFields = ["name", "version", "description", "main", "module", "types", "license"];
requiredFields.forEach((field) => {
  if (!packageJson[field]) {
    errors.push(`Missing required package.json field: ${field}`);
    console.log(`  ❌ ${field}`);
  } else {
    console.log(`  ✅ ${field}: ${packageJson[field]}`);
  }
});

// Check exports field
if (!packageJson.exports) {
  warnings.push('Missing "exports" field in package.json (modern Node.js feature)');
  console.log("  ⚠️  exports field missing");
} else {
  console.log("  ✅ exports field present");
}

// Check keywords
if (!packageJson.keywords || packageJson.keywords.length === 0) {
  warnings.push("No keywords defined (affects npm discoverability)");
  console.log("  ⚠️  No keywords");
} else {
  console.log(`  ✅ ${packageJson.keywords.length} keywords`);
}

// Check files array
if (!packageJson.files || packageJson.files.length === 0) {
  errors.push("No files array in package.json");
  console.log("  ❌ files array missing");
} else {
  console.log(`  ✅ files: ${packageJson.files.join(", ")}`);
}

// Check TypeScript definitions
console.log("\n📘 Checking TypeScript definitions...");
const typesPath = path.join(packageRoot, "types", "index.d.ts");
if (fs.existsSync(typesPath)) {
  const typesContent = fs.readFileSync(typesPath, "utf8");

  // Check for key exports
  const exports = ["VisBugEditor", "HistoryManager", "utilities"];
  exports.forEach((exp) => {
    if (
      typesContent.includes(`export class ${exp}`) ||
      typesContent.includes(`export namespace ${exp}`) ||
      typesContent.includes(`export const ${exp}`)
    ) {
      console.log(`  ✅ ${exp} exported`);
    } else {
      warnings.push(`${exp} might not be properly exported in types`);
      console.log(`  ⚠️  ${exp} export unclear`);
    }
  });
} else {
  console.log("  ❌ TypeScript definitions file not found");
}

// Check bundle sizes
console.log("\n📊 Bundle sizes...");
const distFiles = [
  "dist/visbug-editor.esm.js",
  "dist/visbug-editor.browser.js",
  "dist/visbug-editor.cjs.js",
  "dist/visbug-editor.umd.js",
];

distFiles.forEach((file) => {
  const filePath = path.join(packageRoot, file);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    console.log(`  📦 ${file}: ${sizeKB} KB`);

    if (stats.size > 1024 * 1024) {
      // > 1MB
      warnings.push(`${file} is larger than 1MB (${sizeKB} KB)`);
    }
  }
});

// Check for common issues
console.log("\n🔍 Checking for common issues...");

// Check if node_modules exists (shouldn't be published)
if (fs.existsSync(path.join(packageRoot, "dist", "node_modules"))) {
  errors.push("node_modules found in dist/ directory!");
  console.log("  ❌ node_modules in dist/");
} else {
  console.log("  ✅ No node_modules in dist/");
}

// Check if .npmignore or .gitignore exists
if (fs.existsSync(path.join(packageRoot, ".npmignore"))) {
  console.log("  ✅ .npmignore exists");
} else if (fs.existsSync(path.join(packageRoot, ".gitignore"))) {
  console.log("  ⚠️  Using .gitignore (consider .npmignore)");
  warnings.push("No .npmignore file (will use .gitignore rules)");
} else {
  warnings.push("No .npmignore or .gitignore file");
  console.log("  ⚠️  No ignore files");
}

// Summary
console.log("\n" + "=".repeat(50));
console.log("📋 VERIFICATION SUMMARY");
console.log("=".repeat(50));

if (errors.length === 0 && warnings.length === 0) {
  console.log("\n✅ All checks passed! Package is ready to publish.\n");
  console.log("To publish, run:");
  console.log("  npm publish\n");
  console.log("Or for a dry run:");
  console.log("  npm publish --dry-run\n");
  process.exit(0);
} else {
  if (errors.length > 0) {
    console.log("\n❌ ERRORS:");
    errors.forEach((err) => console.log(`  • ${err}`));
  }

  if (warnings.length > 0) {
    console.log("\n⚠️  WARNINGS:");
    warnings.forEach((warn) => console.log(`  • ${warn}`));
  }

  if (errors.length > 0) {
    console.log("\n❌ Fix errors before publishing!\n");
    process.exit(1);
  } else {
    console.log("\n⚠️  Review warnings, but package can be published.\n");
    process.exit(0);
  }
}
