#!/bin/bash

echo "🔐 Security Verification Script"
echo "================================"
echo ""

# Check 1: .gitignore exists and includes config.js
echo "✓ Checking .gitignore..."
if grep -q "config.js" .gitignore 2>/dev/null; then
    echo "  ✅ config.js is in .gitignore"
else
    echo "  ❌ WARNING: config.js NOT in .gitignore!"
fi

# Check 2: config.js exists locally
echo ""
echo "✓ Checking local config.js..."
if [ -f "config.js" ]; then
    echo "  ✅ config.js exists locally"
else
    echo "  ⚠️  config.js doesn't exist (run: cp config.template.js config.js)"
fi

# Check 3: config.template.js exists
echo ""
echo "✓ Checking config.template.js..."
if [ -f "config.template.js" ]; then
    echo "  ✅ config.template.js exists (for other developers)"
else
    echo "  ❌ WARNING: config.template.js missing!"
fi

# Check 4: config.js is NOT tracked by git
echo ""
echo "✓ Checking git tracking..."
if git ls-files | grep -q "config.js"; then
    echo "  ❌ DANGER: config.js IS TRACKED BY GIT!"
    echo "  Run: git rm --cached config.js"
else
    echo "  ✅ config.js is NOT tracked by git"
fi

# Check 5: config.js is ignored by git
echo ""
echo "✓ Checking git ignore status..."
if git check-ignore -q config.js 2>/dev/null; then
    echo "  ✅ config.js is properly ignored"
else
    echo "  ❌ WARNING: config.js is NOT being ignored!"
fi

# Check 6: API key in index.html
echo ""
echo "✓ Checking index.html..."
if grep -q "window.API_CONFIG?.GOOGLE_API_KEY" index.html; then
    echo "  ✅ index.html loads API key from external config"
else
    echo "  ⚠️  index.html might have hardcoded API key"
fi

echo ""
echo "================================"
echo "Security check complete!"
echo ""
echo "Next steps:"
echo "1. Ensure config.js has your API key"
echo "2. Never commit config.js to git"
echo "3. Only commit: .gitignore, config.template.js, index.html"
echo ""
