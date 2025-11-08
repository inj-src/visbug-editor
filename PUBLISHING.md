# Publishing visbug-editor to npm

This guide walks you through publishing the visbug-editor package to npm.

## Prerequisites

1. **npm Account**: Create one at [npmjs.com](https://www.npmjs.com/signup)
2. **npm CLI**: Comes with Node.js
3. **Authentication**: Login to npm from your terminal

## Step 1: Login to npm

```bash
npm login
```

Enter your:

- Username
- Password
- Email
- Two-factor authentication code (if enabled)

Verify you're logged in:

```bash
npm whoami
```

## Step 2: Verify Package Configuration

Check that `package.json` is properly configured:

```bash
cd visbug-editor
cat package.json
```

Key fields:

- ✅ `name`: "visbug-editor" (must be unique on npm)
- ✅ `version`: "0.1.0" (semantic versioning)
- ✅ `description`: Clear description
- ✅ `main`, `module`, `types`: Entry points defined
- ✅ `files`: Lists what to include in package
- ✅ `keywords`: For discoverability
- ✅ `license`: "Apache-2.0"
- ✅ `repository`: GitHub URL

## Step 3: Build the Package

Run the production build:

```bash
npm run build:prod
```

This will:

1. Bundle all source files
2. Create optimized builds in `dist/`
3. Run via `prepublishOnly` script automatically before publishing

Verify the build output:

```bash
ls dist/
# Should see:
# - visbug-editor.esm.js
# - visbug-editor.browser.js
# - visbug-editor.cjs.js
# - visbug-editor.umd.js
```

## Step 4: Test the Package Locally (Optional but Recommended)

Create a test package:

```bash
npm pack
```

This creates a `.tgz` file (e.g., `visbug-editor-0.1.0.tgz`). Test it in another project:

```bash
cd /path/to/test-project
npm install /path/to/visbug-editor/visbug-editor-0.1.0.tgz
```

Verify it works:

```javascript
import { VisBugEditor } from "visbug-editor";
// Test your code...
```

## Step 5: Check Package Contents

See what will be published:

```bash
npm publish --dry-run
```

This shows all files that will be included. Verify:

- ✅ `dist/` folder is included
- ✅ `types/` folder is included
- ✅ `README.md` is included
- ✅ `LICENSE` is included
- ❌ `src/` is NOT included (build artifacts only)
- ❌ `node_modules/` is NOT included
- ❌ Development files are NOT included

## Step 6: Publish to npm

### First Time Publishing

For first publication as version 0.1.0:

```bash
npm publish
```

### Updating the Package

For subsequent updates, increment the version first:

```bash
# Patch release (0.1.0 -> 0.1.1) - bug fixes
npm version patch

# Minor release (0.1.0 -> 0.2.0) - new features
npm version minor

# Major release (0.1.0 -> 1.0.0) - breaking changes
npm version major
```

Then publish:

```bash
npm publish
```

### Publishing a Pre-release

For beta/alpha versions:

```bash
npm version prerelease --preid=beta
# 0.1.0 -> 0.1.1-beta.0

npm publish --tag beta
```

Users install with:

```bash
npm install visbug-editor@beta
```

## Step 7: Verify Publication

Check your package on npm:

```bash
npm view visbug-editor
```

Visit the package page:

```
https://www.npmjs.com/package/visbug-editor
```

Test installation:

```bash
npm install visbug-editor
```

## Package Scope (Optional)

If "visbug-editor" is already taken, you can publish under a scope:

1. Update `package.json`:

   ```json
   {
     "name": "@your-username/visbug-editor"
   }
   ```

2. Publish as public:
   ```bash
   npm publish --access public
   ```

## Common Issues

### Error: "Package name already exists"

- The name is taken. Choose a different name or use a scope (@username/package)
- Check on npm: https://www.npmjs.com/package/visbug-editor

### Error: "402 Payment Required"

- Scoped packages are private by default
- Add `--access public` flag when publishing

### Error: "ENEEDAUTH"

- You're not logged in
- Run `npm login` again

### Error: "EPUBLISHCONFLICT"

- You've already published this exact version
- Bump the version with `npm version patch/minor/major`

### Large Package Size Warning

- This is expected (~320KB) as it includes dependencies
- The browser will cache it after first load

## Post-Publication Checklist

- ✅ Verify package appears on npmjs.com
- ✅ Test installation in a fresh project
- ✅ Check TypeScript types work
- ✅ Update GitHub repository with npm badge
- ✅ Create GitHub release with version tag
- ✅ Update documentation if needed

## Updating the Package

1. Make your changes
2. Update version: `npm version patch/minor/major`
3. Update CHANGELOG (if you have one)
4. Build: `npm run build:prod`
5. Publish: `npm publish`
6. Create GitHub release tag

## Unpublishing (Use with Caution!)

You can unpublish within 72 hours of publishing:

```bash
# Unpublish a specific version
npm unpublish visbug-editor@0.1.0

# Unpublish entire package (use VERY carefully!)
npm unpublish visbug-editor --force
```

⚠️ **Warning**: Unpublishing can break projects that depend on your package. Only do this for serious issues (security, legal, etc.).

## Resources

- [npm Documentation](https://docs.npmjs.com/)
- [Semantic Versioning](https://semver.org/)
- [npm Package Publishing Best Practices](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
