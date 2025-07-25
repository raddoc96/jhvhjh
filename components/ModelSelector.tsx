import React from 'react';

const ModelSelector = (props: any) => {
  return (
    <div>
      <label>{props.label}</label>
      <select id={props.id} value={props.selectedModel} onChange={(e) => props.onModelChange(e.target.value)} disabled={props.isDisabled}>
        {props.availableModels.map((model: string) => (
          <option key={model} value={model}>{props.modelDisplayNames[model] || model}</option>
        ))}
      </select>
      {props.lockedReason && <p>{props.lockedReason}</p>}
    </div>
  );
};

export default ModelSelector;
