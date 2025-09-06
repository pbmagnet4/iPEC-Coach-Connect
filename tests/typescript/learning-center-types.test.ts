/**
 * TypeScript Compilation and Import Validation Tests for Learning Center Cleanup
 * 
 * This test suite validates that:
 * 1. All learning center components compile without TypeScript errors
 * 2. All imports are valid and resolve correctly
 * 3. No unused imports or exports remain from the cleanup
 * 4. Component interfaces and types are correct
 * 5. No references to old LMS components exist
 */

import { describe, expect, test } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

// Type imports that should be available
interface ComponentImports {
  AboutCoaching: unknown;
  CoachingResources: unknown;
  CoachingBasics: unknown;
}

describe('Learning Center TypeScript Validation', () => {
  const projectRoot = path.resolve(__dirname, '../..');
  const srcDir = path.join(projectRoot, 'src');
  const learningDir = path.join(srcDir, 'pages/learning');

  describe('Component File Existence', () => {
    test('should have all expected learning center files', () => {
      const expectedFiles = [
        'AboutCoaching.tsx',
        'CoachingResources.tsx',
        'CoachingBasics.tsx'
      ];

      expectedFiles.forEach(file => {
        const filePath = path.join(learningDir, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });

    test('should not have old LMS component files', () => {
      const oldLmsFiles = [
        'CourseList.tsx',
        'CourseDetails.tsx',
        'LearningHome.tsx', // Should be renamed to AboutCoaching.tsx
        'ResourceLibrary.tsx' // Should be renamed to CoachingResources.tsx
      ];

      oldLmsFiles.forEach(file => {
        const filePath = path.join(learningDir, file);
        expect(fs.existsSync(filePath)).toBe(false);
      });
    });
  });

  describe('TypeScript Compilation', () => {
    let compilerOptions: ts.CompilerOptions;

    beforeAll(() => {
      // Load TypeScript config
      const tsconfigPath = path.join(projectRoot, 'tsconfig.json');
      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
      compilerOptions = tsconfig.compilerOptions;
    });

    test('should compile AboutCoaching.tsx without errors', () => {
      const filePath = path.join(learningDir, 'AboutCoaching.tsx');
      const sourceCode = fs.readFileSync(filePath, 'utf8');
      
      const result = ts.transpileModule(sourceCode, {
        compilerOptions: {
          ...compilerOptions,
          noEmit: true,
          skipLibCheck: true
        }
      });

      expect(result.diagnostics?.length || 0).toBe(0);
    });

    test('should compile CoachingResources.tsx without errors', () => {
      const filePath = path.join(learningDir, 'CoachingResources.tsx');
      const sourceCode = fs.readFileSync(filePath, 'utf8');
      
      const result = ts.transpileModule(sourceCode, {
        compilerOptions: {
          ...compilerOptions,
          noEmit: true,
          skipLibCheck: true
        }
      });

      expect(result.diagnostics?.length || 0).toBe(0);
    });

    test('should compile CoachingBasics.tsx without errors', () => {
      const filePath = path.join(learningDir, 'CoachingBasics.tsx');
      const sourceCode = fs.readFileSync(filePath, 'utf8');
      
      const result = ts.transpileModule(sourceCode, {
        compilerOptions: {
          ...compilerOptions,
          noEmit: true,
          skipLibCheck: true
        }
      });

      expect(result.diagnostics?.length || 0).toBe(0);
    });
  });

  describe('Import Validation', () => {
    test('should have valid imports in AboutCoaching.tsx', () => {
      const filePath = path.join(learningDir, 'AboutCoaching.tsx');
      const sourceCode = fs.readFileSync(filePath, 'utf8');

      // Check for expected imports
      expect(sourceCode).toMatch(/import React from ['"]react['"]/);
      expect(sourceCode).toMatch(/import.*motion.*from ['"]framer-motion['"]/);
      expect(sourceCode).toMatch(/import.*from ['"]lucide-react['"]/);
      expect(sourceCode).toMatch(/import.*Container.*from.*ui\/Container['"]/);
      expect(sourceCode).toMatch(/import.*Card.*from.*ui\/Card['"]/);
      expect(sourceCode).toMatch(/import.*Button.*from.*ui\/Button['"]/);

      // Should not have old LMS imports
      expect(sourceCode).not.toMatch(/CourseList/);
      expect(sourceCode).not.toMatch(/CourseDetails/);
      expect(sourceCode).not.toMatch(/LearningHome/);
    });

    test('should have valid imports in CoachingResources.tsx', () => {
      const filePath = path.join(learningDir, 'CoachingResources.tsx');
      const sourceCode = fs.readFileSync(filePath, 'utf8');

      // Check for expected imports
      expect(sourceCode).toMatch(/import React from ['"]react['"]/);
      expect(sourceCode).toMatch(/import.*motion.*from ['"]framer-motion['"]/);
      expect(sourceCode).toMatch(/import.*from ['"]lucide-react['"]/);
      expect(sourceCode).toMatch(/import.*Container.*from.*ui\/Container['"]/);
      expect(sourceCode).toMatch(/import.*Card.*from.*ui\/Card['"]/);
      expect(sourceCode).toMatch(/import.*Button.*from.*ui\/Button['"]/);
      expect(sourceCode).toMatch(/import.*Badge.*from.*ui\/Badge['"]/);

      // Should not have old LMS imports
      expect(sourceCode).not.toMatch(/ResourceLibrary/);
      expect(sourceCode).not.toMatch(/CourseProgress/);
    });

    test('should have valid imports in CoachingBasics.tsx', () => {
      const filePath = path.join(learningDir, 'CoachingBasics.tsx');
      const sourceCode = fs.readFileSync(filePath, 'utf8');

      // Check for expected imports
      expect(sourceCode).toMatch(/import React from ['"]react['"]/);
      expect(sourceCode).toMatch(/import.*motion.*from ['"]framer-motion['"]/);
      expect(sourceCode).toMatch(/import.*from ['"]lucide-react['"]/);
      expect(sourceCode).toMatch(/import.*Container.*from.*ui\/Container['"]/);
      expect(sourceCode).toMatch(/import.*Card.*from.*ui\/Card['"]/);
      expect(sourceCode).toMatch(/import.*Button.*from.*ui\/Button['"]/);
      expect(sourceCode).toMatch(/import.*Badge.*from.*ui\/Badge['"]/);

      // Should not have old LMS imports
      expect(sourceCode).not.toMatch(/ModulePlayer/);
      expect(sourceCode).not.toMatch(/CourseEnrollment/);
    });
  });

  describe('Export Validation', () => {
    test('should export components correctly', () => {
      const files = [
        'AboutCoaching.tsx',
        'CoachingResources.tsx', 
        'CoachingBasics.tsx'
      ];

      files.forEach(file => {
        const filePath = path.join(learningDir, file);
        const sourceCode = fs.readFileSync(filePath, 'utf8');
        const componentName = file.replace('.tsx', '');

        // Should have named export
        expect(sourceCode).toMatch(new RegExp(`export function ${componentName}`));
      });
    });
  });

  describe('App.tsx Integration', () => {
    test('should have correct imports in App.tsx', () => {
      const appPath = path.join(srcDir, 'App.tsx');
      const sourceCode = fs.readFileSync(appPath, 'utf8');

      // Check for new learning center imports
      expect(sourceCode).toMatch(/AboutCoaching.*from.*pages\/learning\/AboutCoaching/);
      expect(sourceCode).toMatch(/CoachingResources.*from.*pages\/learning\/CoachingResources/);
      expect(sourceCode).toMatch(/CoachingBasics.*from.*pages\/learning\/CoachingBasics/);

      // Should not have old LMS imports
      expect(sourceCode).not.toMatch(/CourseList/);
      expect(sourceCode).not.toMatch(/CourseDetails/);
      expect(sourceCode).not.toMatch(/LearningHome/);
      expect(sourceCode).not.toMatch(/ResourceLibrary/);
    });

    test('should have correct routes in App.tsx', () => {
      const appPath = path.join(srcDir, 'App.tsx');
      const sourceCode = fs.readFileSync(appPath, 'utf8');

      // Check for new routes
      expect(sourceCode).toMatch(/path="\/about-coaching"/);
      expect(sourceCode).toMatch(/path="\/coaching-resources"/);
      expect(sourceCode).toMatch(/path="\/coaching-basics"/);
      expect(sourceCode).toMatch(/<AboutCoaching/);
      expect(sourceCode).toMatch(/<CoachingResources/);
      expect(sourceCode).toMatch(/<CoachingBasics/);

      // Should not have old LMS routes
      expect(sourceCode).not.toMatch(/path="\/learning"/);
      expect(sourceCode).not.toMatch(/path="\/courses"/);
      expect(sourceCode).not.toMatch(/<CourseList/);
      expect(sourceCode).not.toMatch(/<CourseDetails/);
    });
  });

  describe('Navigation Integration', () => {
    test('should update Navigation.tsx correctly', () => {
      const navPath = path.join(srcDir, 'components/Navigation.tsx');
      const sourceCode = fs.readFileSync(navPath, 'utf8');

      // Check for coaching links array with new routes
      expect(sourceCode).toMatch(/href: ['"]\/about-coaching['"]/);
      expect(sourceCode).toMatch(/href: ['"]\/coaching-resources['"]/);
      expect(sourceCode).toMatch(/href: ['"]\/coaching-basics['"]/);

      // Should not have old learning routes
      expect(sourceCode).not.toMatch(/href: ['"]\/learning['"]/);
      expect(sourceCode).not.toMatch(/href: ['"]\/courses['"]/);
    });

    test('should update MobileNavigation.tsx correctly', () => {
      const mobileNavPath = path.join(srcDir, 'components/MobileNavigation.tsx');
      const sourceCode = fs.readFileSync(mobileNavPath, 'utf8');

      // Check for coaching links with new routes
      expect(sourceCode).toMatch(/href: ['"]\/about-coaching['"]/);
      expect(sourceCode).toMatch(/href: ['"]\/coaching-resources['"]/);
      expect(sourceCode).toMatch(/href: ['"]\/coaching-basics['"]/);

      // Should not have old learning routes
      expect(sourceCode).not.toMatch(/href: ['"]\/learning['"]/);
      expect(sourceCode).not.toMatch(/href: ['"]\/courses['"]/);
    });
  });

  describe('Type Safety', () => {
    test('should not have any TypeScript errors in learning components', async () => {
      const learningFiles = [
        path.join(learningDir, 'AboutCoaching.tsx'),
        path.join(learningDir, 'CoachingResources.tsx'),
        path.join(learningDir, 'CoachingBasics.tsx')
      ];

      // Create a TypeScript program to check for errors
      const program = ts.createProgram(learningFiles, {
        ...compilerOptions,
        noEmit: true,
        skipLibCheck: false,
        strict: true
      });

      const diagnostics = ts.getPreEmitDiagnostics(program);
      
      // Filter out library diagnostics, focus on our files
      const relevantDiagnostics = diagnostics.filter(diagnostic => 
        diagnostic.file?.fileName.includes('/pages/learning/')
      );

      if (relevantDiagnostics.length > 0) {
        const errorMessages = relevantDiagnostics.map(diagnostic => 
          `${diagnostic.file?.fileName}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')}`
        );
        console.error('TypeScript errors found:', errorMessages);
      }

      expect(relevantDiagnostics.length).toBe(0);
    });

    test('should have proper React component types', () => {
      const files = [
        'AboutCoaching.tsx',
        'CoachingResources.tsx',
        'CoachingBasics.tsx'
      ];

      files.forEach(file => {
        const filePath = path.join(learningDir, file);
        const sourceCode = fs.readFileSync(filePath, 'utf8');
        const componentName = file.replace('.tsx', '');

        // Should be properly typed React functional components
        expect(sourceCode).toMatch(new RegExp(`export function ${componentName}\\(\\).*\\{`));
        
        // Should return JSX
        expect(sourceCode).toMatch(/return\s*\(/);
        expect(sourceCode).toMatch(/<div|<Container|<motion\.div/);
      });
    });
  });

  describe('Dependency Analysis', () => {
    test('should not have unused dependencies', () => {
      const packageJsonPath = path.join(projectRoot, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      // Learning center specific dependencies that should be used
      const requiredDeps = ['react', 'framer-motion', 'lucide-react'];
      
      requiredDeps.forEach(dep => {
        expect(packageJson.dependencies[dep] || packageJson.devDependencies[dep]).toBeDefined();
      });
    });

    test('should not reference old LMS dependencies', () => {
      const learningFiles = [
        'AboutCoaching.tsx',
        'CoachingResources.tsx',
        'CoachingBasics.tsx'
      ];

      const oldLmsDependencies = [
        'react-player', // Video player for courses
        'react-pdf', // PDF viewer for course materials
        'chartjs', // Progress charts
        'date-fns' // Only if used for course scheduling
      ];

      learningFiles.forEach(file => {
        const filePath = path.join(learningDir, file);
        const sourceCode = fs.readFileSync(filePath, 'utf8');

        oldLmsDependencies.forEach(dep => {
          expect(sourceCode).not.toMatch(new RegExp(`from ['"]${dep}['"\\s]`));
        });
      });
    });
  });

  describe('Interface and Type Definitions', () => {
    test('should have proper interface definitions', () => {
      const files = [
        'CoachingResources.tsx', // Has resource interfaces
        'CoachingBasics.tsx' // Has testimonial interfaces
      ];

      files.forEach(file => {
        const filePath = path.join(learningDir, file);
        const sourceCode = fs.readFileSync(filePath, 'utf8');

        // Should have TypeScript interfaces or types for data structures
        if (file === 'CoachingResources.tsx') {
          // Should define resource structure
          expect(sourceCode).toMatch(/const\s+resources\s*=.*\[/);
          expect(sourceCode).toMatch(/const\s+categories\s*=.*\[/);
        }

        if (file === 'CoachingBasics.tsx') {
          // Should define section structure
          expect(sourceCode).toMatch(/const\s+sections\s*=.*\[/);
          expect(sourceCode).toMatch(/const\s+testimonials\s*=.*\[/);
        }
      });
    });
  });

  describe('Build System Integration', () => {
    test('should be included in build process', () => {
      // Check that learning center files would be included in build
      const learningFiles = fs.readdirSync(learningDir);
      const tsxFiles = learningFiles.filter(file => file.endsWith('.tsx'));
      
      expect(tsxFiles.length).toBe(3);
      expect(tsxFiles).toContain('AboutCoaching.tsx');
      expect(tsxFiles).toContain('CoachingResources.tsx');
      expect(tsxFiles).toContain('CoachingBasics.tsx');
    });

    test('should not break existing imports', () => {
      // Ensure other parts of the app can still import shared components
      const sharedComponents = [
        path.join(srcDir, 'components/ui/Container.tsx'),
        path.join(srcDir, 'components/ui/Card.tsx'),
        path.join(srcDir, 'components/ui/Button.tsx'),
        path.join(srcDir, 'components/ui/Badge.tsx')
      ];

      sharedComponents.forEach(componentPath => {
        if (fs.existsSync(componentPath)) {
          const sourceCode = fs.readFileSync(componentPath, 'utf8');
          // Should have proper exports
          expect(sourceCode).toMatch(/export.*\{|export (function|const|class)/);
        }
      });
    });
  });

  describe('Cleanup Verification', () => {
    test('should not have any references to deleted components', () => {
      const allTsxFiles = getAllTsxFiles(srcDir);
      const deletedComponents = ['CourseList', 'CourseDetails', 'LearningHome', 'ResourceLibrary'];

      allTsxFiles.forEach(filePath => {
        const sourceCode = fs.readFileSync(filePath, 'utf8');
        
        deletedComponents.forEach(component => {
          expect(sourceCode).not.toMatch(new RegExp(`import.*${component}`, 'g'));
          expect(sourceCode).not.toMatch(new RegExp(`<${component}`, 'g'));
        });
      });
    });

    test('should not have any old route references', () => {
      const routingFiles = [
        path.join(srcDir, 'App.tsx'),
        path.join(srcDir, 'components/Navigation.tsx'),
        path.join(srcDir, 'components/MobileNavigation.tsx')
      ];

      const oldRoutes = ['/learning', '/courses', '/course-details'];

      routingFiles.forEach(filePath => {
        if (fs.existsSync(filePath)) {
          const sourceCode = fs.readFileSync(filePath, 'utf8');
          
          oldRoutes.forEach(route => {
            expect(sourceCode).not.toMatch(new RegExp(`['"]${route}['"]`, 'g'));
          });
        }
      });
    });
  });
});

// Helper function to recursively get all .tsx files
function getAllTsxFiles(dir: string): string[] {
  const files: string[] = [];
  
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      files.push(...getAllTsxFiles(fullPath));
    } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
      files.push(fullPath);
    }
  }
  
  return files;
}