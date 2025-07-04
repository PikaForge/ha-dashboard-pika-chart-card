# Release Scripts

This directory contains scripts to help with releasing new versions of the Pika Chart Card.

## release.sh

A script to automate the release process for this Lovelace card.

### What it does:
1. Validates the version format
2. Checks that the git repository is clean
3. Updates the version in `package.json`
4. Runs the build to ensure everything compiles
5. Commits the version change
6. Creates a git tag
7. Pushes the changes and tag to GitHub
8. Triggers GitHub Actions to create the release

### Usage:
```bash
./scripts/release.sh <version>
```

### Examples:
```bash
# Regular release
./scripts/release.sh 1.2.3

# Pre-release
./scripts/release.sh 1.2.3-beta.1
```

### Requirements:
- Git
- Node.js and npm
- Clean working directory
- Push access to the repository

### GitHub Actions:
After pushing the tag, GitHub Actions will automatically:
1. Build the TypeScript code
2. Validate with HACS
3. Create a GitHub release with:
   - The built `pika-chart-card.js` file
   - Installation instructions
   - Changelog from git commits

## Version Format

Versions should follow semantic versioning:
- `MAJOR.MINOR.PATCH` for stable releases (e.g., `1.2.3`)
- `MAJOR.MINOR.PATCH-PRERELEASE` for pre-releases (e.g., `1.2.3-beta.1`, `1.2.3-alpha`, `1.2.3-rc.1`)

Pre-releases (any version containing a dash) will be marked as such in GitHub releases.

## File Structure

Your project should follow this structure:
```
pika-chart-card/
├── src/                  # TypeScript source files
├── dist/                 # Built JavaScript (generated)
├── examples/             # Example configurations
├── scripts/
│   └── release.sh
├── .github/
│   └── workflows/
│       ├── release.yml
│       └── version-bump.yml
├── package.json
├── rollup.config.js
├── tsconfig.json
├── hacs.json
└── README.md
```

## Troubleshooting

### Common Issues

1. **Script not executable**: Run `chmod +x scripts/release.sh`
2. **Build fails**: Fix TypeScript/build errors before releasing
3. **Dirty git state**: Commit or stash changes before running
4. **Missing dependencies**: Run `npm install` first

### Debug Information

The release script provides detailed output including:
- Package name from package.json
- Current git branch and status
- Build status
- Changes being made to package.json
- Confirmation prompts before pushing

If something goes wrong, the script will show clear error messages and stop before making any permanent changes.