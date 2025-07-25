import React from 'react';

const NumberInput = ({ label, value, onChange, disabled }: { label: string, value: number, onChange: (value: number) => void, disabled: boolean }) => {
  return (
    <div>
      <label>{label}</label>
      <input type="number" value={value} onChange={(e) => onChange(parseInt(e.target.value))} disabled={disabled} />
    </div>
  );
};

export default NumberInput;
