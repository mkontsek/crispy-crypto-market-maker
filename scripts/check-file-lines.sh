#!/bin/bash
# Check that source files don't exceed maximum line count
# Usage: ./scripts/check-file-lines.sh [max_lines]

MAX_LINES=${1:-300}
EXIT_CODE=0

echo "Checking for files exceeding ${MAX_LINES} lines..."

# Check Rust files
while IFS= read -r -d '' file; do
    line_count=$(wc -l < "$file")
    if [ "$line_count" -gt "$MAX_LINES" ]; then
        echo "❌ $file: ${line_count} lines (max: ${MAX_LINES})"
        EXIT_CODE=1
    fi
done < <(find apps packages -type f -name "*.rs" ! -path "*/target/*" ! -path "*/tests/*" ! -name "*_test.rs" ! -name "*_tests.rs" -print0)

# Check TypeScript/JavaScript files
while IFS= read -r -d '' file; do
    line_count=$(wc -l < "$file")
    if [ "$line_count" -gt "$MAX_LINES" ]; then
        echo "❌ $file: ${line_count} lines (max: ${MAX_LINES})"
        EXIT_CODE=1
    fi
done < <(find apps packages -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) ! -path "*/node_modules/*" ! -path "*/.next/*" ! -path "*/dist/*" ! -path "*/tests/*" ! -path "*/__tests__/*" ! -name "*.test.ts" ! -name "*.test.tsx" ! -name "*.test.js" ! -name "*.test.jsx" ! -name "*.spec.ts" ! -name "*.spec.tsx" ! -name "*.spec.js" ! -name "*.spec.jsx" ! -name "*.stories.ts" ! -name "*.stories.tsx" ! -name "*.stories.js" ! -name "*.stories.jsx" -print0)

if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ All files are within the ${MAX_LINES} line limit"
fi

exit $EXIT_CODE

