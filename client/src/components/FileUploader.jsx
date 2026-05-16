import { useRef, useState } from 'react';

const FileUploader = ({ allowedTypes = [], maxSizeMb = 10, onFileSelect, selectedFile }) => {
  const inputRef  = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState(null);

  const validate = (file) => {
    if (!file) return 'No file selected';

    const ext = file.name.split('.').pop().toLowerCase();
    if (allowedTypes.length > 0 && !allowedTypes.includes(ext)) {
      return `File type .${ext} not allowed. Allowed: ${allowedTypes.join(', ')}`;
    }

    const sizeMb = file.size / (1024 * 1024);
    if (sizeMb > maxSizeMb) {
      return `File size ${sizeMb.toFixed(2)}MB exceeds limit of ${maxSizeMb}MB`;
    }

    return null;
  };

  const handleFile = (file) => {
    const err = validate(file);
    if (err) {
      setFileError(err);
      onFileSelect(null);
    } else {
      setFileError(null);
      onFileSelect(file);
    }
  };

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
          ${dragOver
            ? 'border-blue-400 bg-blue-50'
            : selectedFile
              ? 'border-green-300 bg-green-50'
              : 'border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50'
          }`}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={allowedTypes.map((t) => `.${t}`).join(',')}
          onChange={handleChange}
        />

        {selectedFile ? (
          // File selected state
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm font-medium text-green-700">{selectedFile.name}</p>
            <p className="text-xs text-green-600">
              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
            </p>
            <p className="text-xs text-gray-400">Click to change file</p>
          </div>
        ) : (
          // Empty state
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">
                Drop your file here, or{' '}
                <span className="text-blue-600">browse</span>
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {allowedTypes.length > 0
                  ? `Allowed: ${allowedTypes.join(', ').toUpperCase()}`
                  : 'All file types allowed'}
                {' '}• Max {maxSizeMb}MB
              </p>
            </div>
          </div>
        )}
      </div>

      {/* File error */}
      {fileError && (
        <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {fileError}
        </p>
      )}
    </div>
  );
};

export default FileUploader;