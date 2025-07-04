#!/bin/bash
# Release script for Pika Chart Card (Lovelace card)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_error() {
    echo -e "${RED}Error: $1${NC}"
}

print_success() {
    echo -e "${GREEN}$1${NC}"
}

print_info() {
    echo -e "${YELLOW}$1${NC}"
}

print_debug() {
    echo -e "${BLUE}$1${NC}"
}

# Check if version argument is provided
if [ -z "$1" ]; then
    print_error "Version number required"
    echo "Usage: $0 <version>"
    echo "Example: $0 1.2.3"
    echo "Example: $0 1.2.3-beta.1"
    exit 1
fi

VERSION=$1

# Validate version format
if ! [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?$ ]]; then
    print_error "Invalid version format"
    echo "Version must be in format X.Y.Z or X.Y.Z-suffix"
    exit 1
fi

# Check if package.json exists
if [ ! -f "package.json" ]; then
    print_error "package.json not found"
    print_info "Are you in the root directory of the project?"
    exit 1
fi

# Get project info from package.json
PROJECT_NAME=$(node -p "require('./package.json').name" 2>/dev/null)
if [ -z "$PROJECT_NAME" ]; then
    print_error "Could not read project name from package.json"
    exit 1
fi

DISPLAY_NAME="Pika Chart Card"

print_info "Project: $DISPLAY_NAME"
print_info "Package: $PROJECT_NAME"
print_info "Version: $VERSION"
echo

# Check if git is available
if ! command -v git &> /dev/null; then
    print_error "Git is not installed or not in PATH"
    exit 1
fi

# Check if node is available
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed or not in PATH"
    exit 1
fi

# Check if npm is available
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed or not in PATH"
    exit 1
fi

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_error "Not in a git repository"
    exit 1
fi

# Check if git is clean
if [ -n "$(git status --porcelain)" ]; then
    print_error "Working directory is not clean. Please commit or stash changes."
    git status --short
    exit 1
fi

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
print_debug "Current branch: $CURRENT_BRANCH"

if [ "$CURRENT_BRANCH" != "main" ] && [ "$CURRENT_BRANCH" != "master" ]; then
    print_info "Warning: You're not on the main/master branch (current: $CURRENT_BRANCH)"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check if tag already exists
if git tag -l | grep -q "^v$VERSION$"; then
    print_error "Tag v$VERSION already exists"
    exit 1
fi

# Update package.json version
print_info "Updating package.json to version $VERSION..."

# Create backup
cp package.json package.json.bak

# Update version using npm version (doesn't create git tag with --no-git-tag-version)
if ! npm version "$VERSION" --no-git-tag-version > /dev/null 2>&1; then
    print_error "Failed to update version in package.json"
    mv package.json.bak package.json
    exit 1
fi

# Remove backup
rm package.json.bak

# Show the change
print_info "Updated package.json:"
grep '"version"' package.json | head -1

# Run build to ensure everything compiles
print_info "Running build to verify everything compiles..."
if ! npm run build; then
    print_error "Build failed! Please fix errors before releasing."
    # Restore original package.json
    git checkout package.json
    exit 1
fi

print_success "✓ Build successful"

# Commit the change
print_info "Committing version bump..."
git add package.json package-lock.json
git commit -m "Bump version to $VERSION"

# Create tag
print_info "Creating tag v$VERSION..."
git tag -a "v$VERSION" -m "Release $DISPLAY_NAME version $VERSION"

# Show what will be pushed
echo
print_info "Ready to push:"
print_debug "  Commit: $(git log -1 --oneline)"
print_debug "  Tag: v$VERSION"
print_debug "  Branch: $CURRENT_BRANCH"

# Confirm push
read -p "Push changes and tag to remote? (Y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Nn]$ ]]; then
    print_info "Changes committed locally but not pushed."
    print_info "To push later, run:"
    echo "  git push origin $CURRENT_BRANCH"
    echo "  git push origin v$VERSION"
    exit 0
fi

# Push changes and tag
print_info "Pushing to remote..."
if git push origin "$CURRENT_BRANCH"; then
    print_success "✓ Pushed commits to $CURRENT_BRANCH"
else
    print_error "Failed to push commits"
    exit 1
fi

if git push origin "v$VERSION"; then
    print_success "✓ Pushed tag v$VERSION"
else
    print_error "Failed to push tag"
    exit 1
fi

echo
print_success "🚀 Version $VERSION has been released!"
print_info "Project: $DISPLAY_NAME"
print_info "Tag: v$VERSION"
echo
print_info "GitHub Actions will now:"
print_info "  1. Build the TypeScript code"
print_info "  2. Validate with HACS"
print_info "  3. Create a GitHub release with the built JS file"
echo
print_info "Check the Actions tab in your repository to monitor progress:"
print_debug "  https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\([^/]*\/[^/]*\).*/\1/' | sed 's/\.git$//')/actions"