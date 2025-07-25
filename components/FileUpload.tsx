import React from 'react';

const FileUpload = ({ onFilesAdded, hasExistingFiles, onClearAllFiles, fileInputId }: { onFilesAdded: (files: any[]) => void, hasExistingFiles: boolean, onClearAllFiles: () => void, fileInputId: string }) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const fileArray = Array.from(files).map(file => ({ name: file.name, content: "file content" }));
      onFilesAdded(fileArray);
    }
  };

  return (
    <div>
      <input type="file" id={fileInputId} onChange={handleFileChange} multiple />
      {hasExistingFiles && <button onClick={onClearAllFiles}>Clear All</button>}
    </div>
  );
};

export default FileUpload;
