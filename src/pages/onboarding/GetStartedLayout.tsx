import React from 'react';
import { motion } from 'framer-motion';
import { Container } from '../../components/ui/Container';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ChevronRight, ChevronLeft } from 'lucide-react';

interface GetStartedLayoutProps {
  children: React.ReactNode;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onBack?: () => void;
  nextLabel?: string;
  isLastStep?: boolean;
}

export function GetStartedLayout({
  children,
  currentStep,
  totalSteps,
  onNext,
  onBack,
  nextLabel = 'Continue',
  isLastStep = false,
}: GetStartedLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-blue-50">
      <Container size="sm" className="py-12">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-sm font-medium text-brand-600">
              {Math.round((currentStep / totalSteps) * 100)}% Complete
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-brand-500 to-blue-500"
              initial={{ width: 0 }}
              animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </div>
        </div>

        <Card>
          <Card.Body className="p-8">
            {children}

            <div className="flex justify-between mt-8 pt-8 border-t">
              {onBack ? (
                <Button
                  variant="outline"
                  onClick={onBack}
                  icon={<ChevronLeft className="h-5 w-5" />}
                >
                  Back
                </Button>
              ) : (
                <div />
              )}
              <Button
                variant="gradient"
                onClick={onNext}
                icon={<ChevronRight className="h-5 w-5" />}
                iconPosition="right"
              >
                {isLastStep ? "Get Started" : nextLabel}
              </Button>
            </div>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}