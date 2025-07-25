import React from 'react';

const StepIndicator = ({ currentStep, currentMode, onStepClick }: { currentStep: any, currentMode: string, onStepClick: (step: any) => void }) => {
  return (
    <div>
      <p>Current Step: {currentStep}</p>
    </div>
  );
};

export default StepIndicator;
