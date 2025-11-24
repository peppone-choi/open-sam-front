#!/bin/bash

echo "=== Dynamic Imports Verification ==="
echo ""

echo "1. Checking lazy loader files..."
for file in \
  "src/lib/three/loader.ts" \
  "src/lib/tactical/threeTacticalMap.lazy.ts" \
  "src/lib/tactical/pixiTacticalMap.lazy.ts"
do
  if [ -f "$file" ]; then
    echo "  ✅ $file"
  else
    echo "  ❌ Missing: $file"
  fi
done

echo ""
echo "2. Checking dynamic component wrappers..."
for file in \
  "src/components/battle/ThreeBattleMap.dynamic.tsx" \
  "src/components/battle/ThreeBattleMap.lazy.tsx" \
  "src/components/battle/ThreeTacticalMap.dynamic.tsx" \
  "src/components/battle/ThreeTacticalMap.lazy.tsx" \
  "src/components/logh/TacticalMap.dynamic.tsx"
do
  if [ -f "$file" ]; then
    echo "  ✅ $file"
  else
    echo "  ❌ Missing: $file"
  fi
done

echo ""
echo "3. Checking updated components..."
echo -n "  TacticalMapPanel.tsx: "
if grep -q "createThreeTacticalMapEngine" src/components/game/TacticalMapPanel.tsx; then
  echo "✅ Uses lazy loading"
else
  echo "❌ Not using lazy loading"
fi

echo -n "  Gin7TacticalPrototype.tsx: "
if grep -q "createPixiTacticalMapEngine" src/components/gin7/Gin7TacticalPrototype.tsx; then
  echo "✅ Uses lazy loading"
else
  echo "❌ Not using lazy loading"
fi

echo ""
echo "4. Checking for direct Three.js imports (should be minimal)..."
direct_imports=$(grep -r "from 'three'" src/components --include="*.tsx" --include="*.ts" | grep -v ".lazy.tsx" | grep -v ".dynamic.tsx" | grep -v "node_modules" | wc -l)
echo "  Found $direct_imports direct imports in components"
if [ "$direct_imports" -lt 5 ]; then
  echo "  ✅ Good - most imports are lazy loaded"
else
  echo "  ⚠️  Many direct imports still exist"
fi

echo ""
echo "5. Checking for direct Pixi.js imports (should be minimal)..."
pixi_imports=$(grep -r "from 'pixi.js'" src/components --include="*.tsx" --include="*.ts" | grep -v ".lazy.tsx" | grep -v ".dynamic.tsx" | grep -v "node_modules" | wc -l)
echo "  Found $pixi_imports direct imports in components"
if [ "$pixi_imports" -lt 5 ]; then
  echo "  ✅ Good - most imports are lazy loaded"
else
  echo "  ⚠️  Many direct imports still exist"
fi

echo ""
echo "=== Verification Complete ==="
