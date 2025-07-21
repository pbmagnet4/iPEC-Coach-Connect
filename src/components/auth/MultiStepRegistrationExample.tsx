/**
 * Multi-Step Registration Example
 * 
 * Example usage of the MultiStepRegistration component
 * demonstrating the conversion optimization features
 */

import React from 'react';
import { MultiStepRegistration } from './MultiStepRegistration';
import { Card } from '../ui/Card';
import { Container } from '../ui/Container';

export function MultiStepRegistrationExample() {
  const handleRegistrationSuccess = () => {
    console.log('Registration completed successfully!');
    // Navigate to dashboard or show success message
  };

  const handleStepChange = (step: number, data: any) => {
    console.log(`Step ${step} completed with data:`, data);
  };

  return (
    <Container className="py-8">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-xl">
          <Card.Body className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Create Your Account
              </h1>
              <p className="text-gray-600">
                Join thousands of coaches and clients worldwide
              </p>
            </div>
            
            <MultiStepRegistration
              onSuccess={handleRegistrationSuccess}
              onStepChange={handleStepChange}
              redirectTo="/dashboard"
              enableAnalytics={true}
              showProgressBar={true}
            />
          </Card.Body>
        </Card>
      </div>
    </Container>
  );
}

export default MultiStepRegistrationExample;