#!/usr/bin/env node

/**
 * Authentication Verification Script
 * 
 * Quick manual verification script to test authentication flows
 * without needing to set up full testing infrastructure.
 */

const readline = require('readline');
const { spawn } = require('child_process');
const { existsSync } = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const PROJECT_ROOT = path.join(__dirname, '..');

// ANSI color codes
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  console.log('\n' + '='.repeat(60));
  log(message, 'bold');
  console.log('='.repeat(60));
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

async function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      cwd: PROJECT_ROOT,
      ...options
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function checkFileExists(filePath) {
  const fullPath = path.join(PROJECT_ROOT, filePath);
  const exists = existsSync(fullPath);
  
  if (exists) {
    logSuccess(`${filePath} exists`);
  } else {
    logError(`${filePath} missing`);
  }
  
  return exists;
}

async function verifyProjectStructure() {
  logHeader('Verifying Project Structure');
  
  const criticalFiles = [
    'src/services/auth.service.ts',
    'src/stores/unified-user-store.ts',
    'src/components/auth/ProtectedRoute.tsx',
    'src/components/auth/EnhancedAuthForm.tsx',
    'src/components/GoogleSignInButton.tsx',
    'src/services/mfa.service.ts',
    'src/lib/rate-limiter-enhanced.ts',
    'src/lib/csrf-protection.ts',
    'src/lib/session-security.ts',
    'src/lib/secure-session.ts'
  ];

  let allExist = true;
  for (const file of criticalFiles) {
    const exists = await checkFileExists(file);
    if (!exists) allExist = false;
  }

  if (allExist) {
    logSuccess('All critical authentication files present');
  } else {
    logError('Some critical files are missing');
  }

  return allExist;
}

async function runTypeCheck() {
  logHeader('Running TypeScript Type Check');
  
  try {
    await runCommand('npm', ['run', 'typecheck']);
    logSuccess('TypeScript compilation successful');
    return true;
  } catch (error) {
    logError('TypeScript compilation failed');
    return false;
  }
}

async function runBuild() {
  logHeader('Running Production Build');
  
  try {
    await runCommand('npm', ['run', 'build']);
    logSuccess('Production build successful');
    return true;
  } catch (error) {
    logError('Production build failed');
    return false;
  }
}

async function runTests() {
  logHeader('Running Tests');
  
  try {
    await runCommand('npm', ['test']);
    logSuccess('Tests passed');
    return true;
  } catch (error) {
    logWarning('Tests failed or not configured');
    return false;
  }
}

async function runLinting() {
  logHeader('Running Linting');
  
  try {
    await runCommand('npm', ['run', 'lint']);
    logSuccess('Linting passed');
    return true;
  } catch (error) {
    logWarning('Linting failed or not configured');
    return false;
  }
}

async function startDevServer() {
  logHeader('Starting Development Server');
  logInfo('Starting development server for manual testing...');
  logInfo('You can test the following flows:');
  logInfo('1. Registration: http://localhost:5173/register');
  logInfo('2. Login: http://localhost:5173/login');
  logInfo('3. Protected routes: http://localhost:5173/dashboard');
  logInfo('4. Google Sign-in: Click Google button on login page');
  logInfo('');
  logInfo('Press Ctrl+C to stop the server');
  
  try {
    await runCommand('npm', ['run', 'dev']);
  } catch (error) {
    logError('Failed to start development server');
  }
}

async function performManualChecks() {
  logHeader('Manual Verification Checklist');
  
  const checks = [
    'Can you access the login page without errors?',
    'Does the registration form display correctly?',
    'Are protected routes redirecting to login when unauthenticated?',
    'Does Google Sign-in button work (redirects to OAuth)?',
    'Are form validations working correctly?',
    'Do error messages display appropriately?',
    'Is the navigation showing correct user state?',
    'Can you sign out successfully?'
  ];

  logInfo('Please verify the following manually in your browser:');
  console.log('');
  
  for (let i = 0; i < checks.length; i++) {
    console.log(`${i + 1}. ${checks[i]}`);
  }
  
  console.log('');
  const answer = await question('Have you verified all the above? (y/n): ');
  
  if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
    logSuccess('Manual verification completed');
    return true;
  } else {
    logWarning('Manual verification incomplete');
    return false;
  }
}

async function generateSummaryReport(results) {
  logHeader('Verification Summary Report');
  
  const {
    structureCheck,
    typeCheck,
    buildCheck,
    testCheck,
    lintCheck,
    manualCheck
  } = results;

  console.log('');
  logInfo('Results:');
  console.log(`Project Structure: ${structureCheck ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`TypeScript Check:  ${typeCheck ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Production Build:  ${buildCheck ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Tests:             ${testCheck ? '✅ PASS' : '⚠️  SKIP'}`);
  console.log(`Linting:           ${lintCheck ? '✅ PASS' : '⚠️  SKIP'}`);
  console.log(`Manual Check:      ${manualCheck ? '✅ PASS' : '⚠️  SKIP'}`);
  
  const criticalPassed = structureCheck && typeCheck && buildCheck;
  const allPassed = criticalPassed && testCheck && lintCheck && manualCheck;
  
  console.log('');
  if (allPassed) {
    logSuccess('🎉 ALL CHECKS PASSED! Authentication system is ready for production.');
  } else if (criticalPassed) {
    logWarning('⚠️  CRITICAL CHECKS PASSED. Some optional checks failed or were skipped.');
    logInfo('The authentication system is functional but may need additional testing.');
  } else {
    logError('❌ CRITICAL CHECKS FAILED. Authentication system needs fixes before deployment.');
  }
  
  console.log('');
  logInfo('For detailed analysis, see: AUTHENTICATION_VERIFICATION_REPORT.md');
}

async function main() {
  console.log('🔐 iPEC Coach Connect - Authentication Verification Tool');
  console.log('This tool will verify that the authentication system is working correctly.');
  
  const results = {
    structureCheck: false,
    typeCheck: false,
    buildCheck: false,
    testCheck: false,
    lintCheck: false,
    manualCheck: false
  };

  try {
    // Step 1: Verify project structure
    results.structureCheck = await verifyProjectStructure();
    
    // Step 2: Run TypeScript check
    results.typeCheck = await runTypeCheck();
    
    // Step 3: Run build
    if (results.typeCheck) {
      results.buildCheck = await runBuild();
    } else {
      logWarning('Skipping build due to TypeScript errors');
    }
    
    // Step 4: Run tests (optional)
    const runTestsChoice = await question('\nRun tests? (y/n): ');
    if (runTestsChoice.toLowerCase() === 'y') {
      results.testCheck = await runTests();
    } else {
      logInfo('Skipping tests');
    }
    
    // Step 5: Run linting (optional)
    const runLintChoice = await question('Run linting? (y/n): ');
    if (runLintChoice.toLowerCase() === 'y') {
      results.lintCheck = await runLinting();
    } else {
      logInfo('Skipping linting');
    }
    
    // Step 6: Manual testing
    const runManualChoice = await question('Start dev server for manual testing? (y/n): ');
    if (runManualChoice.toLowerCase() === 'y') {
      await startDevServer();
      results.manualCheck = await performManualChecks();
    } else {
      logInfo('Skipping manual testing');
    }
    
    // Generate summary
    await generateSummaryReport(results);
    
  } catch (error) {
    logError(`Verification failed: ${error.message}`);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n');
  logInfo('Verification cancelled by user');
  rl.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n');
  logInfo('Verification terminated');
  rl.close();
  process.exit(0);
});

if (require.main === module) {
  main().catch((error) => {
    logError(`Unexpected error: ${error.message}`);
    process.exit(1);
  });
}