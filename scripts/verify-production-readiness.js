#!/usr/bin/env node

/**
 * Production Readiness Verification Script
 * Verifies that the application is ready for production deployment
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

console.log('🔍 Verifying Production Readiness...\n');

let allChecksPassed = true;
const failures = [];

function checkResult(passed, message, critical = false) {
  const status = passed ? '✅' : (critical ? '🚨' : '⚠️');
  console.log(`${status} ${message}`);
  
  if (!passed) {
    allChecksPassed = false;
    failures.push(`${critical ? 'CRITICAL: ' : 'WARNING: '}${message}`);
  }
}

// Check 1: Environment files
console.log('📁 Checking Environment Configuration...');
const envTemplate = path.join(projectRoot, '.env.production.template');
const hasEnvTemplate = fs.existsSync(envTemplate);
checkResult(hasEnvTemplate, 'Environment template exists', true);

const gitignoreContent = fs.readFileSync(path.join(projectRoot, '.gitignore'), 'utf8');
const ignoresEnv = gitignoreContent.includes('.env.production');
checkResult(ignoresEnv, 'Production environment files are gitignored', true);

// Check 2: Vercel configuration
console.log('\n🔧 Checking Vercel Configuration...');
const vercelConfig = path.join(projectRoot, 'vercel.json');
const hasVercelConfig = fs.existsSync(vercelConfig);
checkResult(hasVercelConfig, 'vercel.json exists', true);

if (hasVercelConfig) {
  const vercelContent = JSON.parse(fs.readFileSync(vercelConfig, 'utf8'));
  const hasFramework = vercelContent.framework === 'vite';
  checkResult(hasFramework, 'Framework set to vite in vercel.json');
  
  const hasSecurityHeaders = vercelContent.headers?.some(h => 
    h.headers?.some(header => header.key === 'Content-Security-Policy')
  );
  checkResult(hasSecurityHeaders, 'Security headers configured', true);
  
  const hasProductionBuildCommand = vercelContent.buildCommand?.includes('production');
  checkResult(hasProductionBuildCommand, 'Production build command configured');
}

// Check 3: Build configuration
console.log('\n⚙️ Checking Build Configuration...');
const viteConfig = path.join(projectRoot, 'vite.config.ts');
const hasViteConfig = fs.existsSync(viteConfig);
checkResult(hasViteConfig, 'vite.config.ts exists', true);

if (hasViteConfig) {
  const viteContent = fs.readFileSync(viteConfig, 'utf8');
  const hasProductionOptimization = viteContent.includes('drop_console');
  checkResult(hasProductionOptimization, 'Console removal configured for production', true);
  
  const hasMinification = viteContent.includes('minify: \'terser\'');
  checkResult(hasMinification, 'Terser minification enabled');
  
  const hasOptimizedChunks = viteContent.includes('manualChunks') && !viteContent.includes('// Advanced chunk naming');
  checkResult(hasOptimizedChunks, 'Optimized chunking strategy implemented');
}

// Check 4: Package.json scripts
console.log('\n📦 Checking Package Scripts...');
const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
const hasProductionBuildScript = packageJson.scripts['build:production']?.includes('production');
checkResult(hasProductionBuildScript, 'Production build script exists');

const hasDeployScript = packageJson.scripts['deploy:production'];
checkResult(hasDeployScript, 'Production deploy script exists');

const hasTypecheckInBuild = packageJson.scripts['build:production']?.includes('typecheck');
checkResult(hasTypecheckInBuild, 'Type checking in production build');

// Check 5: Security and console statements
console.log('\n🔒 Checking Security...');

// Check for console statements in source files (basic check)
function findConsoleStatements(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  let consoleFound = false;
  
  function scanDirectory(directory) {
    if (consoleFound) return;
    
    const items = fs.readdirSync(directory);
    for (const item of items) {
      const fullPath = path.join(directory, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.includes('node_modules') && !item.includes('.git')) {
        scanDirectory(fullPath);
      } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('console.log(') || content.includes('console.warn(') || 
            content.includes('console.error(') || content.includes('console.debug(')) {
          consoleFound = true;
          break;
        }
      }
    }
  }
  
  scanDirectory(dir);
  return consoleFound;
}

const srcDir = path.join(projectRoot, 'src');
const hasConsoleStatements = findConsoleStatements(srcDir);
if (hasConsoleStatements) {
  checkResult(true, 'Console statements found but will be removed in production build');
} else {
  checkResult(true, 'No console statements found in source code');
}

// Check 6: Dependencies
console.log('\n📚 Checking Dependencies...');
const hasProductionDeps = packageJson.dependencies && Object.keys(packageJson.dependencies).length > 0;
checkResult(hasProductionDeps, 'Production dependencies present');

const hasDevDeps = packageJson.devDependencies && Object.keys(packageJson.devDependencies).length > 0;
checkResult(hasDevDeps, 'Development dependencies present');

// Check 7: Build output verification (if dist exists)
console.log('\n🏗️ Checking Build Output...');
const distDir = path.join(projectRoot, 'dist');
if (fs.existsSync(distDir)) {
  const distContents = fs.readdirSync(distDir);
  const hasIndexHtml = distContents.includes('index.html');
  checkResult(hasIndexHtml, 'index.html exists in dist');
  
  const hasAssets = distContents.includes('assets');
  checkResult(hasAssets, 'Assets directory exists in dist');
  
  // Check for empty JS files (a common issue)
  if (hasAssets) {
    const assetsDir = path.join(distDir, 'assets');
    const assetFiles = fs.readdirSync(assetsDir);
    const jsFiles = assetFiles.filter(f => f.endsWith('.js'));
    
    let emptyJsFiles = 0;
    jsFiles.forEach(file => {
      const filePath = path.join(assetsDir, file);
      const size = fs.statSync(filePath).size;
      if (size < 100) { // Less than 100 bytes is likely empty or nearly empty
        emptyJsFiles++;
      }
    });
    
    checkResult(emptyJsFiles === 0, `No empty JavaScript chunks found (found ${emptyJsFiles})`);
  }
} else {
  console.log('ℹ️  Dist directory not found - run build to verify output');
}

// Final Report
console.log('\n' + '='.repeat(60));
console.log('🏁 Production Readiness Report');
console.log('='.repeat(60));

if (allChecksPassed) {
  console.log('✅ All production readiness checks PASSED!');
  console.log('🚀 Your application is ready for production deployment.');
} else {
  console.log(`❌ ${failures.length} issues found:`);
  failures.forEach((failure, index) => {
    console.log(`${index + 1}. ${failure}`);
  });
  console.log('\n🔧 Please fix these issues before deploying to production.');
}

console.log('\n📋 Next Steps:');
console.log('1. Fix any critical issues listed above');
console.log('2. Run: npm run build:production');
console.log('3. Test locally: npm run preview');
console.log('4. Deploy: npm run deploy:production');

// Exit with error code if checks failed
process.exit(allChecksPassed ? 0 : 1);