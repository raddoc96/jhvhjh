import React from 'react';

const PresentationPreview = ({ htmlContent, chosenTheme, isFullscreen }: { htmlContent: string | null, chosenTheme: string, isFullscreen?: boolean }) => {
  if (!htmlContent) {
    return null;
  }

  return (
    <div style={{ border: '1px solid black', padding: '10px', margin: '10px 0' }}>
      <h3>Presentation Preview</h3>
      <iframe srcDoc={htmlContent} style={{ width: '100%', height: isFullscreen ? '90vh' : '500px' }} />
    </div>
  );
};

export default PresentationPreview;
