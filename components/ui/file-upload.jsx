import React, { useRef, useState } from "react";
import { useDropzone } from "react-dropzone";

export const FileUpload = ({ onChange }) => {
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef(null);

  const handleFileChange = (newFiles) => {
    setFiles(newFiles);
    onChange && onChange(newFiles);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const { getRootProps, isDragActive } = useDropzone({
    multiple: false,
    noClick: true,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv']
    },
    onDrop: handleFileChange,
    onDropRejected: (error) => {
      console.log(error);
    },
  });

  return (
    <div className="w-full" {...getRootProps()}>
      <div
        onClick={handleClick}
        className={`p-10 rounded-lg cursor-pointer w-full border-2 border-dashed transition-colors ${
          isDragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-blue-400 hover:border-blue-500 hover:bg-blue-50'
        }`}
      >
        <input
          ref={fileInputRef}
          id="file-upload-handle"
          type="file"
          accept=".csv,text/csv,application/vnd.ms-excel"
          onChange={(e) => handleFileChange(Array.from(e.target.files || []))}
          className="hidden"
        />
        
        <div className="flex flex-col items-center justify-center">
          <p className="font-bold text-gray-700 text-lg mb-2">
            Upload file
          </p>
          <p className="text-gray-500 text-sm mb-6">
            Drag or drop your files here or click to upload
          </p>
          
          <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-blue-400">
            <svg 
              className="w-8 h-8 text-blue-500" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
              />
            </svg>
          </div>
          
          {files.length > 0 && (
            <div className="mt-4 w-full max-w-md">
              {files.map((file, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
                >
                  <div className="flex justify-between items-center">
                    <p className="text-gray-700 font-medium truncate">
                      {file.name}
                    </p>
                    <p className="text-sm text-gray-500 ml-2">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {file.type}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export function GridPattern() {
  const columns = 41;
  const rows = 11;
  return (
    <div
      className="flex bg-gray-100 dark:bg-neutral-900 shrink-0 flex-wrap justify-center items-center gap-x-px gap-y-px  scale-105">
      {Array.from({ length: rows }).map((_, row) =>
        Array.from({ length: columns }).map((_, col) => {
          const index = row * columns + col;
          return (
            <div
              key={`${col}-${row}`}
              className={`w-10 h-10 flex shrink-0 rounded-[2px] ${
                index % 2 === 0
                  ? "bg-gray-50 dark:bg-neutral-950"
                  : "bg-gray-50 dark:bg-neutral-950 shadow-[0px_0px_1px_3px_rgba(255,255,255,1)_inset] dark:shadow-[0px_0px_1px_3px_rgba(0,0,0,1)_inset]"
              }`} />
          );
        }))}
    </div>
  );
}
