#!/bin/bash -e
#
# Documentation Site Audit Script
# Purpose: Identify documentation issues before deployment
#
# Usage: ./scripts/docs-audit.sh
# Exit on error: yes


set -e

echo "🔍 Starting Documentation Audit..."
echo "=================================="

# Configuration
DOCS_DIR="docs_site"
IMAGES_DIR="$DOCS_DIR/images"
CONFIG_FILE="$DOCS_DIR/.vitepress/config.mts"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
ISSUES_FOUND=0
WARNINGS_FOUND=0

# Function to echo color output
error() {
    echo -e "${RED}❌ ERROR${NC}: $1"
    ((ISSUES_FOUND++))
}

warn() {
    echo -e "${YELLOW}⚠️  WARNING${NC}: $1"
    ((WARNINGS_FOUND++))
}

info() {
    echo -e "${GREEN}✓${NC} $1"
}

# Check if docs directory exists
if [ ! -d "$DOCS_DIR" ]; then
    error "Documentation directory '$DOCS_DIR' not found"
    exit 1
fi

echo ""
echo "📁 Checking Documentation Structure..."
echo "--------------------------------------"

# 1. Check config file exists
if [ ! -f "$CONFIG_FILE" ]; then
    error "Config file '$CONFIG_FILE' not found"
else
    info "Config file found: $CONFIG_FILE"
fi

# 2. Find all markdown files
MD_FILES=$(find "$DOCS_DIR" -name "*.md" -type f | grep -v node_modules | grep -v ".vitepress")
MD_COUNT=$(echo "$MD_FILES" | wc -l)
info "Found $MD_COUNT markdown documentation files"

# 3. Find all image files
IMG_FILES=$(find "$IMAGES_DIR" -type f 2>/dev/null || true)
IMG_COUNT=$(echo "$IMG_FILES" | grep -c . || echo "0")
info "Found $IMG_COUNT image assets in $IMAGES_DIR"

echo ""
echo "🔍 Analyzing Content Issues..."
echo "--------------------------------------"

# 4. Check for broken links
echo "Checking for broken links..."
for md_file in $MD_FILES; do
    # Extract links using grep
    links=$(grep -oE '\[(?:[^\]]+)\]\(/[^)]+\)' "$md_file" 2>/dev/null || true)
    
    if [ -n "$links" ]; then
        target_files=$(echo "$links" | sed 's/.*\]\([^)]*\)/\1/' | cut -d' ' -f1)
        
        for target in $target_files; do
            # Resolve relative path
            target_path=$(dirname "$md_file")/$target
            base_file="${target#$DOCS_DIR/}"
            
            # Check if file exists
            if [ ! -f "$DOCS_DIR/$base_file" ]; then
                error "Broken link in $(basename $md_file): $target -> $(basename $base_file) does not exist"
            fi
        done
    fi
done

info "Link checking complete"

# 5. Check for missing image references
echo "Checking for orphaned images..."
for img_file in $IMG_FILES; do
    img_name=$(basename "$img_file")
    
    # Check if image is referenced in any markdown
    if ! grep -r "$img_name" "$DOCS_DIR" --include="*.md" 2>/dev/null; then
        warn "Orphaned image not referenced: $img_name"
    fi
done

info "Image orphans checked"

# 6. Check for code blocks without language specifiers
echo "Checking for unlabeled code blocks..."
for md_file in $MD_FILES; do
    # Check for code blocks without language
    unlabeled=$(grep -P '^(\s*`{3,})(?!\w)' "$md_file" 2>/dev/null || true)
    
    if [ -n "$unlabeled" ]; then
        warn "Code block without language in $(basename $md_file): $(grep -n "\`\`\`" "$md_file" 2>/dev/null | head -1)"
    fi
done

info "Code block validation complete"

# 7. Check for proper front matter
echo "Checking for proper front matter..."
for md_file in $MD_FILES; do
    # Skip index.md as it might have different format
    if [ "$(basename $md_file)" != "index.md" ]; then
        # Check if file starts with front matter
        if ! head -1 "$md_file" | grep -q '^---$'; then
            warn "Missing front matter in $(basename $md_file)"
        fi
    fi
done

info "Front matter validation complete"

# 8. Check for trailing whitespace
echo "Checking for trailing whitespace..."
for md_file in $MD_FILES; do
    if grep -q ' $' "$md_file" 2>/dev/null; then
        lines=$(grep -n ' $' "$md_file" 2>/dev/null | wc -l)
        warn "Trailing whitespace in $(basename $md_file): $lines lines affected"
    fi
done

info "Whitespace check complete"

# 9. Check navigation configuration
echo "Checking navigation configuration..."
if [ -f "$CONFIG_FILE" ]; then
    # Check if sidebar entries match markdown files
    sidebar_files=$(grep -oP 'link": "/[^"+]+' "$CONFIG_FILE" 2>/dev/null | sed 's/link": "\///' || true)
    
    md_files=$(find "$DOCS_DIR" -name "*.md" -type f | grep -v node_modules | grep -v ".vitepress" | grep -v "index.md" | sed 's|^.*/||' | sed 's/.md$//')
    
    for file in $md_files; do
        # Check if file is referenced in sidebar
        if ! echo "$sidebar_files" | grep -q "/$file"; then
            warn "Documentation page not in navigation: $file.md"
        fi
    done
fi

info "Navigation consistency checked"

# 10. Check for build warnings
echo "Running VitePress build check..."
if command -v npm >/dev/null 2>&1; then
    cd "$DOCS_DIR"
    
    # Try to build
    if npm run docs:build >/dev/null 2>&1; then
        info "VitePress build successful"
    else
        warn "VitePress build has issues or failed"
    fi
    cd - >/dev/null
else
    warn "npm not available, skipping build check"
fi

echo ""
echo "=================================="
echo "📊 AUDIT SUMMARY"
echo "=================================="
echo "Files analyzed: $MD_COUNT"
echo "Images checked: $IMG_COUNT"
echo -e "Errors found:   ${RED}$ISSUES_FOUND${NC}"
echo -e "Warnings found: ${YELLOW}$WARNINGS_FOUND${NC}"
echo "=================================="

if [ $ISSUES_FOUND -gt 0 ]; then
    echo -e "${RED}❌ ISSUES DETECTED - Please fix before deploying!${NC}"
    exit 1
elif [ $WARNINGS_FOUND -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Warnings detected - Review them before deploying${NC}"
    exit 0
else
    echo -e "${GREEN}✓ All checks passed! Ready to deploy.${NC}"
    exit 0
fi
