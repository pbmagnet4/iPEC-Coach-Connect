#!/usr/bin/env node

/**
 * Learning Center Cleanup Analysis Script
 * 
 * Analyzes the current learning center implementation against business objectives:
 * - Simplified LMS to informational content
 * - Focus on coach discovery
 * - Remove complex course management
 * - Maintain educational value
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Analysis results storage
const analysisResults = {
  timestamp: new Date().toISOString(),
  businessObjectives: {
    simplifiedLMS: { score: 0, findings: [], recommendations: [] },
    coachDiscoveryFocus: { score: 0, findings: [], recommendations: [] },
    removedComplexity: { score: 0, findings: [], recommendations: [] },
    educationalValue: { score: 0, findings: [], recommendations: [] }
  },
  technicalAnalysis: {
    codeStructure: { score: 0, findings: [] },
    userExperience: { score: 0, findings: [] },
    contentQuality: { score: 0, findings: [] }
  },
  overallScore: 0,
  status: 'PENDING'
};

// File analysis functions
function analyzeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return {
      path: filePath,
      content,
      lines: content.split('\n').length,
      size: content.length
    };
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return null;
  }
}

function analyzeLMSRemoval(fileData) {
  const findings = [];
  let score = 100; // Start with perfect score, deduct for LMS elements

  const lmsIndicators = [
    { term: 'enroll', severity: 'high', deduction: 20 },
    { term: 'course', severity: 'medium', deduction: 10 },
    { term: 'lesson', severity: 'medium', deduction: 10 },
    { term: 'module', severity: 'low', deduction: 5 },
    { term: 'assignment', severity: 'high', deduction: 20 },
    { term: 'quiz', severity: 'high', deduction: 20 },
    { term: 'test', severity: 'high', deduction: 20 },
    { term: 'grade', severity: 'high', deduction: 20 },
    { term: 'certificate', severity: 'medium', deduction: 15 },
    { term: 'progress', severity: 'low', deduction: 5 },
    { term: 'completion', severity: 'medium', deduction: 10 }
  ];

  for (const file of fileData) {
    if (!file) continue;
    
    const content = file.content.toLowerCase();
    for (const indicator of lmsIndicators) {
      const matches = (content.match(new RegExp(indicator.term, 'g')) || []).length;
      if (matches > 0) {
        findings.push({
          file: file.path,
          issue: `Found ${matches} instances of LMS term: "${indicator.term}"`,
          severity: indicator.severity,
          line: 'Multiple locations'
        });
        
        // Deduct score, but not below 0
        score = Math.max(0, score - (indicator.deduction * Math.min(matches, 3)));
      }
    }
  }

  return { score, findings };
}

function analyzeCoachDiscoveryFocus(fileData) {
  const findings = [];
  let score = 0; // Start with 0, add points for coach discovery elements

  const coachDiscoveryIndicators = [
    { term: 'href="/coaches"', points: 15, description: 'Coach discovery link' },
    { term: 'find.*coach', points: 10, description: 'Coach discovery CTA' },
    { term: 'connect.*coach', points: 10, description: 'Coach connection messaging' },
    { term: 'work with.*coach', points: 10, description: 'Coach collaboration messaging' },
    { term: 'certified.*coach', points: 8, description: 'Coach credibility messaging' },
    { term: 'professional coach', points: 5, description: 'Professional coaching mention' },
    { term: 'iPEC coach', points: 8, description: 'iPEC brand coaching mention' }
  ];

  for (const file of fileData) {
    if (!file) continue;
    
    const content = file.content.toLowerCase();
    for (const indicator of coachDiscoveryIndicators) {
      const matches = (content.match(new RegExp(indicator.term, 'gi')) || []).length;
      if (matches > 0) {
        findings.push({
          file: file.path,
          positive: `Found ${matches} instances of: ${indicator.description}`,
          points: indicator.points * matches
        });
        
        score += indicator.points * Math.min(matches, 5); // Cap at 5 instances per indicator
      }
    }
  }

  // Normalize score to 0-100 scale
  score = Math.min(100, score);

  return { score, findings };
}

function analyzeComplexityRemoval(fileData) {
  const findings = [];
  let score = 100; // Start with perfect score, deduct for complexity

  const complexityIndicators = [
    { term: 'useState.*progress', severity: 'high', deduction: 15 },
    { term: 'useEffect.*enrollment', severity: 'high', deduction: 15 },
    { term: 'const.*courseId', severity: 'medium', deduction: 10 },
    { term: 'const.*lessonId', severity: 'medium', deduction: 10 },
    { term: 'completion.*tracking', severity: 'high', deduction: 15 },
    { term: 'grade.*calculation', severity: 'high', deduction: 20 },
    { term: 'payment.*course', severity: 'high', deduction: 20 },
    { term: 'subscription.*required', severity: 'high', deduction: 20 }
  ];

  for (const file of fileData) {
    if (!file) continue;
    
    const content = file.content;
    for (const indicator of complexityIndicators) {
      const matches = (content.match(new RegExp(indicator.term, 'gi')) || []).length;
      if (matches > 0) {
        findings.push({
          file: file.path,
          issue: `Complex LMS functionality found: ${indicator.term}`,
          severity: indicator.severity,
          instances: matches
        });
        
        score = Math.max(0, score - (indicator.deduction * matches));
      }
    }
  }

  return { score, findings };
}

function analyzeEducationalValue(fileData) {
  const findings = [];
  let score = 0; // Start with 0, add points for educational content

  const educationalIndicators = [
    { term: 'learn', points: 5, description: 'Learning focus' },
    { term: 'understand', points: 5, description: 'Understanding focus' },
    { term: 'discover', points: 5, description: 'Discovery focus' },
    { term: 'explore', points: 5, description: 'Exploration focus' },
    { term: 'benefit', points: 8, description: 'Benefits explanation' },
    { term: 'example', points: 6, description: 'Examples provided' },
    { term: 'testimonial', points: 8, description: 'Social proof' },
    { term: 'story', points: 6, description: 'Success stories' },
    { term: 'transform', points: 10, description: 'Transformation messaging' },
    { term: 'achieve.*goal', points: 10, description: 'Goal achievement focus' }
  ];

  for (const file of fileData) {
    if (!file) continue;
    
    const content = file.content.toLowerCase();
    for (const indicator of educationalIndicators) {
      const matches = (content.match(new RegExp(indicator.term, 'gi')) || []).length;
      if (matches > 0) {
        findings.push({
          file: file.path,
          positive: `Educational content: ${indicator.description} (${matches} instances)`,
          points: indicator.points * matches
        });
        
        score += indicator.points * Math.min(matches, 10); // Cap at 10 instances
      }
    }
  }

  // Normalize score to 0-100 scale
  score = Math.min(100, score * 0.5); // Scale down to prevent inflation

  return { score, findings };
}

function analyzeCodeStructure(fileData) {
  const findings = [];
  let score = 0;

  for (const file of fileData) {
    if (!file) continue;

    // Check for clean component structure
    if (file.content.includes('export function')) {
      score += 10;
      findings.push({ file: file.path, positive: 'Clean functional component export' });
    }

    // Check for proper TypeScript usage
    if (file.content.includes('interface') || file.content.includes('type')) {
      score += 10;
      findings.push({ file: file.path, positive: 'TypeScript type definitions' });
    }

    // Check for modern React practices
    if (file.content.includes('useState') || file.content.includes('useEffect')) {
      score += 5;
      findings.push({ file: file.path, positive: 'Modern React hooks usage' });
    }

    // Check for accessibility
    if (file.content.includes('aria-') || file.content.includes('role=')) {
      score += 15;
      findings.push({ file: file.path, positive: 'Accessibility attributes' });
    }

    // Check for responsive design
    if (file.content.includes('md:') || file.content.includes('lg:')) {
      score += 10;
      findings.push({ file: file.path, positive: 'Responsive design classes' });
    }
  }

  return { score: Math.min(100, score), findings };
}

function analyzeUserExperience(fileData) {
  const findings = [];
  let score = 0;

  const uxIndicators = [
    { term: 'motion\\.', points: 10, description: 'Animation/motion for UX' },
    { term: 'initial=.*animate=', points: 8, description: 'Framer Motion animations' },
    { term: 'Button.*variant=', points: 5, description: 'UI component variants' },
    { term: 'Card\\.', points: 5, description: 'Card-based layout' },
    { term: 'grid.*gap', points: 8, description: 'Grid layout with spacing' },
    { term: 'flex.*items-center', points: 5, description: 'Flexbox alignment' },
    { term: 'text-.*color', points: 3, description: 'Color hierarchy' },
    { term: 'hover:', points: 8, description: 'Hover interactions' }
  ];

  for (const file of fileData) {
    if (!file) continue;
    
    const content = file.content;
    for (const indicator of uxIndicators) {
      const matches = (content.match(new RegExp(indicator.term, 'g')) || []).length;
      if (matches > 0) {
        findings.push({
          file: file.path,
          positive: `UX enhancement: ${indicator.description}`,
          instances: matches
        });
        
        score += indicator.points * Math.min(matches, 3);
      }
    }
  }

  return { score: Math.min(100, score * 0.8), findings };
}

function analyzeContentQuality(fileData) {
  const findings = [];
  let score = 0;

  for (const file of fileData) {
    if (!file) continue;

    const content = file.content;
    
    // Count meaningful content elements
    const headings = (content.match(/<h[1-6]|className="text-[0-9]xl|font-bold/g) || []).length;
    const paragraphs = (content.match(/description.*:|<p>|className=".*text-/g) || []).length;
    const lists = (content.match(/\.map\(|forEach\(|\[.*\]/g) || []).length;
    
    if (headings >= 3) {
      score += 15;
      findings.push({ file: file.path, positive: `Good heading structure (${headings} headings)` });
    }
    
    if (paragraphs >= 5) {
      score += 20;
      findings.push({ file: file.path, positive: `Substantial content (${paragraphs} content blocks)` });
    }
    
    if (lists >= 2) {
      score += 10;
      findings.push({ file: file.path, positive: `Structured content with lists (${lists} lists)` });
    }

    // Check for content variety
    const testimonials = (content.match(/testimonial|quote|rating/gi) || []).length;
    const benefits = (content.match(/benefit|advantage|value/gi) || []).length;
    const examples = (content.match(/example|case|story/gi) || []).length;

    if (testimonials > 0) score += 10;
    if (benefits > 0) score += 10;
    if (examples > 0) score += 8;
  }

  return { score: Math.min(100, score), findings };
}

// Main analysis function
function runAnalysis() {
  console.log('🔍 Starting Learning Center Cleanup Analysis...\n');

  // Get learning center files
  const learningPagesDir = path.join(__dirname, '../src/pages/learning');
  const learningFiles = [
    'AboutCoaching.tsx',
    'CoachingBasics.tsx', 
    'CoachingResources.tsx'
  ];

  const fileData = learningFiles.map(filename => {
    const filePath = path.join(learningPagesDir, filename);
    return analyzeFile(filePath);
  }).filter(Boolean);

  if (fileData.length === 0) {
    console.error('❌ No learning center files found for analysis');
    return;
  }

  console.log(`📁 Analyzing ${fileData.length} learning center files...\n`);

  // Business objective analysis
  console.log('🎯 BUSINESS OBJECTIVES ANALYSIS');
  console.log('=====================================\n');

  // 1. Simplified LMS to informational content
  const lmsAnalysis = analyzeLMSRemoval(fileData);
  analysisResults.businessObjectives.simplifiedLMS.score = lmsAnalysis.score;
  analysisResults.businessObjectives.simplifiedLMS.findings = lmsAnalysis.findings;
  
  console.log(`1. LMS Removal Success: ${lmsAnalysis.score}/100`);
  if (lmsAnalysis.findings.length > 0) {
    console.log('   Issues found:');
    lmsAnalysis.findings.slice(0, 5).forEach(finding => {
      console.log(`   - ${finding.issue} (${finding.severity})`);
    });
  } else {
    console.log('   ✅ No LMS elements detected');
  }
  console.log();

  // 2. Coach discovery focus
  const coachAnalysis = analyzeCoachDiscoveryFocus(fileData);
  analysisResults.businessObjectives.coachDiscoveryFocus.score = coachAnalysis.score;
  analysisResults.businessObjectives.coachDiscoveryFocus.findings = coachAnalysis.findings;
  
  console.log(`2. Coach Discovery Focus: ${coachAnalysis.score}/100`);
  if (coachAnalysis.findings.length > 0) {
    console.log('   Positive indicators:');
    coachAnalysis.findings.slice(0, 5).forEach(finding => {
      console.log(`   ✅ ${finding.positive}`);
    });
  }
  console.log();

  // 3. Complexity removal
  const complexityAnalysis = analyzeComplexityRemoval(fileData);
  analysisResults.businessObjectives.removedComplexity.score = complexityAnalysis.score;
  analysisResults.businessObjectives.removedComplexity.findings = complexityAnalysis.findings;
  
  console.log(`3. Complexity Removal: ${complexityAnalysis.score}/100`);
  if (complexityAnalysis.findings.length > 0) {
    console.log('   Complex elements found:');
    complexityAnalysis.findings.slice(0, 3).forEach(finding => {
      console.log(`   ⚠️  ${finding.issue}`);
    });
  } else {
    console.log('   ✅ No complex LMS functionality detected');
  }
  console.log();

  // 4. Educational value
  const educationalAnalysis = analyzeEducationalValue(fileData);
  analysisResults.businessObjectives.educationalValue.score = educationalAnalysis.score;
  analysisResults.businessObjectives.educationalValue.findings = educationalAnalysis.findings;
  
  console.log(`4. Educational Value: ${educationalAnalysis.score}/100`);
  if (educationalAnalysis.findings.length > 0) {
    console.log('   Educational content found:');
    educationalAnalysis.findings.slice(0, 5).forEach(finding => {
      console.log(`   ✅ ${finding.positive}`);
    });
  }
  console.log();

  // Technical analysis
  console.log('🛠️  TECHNICAL ANALYSIS');
  console.log('======================\n');

  const codeStructureAnalysis = analyzeCodeStructure(fileData);
  analysisResults.technicalAnalysis.codeStructure.score = codeStructureAnalysis.score;
  analysisResults.technicalAnalysis.codeStructure.findings = codeStructureAnalysis.findings;
  
  console.log(`Code Structure Quality: ${codeStructureAnalysis.score}/100`);
  
  const uxAnalysis = analyzeUserExperience(fileData);
  analysisResults.technicalAnalysis.userExperience.score = uxAnalysis.score;
  analysisResults.technicalAnalysis.userExperience.findings = uxAnalysis.findings;
  
  console.log(`User Experience Quality: ${uxAnalysis.score}/100`);
  
  const contentQualityAnalysis = analyzeContentQuality(fileData);
  analysisResults.technicalAnalysis.contentQuality.score = contentQualityAnalysis.score;
  analysisResults.technicalAnalysis.contentQuality.findings = contentQualityAnalysis.findings;
  
  console.log(`Content Quality: ${contentQualityAnalysis.score}/100\n`);

  // Calculate overall score
  const businessScore = (
    lmsAnalysis.score + 
    coachAnalysis.score + 
    complexityAnalysis.score + 
    educationalAnalysis.score
  ) / 4;

  const technicalScore = (
    codeStructureAnalysis.score + 
    uxAnalysis.score + 
    contentQualityAnalysis.score
  ) / 3;

  analysisResults.overallScore = Math.round((businessScore * 0.7) + (technicalScore * 0.3));

  // Final assessment
  console.log('📊 FINAL ASSESSMENT');
  console.log('====================\n');
  console.log(`Business Objectives Score: ${Math.round(businessScore)}/100`);
  console.log(`Technical Implementation Score: ${Math.round(technicalScore)}/100`);
  console.log(`Overall Cleanup Success: ${analysisResults.overallScore}/100\n`);

  // Determine status
  if (analysisResults.overallScore >= 85) {
    analysisResults.status = 'EXCELLENT';
    console.log('🎉 STATUS: EXCELLENT - Cleanup objectives successfully achieved');
  } else if (analysisResults.overallScore >= 70) {
    analysisResults.status = 'GOOD';
    console.log('✅ STATUS: GOOD - Most cleanup objectives achieved');
  } else if (analysisResults.overallScore >= 50) {
    analysisResults.status = 'NEEDS IMPROVEMENT';
    console.log('⚠️  STATUS: NEEDS IMPROVEMENT - Some cleanup objectives not met');
  } else {
    analysisResults.status = 'POOR';
    console.log('❌ STATUS: POOR - Major cleanup objectives not achieved');
  }

  // Recommendations
  console.log('\n💡 RECOMMENDATIONS');
  console.log('==================\n');

  if (lmsAnalysis.score < 80) {
    console.log('• Remove remaining LMS terminology and functionality');
  }
  
  if (coachAnalysis.score < 70) {
    console.log('• Add more coach discovery CTAs and messaging');
  }
  
  if (complexityAnalysis.score < 90) {
    console.log('• Simplify remaining complex course management features');
  }
  
  if (educationalAnalysis.score < 60) {
    console.log('• Enhance educational content value and messaging');
  }

  // Save detailed results
  const resultsPath = path.join(__dirname, '../test-results/learning-center-analysis.json');
  const resultsDir = path.dirname(resultsPath);
  
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  
  fs.writeFileSync(resultsPath, JSON.stringify(analysisResults, null, 2));
  console.log(`\n📄 Detailed results saved to: ${resultsPath}`);
}

// Run the analysis
runAnalysis();

export { runAnalysis, analysisResults };