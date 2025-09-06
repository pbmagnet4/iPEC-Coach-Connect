#!/bin/bash

# Learning Center Cleanup - Comprehensive Test Execution Script
# This script runs all automated tests to validate the learning center cleanup

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results tracking
TESTS_PASSED=0
TESTS_FAILED=0
TOTAL_TESTS=0

echo -e "${BLUE}🧪 Learning Center Cleanup - Comprehensive Test Suite${NC}"
echo -e "${BLUE}=================================================${NC}"
echo ""

# Function to print section headers
print_section() {
    echo -e "${BLUE}📋 $1${NC}"
    echo -e "${BLUE}$(printf '=%.0s' {1..50})${NC}"
}

# Function to handle test results
handle_test_result() {
    local test_name="$1"
    local exit_code="$2"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}✅ $test_name - PASSED${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}❌ $test_name - FAILED${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    echo ""
}

# Function to run command and capture result
run_test() {
    local test_name="$1"
    local command="$2"
    
    echo -e "${YELLOW}🔄 Running: $test_name${NC}"
    
    if eval "$command" > /tmp/test_output.log 2>&1; then
        handle_test_result "$test_name" 0
    else
        handle_test_result "$test_name" 1
        echo -e "${RED}Error output:${NC}"
        cat /tmp/test_output.log | head -20
        echo ""
    fi
}

# Check prerequisites
print_section "Prerequisites Check"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
else
    echo -e "${GREEN}✅ Node.js is installed: $(node --version)${NC}"
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
else
    echo -e "${GREEN}✅ npm is installed: $(npm --version)${NC}"
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
else
    echo -e "${GREEN}✅ Dependencies are installed${NC}"
fi

echo ""

# 1. TypeScript Compilation Tests
print_section "TypeScript Compilation Tests"

run_test "TypeScript compilation check" "npm run typecheck"
run_test "TypeScript learning center types test" "npm test -- tests/typescript/learning-center-types.test.ts"

# 2. Unit Tests - Component Rendering
print_section "Unit Tests - Component Rendering"

run_test "AboutCoaching component tests" "npm test -- src/components/__tests__/AboutCoaching.test.tsx"
run_test "CoachingResources component tests" "npm test -- src/components/__tests__/CoachingResources.test.tsx"
run_test "CoachingBasics component tests" "npm test -- src/components/__tests__/CoachingBasics.test.tsx"

# 3. Linting and Code Quality
print_section "Code Quality Tests"

run_test "ESLint code quality check" "npm run lint"
run_test "Prettier code formatting check" "npm run format:check"

# 4. Build Tests
print_section "Build Tests"

run_test "Production build test" "npm run build"

# 5. E2E Tests - Navigation and Routing
print_section "E2E Tests - Navigation and Routing"

# Check if Playwright is installed
if ! npx playwright --version &> /dev/null; then
    echo -e "${YELLOW}📦 Installing Playwright...${NC}"
    npx playwright install
fi

# Start development server in background
echo -e "${YELLOW}🚀 Starting development server...${NC}"
npm run dev &
DEV_SERVER_PID=$!

# Wait for server to start
echo -e "${YELLOW}⏳ Waiting for server to start...${NC}"
sleep 10

# Function to check if server is running
check_server() {
    curl -s http://localhost:5173 > /dev/null
}

# Wait up to 30 seconds for server to be ready
for i in {1..30}; do
    if check_server; then
        echo -e "${GREEN}✅ Development server is running${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Development server failed to start${NC}"
        kill $DEV_SERVER_PID 2>/dev/null || true
        exit 1
    fi
    sleep 1
done

echo ""

# Run E2E tests
run_test "Learning center navigation and routing" "npx playwright test tests/e2e/learning-center-cleanup.spec.ts"
run_test "Mobile responsiveness tests" "npx playwright test tests/e2e/mobile-responsiveness.spec.ts"

# 6. Accessibility Tests
print_section "Accessibility Tests"

run_test "Accessibility compliance tests" "npx playwright test tests/accessibility/learning-center-a11y.spec.ts"

# Stop development server
echo -e "${YELLOW}🛑 Stopping development server...${NC}"
kill $DEV_SERVER_PID 2>/dev/null || true
sleep 2

# 7. Import and Dependency Analysis
print_section "Import and Dependency Analysis"

# Check for unused dependencies
if command -v depcheck &> /dev/null; then
    run_test "Unused dependencies check" "depcheck --ignores='@types/*,eslint-*,prettier,jest,playwright,axe-*'"
else
    echo -e "${YELLOW}⚠️  depcheck not installed, skipping unused dependencies check${NC}"
fi

# Check for circular dependencies
if command -v madge &> /dev/null; then
    run_test "Circular dependencies check" "madge --circular src/"
else
    echo -e "${YELLOW}⚠️  madge not installed, skipping circular dependencies check${NC}"
fi

# 8. Bundle Analysis
print_section "Bundle Analysis"

# Check bundle size
if [ -d "dist" ]; then
    BUNDLE_SIZE=$(du -sh dist | cut -f1)
    echo -e "${GREEN}📦 Bundle size: $BUNDLE_SIZE${NC}"
    
    # Check if bundle size is reasonable (under 5MB for example)
    BUNDLE_SIZE_BYTES=$(du -s dist | cut -f1)
    if [ $BUNDLE_SIZE_BYTES -lt 5120 ]; then  # 5MB in KB
        handle_test_result "Bundle size check (< 5MB)" 0
    else
        handle_test_result "Bundle size check (< 5MB)" 1
    fi
else
    echo -e "${YELLOW}⚠️  No dist folder found, skipping bundle size check${NC}"
fi

# 9. Git Repository Checks
print_section "Git Repository Checks"

# Check for uncommitted changes that might indicate cleanup issues
if git diff-index --quiet HEAD --; then
    handle_test_result "No uncommitted changes" 0
else
    echo -e "${YELLOW}⚠️  Uncommitted changes detected${NC}"
    git status --porcelain
    handle_test_result "No uncommitted changes" 1
fi

# Check for deleted files in git history (should include old LMS files)
DELETED_FILES=$(git log --name-status --oneline -10 | grep "^D" | wc -l)
if [ $DELETED_FILES -gt 0 ]; then
    handle_test_result "Files were deleted (cleanup occurred)" 0
else
    handle_test_result "Files were deleted (cleanup occurred)" 1
fi

# 10. File System Checks
print_section "File System Checks"

# Check that new files exist
NEW_FILES=(
    "src/pages/learning/AboutCoaching.tsx"
    "src/pages/learning/CoachingResources.tsx"
    "src/pages/learning/CoachingBasics.tsx"
)

for file in "${NEW_FILES[@]}"; do
    if [ -f "$file" ]; then
        handle_test_result "File exists: $file" 0
    else
        handle_test_result "File exists: $file" 1
    fi
done

# Check that old files don't exist
OLD_FILES=(
    "src/pages/learning/CourseList.tsx"
    "src/pages/learning/CourseDetails.tsx"
    "src/pages/learning/LearningHome.tsx"
    "src/pages/learning/ResourceLibrary.tsx"
)

for file in "${OLD_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        handle_test_result "File removed: $file" 0
    else
        handle_test_result "File removed: $file" 1
    fi
done

# 11. Content Validation
print_section "Content Validation"

# Check that App.tsx has been updated with new routes
if grep -q "/about-coaching" src/App.tsx && grep -q "/coaching-resources" src/App.tsx && grep -q "/coaching-basics" src/App.tsx; then
    handle_test_result "App.tsx contains new routes" 0
else
    handle_test_result "App.tsx contains new routes" 1
fi

# Check that old routes are removed from App.tsx
if ! grep -q "/learning" src/App.tsx && ! grep -q "/courses" src/App.tsx; then
    handle_test_result "App.tsx old routes removed" 0
else
    handle_test_result "App.tsx old routes removed" 1
fi

# Check Navigation.tsx has coaching dropdown
if grep -q "about-coaching" src/components/Navigation.tsx && grep -q "coaching-resources" src/components/Navigation.tsx; then
    handle_test_result "Navigation.tsx updated with coaching links" 0
else
    handle_test_result "Navigation.tsx updated with coaching links" 1
fi

# Final Results
echo ""
print_section "Test Results Summary"

echo -e "${GREEN}✅ Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}❌ Tests Failed: $TESTS_FAILED${NC}"
echo -e "${BLUE}📊 Total Tests: $TOTAL_TESTS${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 All tests passed! Learning center cleanup is successful.${NC}"
    echo -e "${GREEN}The learning center has been successfully simplified from LMS to informational content.${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}❌ $TESTS_FAILED test(s) failed. Please review and fix the issues.${NC}"
    echo -e "${YELLOW}Check the test output above for specific error details.${NC}"
    exit 1
fi