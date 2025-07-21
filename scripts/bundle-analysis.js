#!/usr/bin/env node

// Advanced Bundle Analysis and Performance Monitoring
// Comprehensive bundle size analysis with performance budgets and alerts

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

// Performance budgets (in KB)
const PERFORMANCE_BUDGETS = {
  // Critical path budgets
  INITIAL_BUNDLE: 500,
  TOTAL_BUNDLE: 2000,
  
  // Chunk-specific budgets
  REACT_CORE: 150,
  VENDOR_CHUNKS: 800,
  PAGE_CHUNKS: 250,
  COMPONENT_CHUNKS: 100,
  
  // Asset budgets
  IMAGES: 1000,
  FONTS: 200,
  CSS: 150,
  
  // Performance thresholds
  FIRST_CONTENTFUL_PAINT: 1500, // 1.5s
  LARGEST_CONTENTFUL_PAINT: 2500, // 2.5s
  CUMULATIVE_LAYOUT_SHIFT: 0.1,
  FIRST_INPUT_DELAY: 100, // 100ms
  TIME_TO_INTERACTIVE: 3000 // 3s
};

// Bundle analysis configuration
const ANALYSIS_CONFIG = {
  distPath: path.join(__dirname, '../dist'),
  statsPath: path.join(__dirname, '../dist/stats.html'),
  reportPath: path.join(__dirname, '../reports'),
  
  // File patterns for analysis
  patterns: {
    js: /\.js$/,
    css: /\.css$/,
    images: /\.(png|jpg|jpeg|gif|svg|webp)$/,
    fonts: /\.(woff|woff2|ttf|eot)$/,
    chunks: /chunk\./,
    vendor: /vendor\./,
    pages: /pages-/,
    components: /components-/
  },
  
  // Compression analysis
  compression: {
    gzip: true,
    brotli: true
  }
};

class BundleAnalyzer {
  constructor() {
    this.results = {
      totalSize: 0,
      gzipSize: 0,
      brotliSize: 0,
      chunks: [],
      assets: [],
      performance: {},
      warnings: [],
      errors: []
    };
  }
  
  // Main analysis entry point
  async analyze() {
    console.log('🔍 Starting comprehensive bundle analysis...\n');
    
    try {
      // Ensure reports directory exists
      await this.ensureReportsDir();
      
      // Analyze bundle contents
      await this.analyzeBundle();
      
      // Analyze chunk sizes
      await this.analyzeChunks();
      
      // Analyze assets
      await this.analyzeAssets();
      
      // Check performance budgets
      await this.checkPerformanceBudgets();
      
      // Generate compression analysis
      await this.analyzeCompression();
      
      // Generate reports
      await this.generateReports();
      
      // Display results
      this.displayResults();
      
      // Exit with error code if budgets exceeded
      if (this.results.errors.length > 0) {
        process.exit(1);
      }
      
    } catch (error) {
      console.error('❌ Bundle analysis failed:', error);
      process.exit(1);
    }
  }
  
  // Ensure reports directory exists
  async ensureReportsDir() {
    try {
      await fs.mkdir(ANALYSIS_CONFIG.reportPath, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }
  
  // Analyze bundle contents
  async analyzeBundle() {
    console.log('📦 Analyzing bundle structure...');
    
    const distPath = ANALYSIS_CONFIG.distPath;
    
    try {
      const files = await fs.readdir(distPath, { withFileTypes: true });
      
      for (const file of files) {
        if (file.isFile()) {
          const filePath = path.join(distPath, file.name);
          const stats = await fs.stat(filePath);
          
          this.results.totalSize += stats.size;
          this.results.assets.push({
            name: file.name,
            size: stats.size,
            sizeKB: Math.round(stats.size / 1024),
            type: this.getFileType(file.name)
          });
        }
      }
      
      console.log(`   Total bundle size: ${this.formatSize(this.results.totalSize)}`);
      
    } catch (error) {
      console.error('   Failed to analyze bundle:', error);
      this.results.errors.push(`Bundle analysis failed: ${error.message}`);
    }
  }
  
  // Analyze individual chunks
  async analyzeChunks() {
    console.log('🧩 Analyzing chunk sizes...');
    
    const chunks = this.results.assets.filter(asset => 
      ANALYSIS_CONFIG.patterns.js.test(asset.name)
    );
    
    this.results.chunks = chunks.map(chunk => ({
      ...chunk,
      category: this.categorizeChunk(chunk.name),
      budget: this.getChunkBudget(chunk.name),
      exceeds: false
    }));
    
    // Check chunk budgets
    this.results.chunks.forEach(chunk => {
      if (chunk.sizeKB > chunk.budget) {
        chunk.exceeds = true;
        this.results.warnings.push(
          `Chunk ${chunk.name} (${chunk.sizeKB}KB) exceeds budget (${chunk.budget}KB)`
        );
      }
    });
    
    console.log(`   Analyzed ${chunks.length} chunks`);
  }
  
  // Analyze assets (images, fonts, etc.)
  async analyzeAssets() {
    console.log('🖼️  Analyzing assets...');
    
    const assetTypes = ['images', 'fonts', 'css'];
    
    for (const type of assetTypes) {
      const assets = this.results.assets.filter(asset => 
        asset.type === type
      );
      
      const totalSize = assets.reduce((sum, asset) => sum + asset.size, 0);
      const budget = PERFORMANCE_BUDGETS[type.toUpperCase()] * 1024;
      
      if (totalSize > budget) {
        this.results.warnings.push(
          `${type} assets (${this.formatSize(totalSize)}) exceed budget (${this.formatSize(budget)})`
        );
      }
      
      console.log(`   ${type}: ${this.formatSize(totalSize)} (${assets.length} files)`);
    }
  }
  
  // Check performance budgets
  async checkPerformanceBudgets() {
    console.log('⚡ Checking performance budgets...');
    
    const totalSizeKB = Math.round(this.results.totalSize / 1024);
    
    // Check total bundle size
    if (totalSizeKB > PERFORMANCE_BUDGETS.TOTAL_BUNDLE) {
      this.results.errors.push(
        `Total bundle size (${totalSizeKB}KB) exceeds budget (${PERFORMANCE_BUDGETS.TOTAL_BUNDLE}KB)`
      );
    }
    
    // Check initial bundle size
    const initialChunks = this.results.chunks.filter(chunk => 
      chunk.name.includes('index') || chunk.name.includes('main')
    );
    
    const initialSize = initialChunks.reduce((sum, chunk) => sum + chunk.size, 0);
    const initialSizeKB = Math.round(initialSize / 1024);
    
    if (initialSizeKB > PERFORMANCE_BUDGETS.INITIAL_BUNDLE) {
      this.results.errors.push(
        `Initial bundle size (${initialSizeKB}KB) exceeds budget (${PERFORMANCE_BUDGETS.INITIAL_BUNDLE}KB)`
      );
    }
    
    console.log(`   Total: ${totalSizeKB}KB / ${PERFORMANCE_BUDGETS.TOTAL_BUNDLE}KB`);
    console.log(`   Initial: ${initialSizeKB}KB / ${PERFORMANCE_BUDGETS.INITIAL_BUNDLE}KB`);
  }
  
  // Analyze compression
  async analyzeCompression() {
    console.log('🗜️  Analyzing compression...');
    
    try {
      // Check if gzip files exist
      const gzipFiles = this.results.assets.filter(asset => 
        asset.name.endsWith('.gz')
      );
      
      if (gzipFiles.length > 0) {
        this.results.gzipSize = gzipFiles.reduce((sum, file) => sum + file.size, 0);
        const compressionRatio = (1 - this.results.gzipSize / this.results.totalSize) * 100;
        console.log(`   Gzip compression: ${compressionRatio.toFixed(1)}% reduction`);
      }
      
      // Check if brotli files exist
      const brotliFiles = this.results.assets.filter(asset => 
        asset.name.endsWith('.br')
      );
      
      if (brotliFiles.length > 0) {
        this.results.brotliSize = brotliFiles.reduce((sum, file) => sum + file.size, 0);
        const compressionRatio = (1 - this.results.brotliSize / this.results.totalSize) * 100;
        console.log(`   Brotli compression: ${compressionRatio.toFixed(1)}% reduction`);
      }
      
    } catch (error) {
      console.error('   Compression analysis failed:', error);
    }
  }
  
  // Generate comprehensive reports
  async generateReports() {
    console.log('📊 Generating reports...');
    
    try {
      // Generate JSON report
      const jsonReport = {
        timestamp: new Date().toISOString(),
        summary: {
          totalSize: this.results.totalSize,
          totalSizeKB: Math.round(this.results.totalSize / 1024),
          gzipSize: this.results.gzipSize,
          brotliSize: this.results.brotliSize,
          chunksCount: this.results.chunks.length,
          assetsCount: this.results.assets.length,
          warningsCount: this.results.warnings.length,
          errorsCount: this.results.errors.length
        },
        budgets: PERFORMANCE_BUDGETS,
        chunks: this.results.chunks,
        assets: this.results.assets,
        warnings: this.results.warnings,
        errors: this.results.errors
      };
      
      await fs.writeFile(
        path.join(ANALYSIS_CONFIG.reportPath, 'bundle-analysis.json'),
        JSON.stringify(jsonReport, null, 2)
      );
      
      // Generate HTML report
      const htmlReport = this.generateHTMLReport(jsonReport);
      await fs.writeFile(
        path.join(ANALYSIS_CONFIG.reportPath, 'bundle-analysis.html'),
        htmlReport
      );
      
      // Generate CI report
      const ciReport = this.generateCIReport(jsonReport);
      await fs.writeFile(
        path.join(ANALYSIS_CONFIG.reportPath, 'bundle-ci-report.txt'),
        ciReport
      );
      
      console.log('   Reports generated in ./reports/');
      
    } catch (error) {
      console.error('   Report generation failed:', error);
    }
  }
  
  // Generate HTML report
  generateHTMLReport(data) {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>Bundle Analysis Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .summary { background: #f5f5f5; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
    .error { color: #d32f2f; }
    .warning { color: #f57c00; }
    .success { color: #388e3c; }
    table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    .chart { width: 100%; height: 300px; margin-bottom: 20px; }
  </style>
</head>
<body>
  <h1>Bundle Analysis Report</h1>
  <div class="summary">
    <h2>Summary</h2>
    <p>Total Size: ${this.formatSize(data.summary.totalSize)}</p>
    <p>Chunks: ${data.summary.chunksCount}</p>
    <p>Assets: ${data.summary.assetsCount}</p>
    <p>Warnings: <span class="warning">${data.summary.warningsCount}</span></p>
    <p>Errors: <span class="error">${data.summary.errorsCount}</span></p>
  </div>
  
  <h2>Chunks</h2>
  <table>
    <tr><th>Name</th><th>Size</th><th>Category</th><th>Budget</th><th>Status</th></tr>
    ${data.chunks.map(chunk => `
      <tr>
        <td>${chunk.name}</td>
        <td>${chunk.sizeKB}KB</td>
        <td>${chunk.category}</td>
        <td>${chunk.budget}KB</td>
        <td class="${chunk.exceeds ? 'error' : 'success'}">
          ${chunk.exceeds ? 'Over Budget' : 'Within Budget'}
        </td>
      </tr>
    `).join('')}
  </table>
  
  ${data.warnings.length > 0 ? `
    <h2>Warnings</h2>
    <ul>
      ${data.warnings.map(warning => `<li class="warning">${warning}</li>`).join('')}
    </ul>
  ` : ''}
  
  ${data.errors.length > 0 ? `
    <h2>Errors</h2>
    <ul>
      ${data.errors.map(error => `<li class="error">${error}</li>`).join('')}
    </ul>
  ` : ''}
  
  <p><small>Generated on ${data.timestamp}</small></p>
</body>
</html>
    `.trim();
  }
  
  // Generate CI-friendly report
  generateCIReport(data) {
    const lines = [
      '# Bundle Analysis Report',
      '',
      `## Summary`,
      `- Total Size: ${this.formatSize(data.summary.totalSize)}`,
      `- Chunks: ${data.summary.chunksCount}`,
      `- Assets: ${data.summary.assetsCount}`,
      `- Warnings: ${data.summary.warningsCount}`,
      `- Errors: ${data.summary.errorsCount}`,
      ''
    ];
    
    if (data.errors.length > 0) {
      lines.push('## ❌ Errors');
      data.errors.forEach(error => lines.push(`- ${error}`));
      lines.push('');
    }
    
    if (data.warnings.length > 0) {
      lines.push('## ⚠️ Warnings');
      data.warnings.forEach(warning => lines.push(`- ${warning}`));
      lines.push('');
    }
    
    return lines.join('\n');
  }
  
  // Display results in console
  displayResults() {
    console.log('\n📊 Bundle Analysis Results:');
    console.log('=' * 50);
    
    console.log(`\n📦 Total Bundle Size: ${this.formatSize(this.results.totalSize)}`);
    
    if (this.results.gzipSize > 0) {
      console.log(`🗜️  Gzip Size: ${this.formatSize(this.results.gzipSize)}`);
    }
    
    if (this.results.brotliSize > 0) {
      console.log(`🗜️  Brotli Size: ${this.formatSize(this.results.brotliSize)}`);
    }
    
    console.log(`\n🧩 Chunks: ${this.results.chunks.length}`);
    console.log(`🖼️  Assets: ${this.results.assets.length}`);
    
    if (this.results.warnings.length > 0) {
      console.log(`\n⚠️  Warnings (${this.results.warnings.length}):`);
      this.results.warnings.forEach(warning => {
        console.log(`   - ${warning}`);
      });
    }
    
    if (this.results.errors.length > 0) {
      console.log(`\n❌ Errors (${this.results.errors.length}):`);
      this.results.errors.forEach(error => {
        console.log(`   - ${error}`);
      });
    }
    
    if (this.results.warnings.length === 0 && this.results.errors.length === 0) {
      console.log('\n✅ All performance budgets met!');
    }
    
    console.log('\n📊 View detailed reports in ./reports/');
  }
  
  // Helper methods
  getFileType(filename) {
    if (ANALYSIS_CONFIG.patterns.js.test(filename)) return 'js';
    if (ANALYSIS_CONFIG.patterns.css.test(filename)) return 'css';
    if (ANALYSIS_CONFIG.patterns.images.test(filename)) return 'images';
    if (ANALYSIS_CONFIG.patterns.fonts.test(filename)) return 'fonts';
    return 'other';
  }
  
  categorizeChunk(filename) {
    if (filename.includes('react-core')) return 'react-core';
    if (filename.includes('vendor')) return 'vendor';
    if (filename.includes('pages-')) return 'pages';
    if (filename.includes('components-')) return 'components';
    if (filename.includes('animation-engine')) return 'animation';
    if (filename.includes('backend-core')) return 'backend';
    if (filename.includes('payment-engine')) return 'payment';
    return 'other';
  }
  
  getChunkBudget(filename) {
    if (filename.includes('react-core')) return PERFORMANCE_BUDGETS.REACT_CORE;
    if (filename.includes('vendor')) return PERFORMANCE_BUDGETS.VENDOR_CHUNKS;
    if (filename.includes('pages-')) return PERFORMANCE_BUDGETS.PAGE_CHUNKS;
    if (filename.includes('components-')) return PERFORMANCE_BUDGETS.COMPONENT_CHUNKS;
    return PERFORMANCE_BUDGETS.PAGE_CHUNKS;
  }
  
  formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Run analysis if called directly
if (require.main === module) {
  const analyzer = new BundleAnalyzer();
  analyzer.analyze();
}

module.exports = BundleAnalyzer;