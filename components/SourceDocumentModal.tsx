import React from 'react';
import { SourceDocument } from '../types';

interface SourceDocumentModalProps {
  document: SourceDocument;
  onClose: () => void;
}

const SourceDocumentModal: React.FC<SourceDocumentModalProps> = ({ document, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">{document.title}</h2>
          <button className="text-gray-400 hover:text-white text-2xl leading-none" onClick={onClose}>×</button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 text-gray-300">
          <div className="mb-4 pb-4 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-1">Research Topic</h3>
            <p className="text-sm">{document.topic}</p>
          </div>
          
          <div className="mb-4 pb-4 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-1">AI Summary</h3>
            <div className="bg-gray-700 p-3 rounded text-sm leading-relaxed">{document.summary}</div>
          </div>
          
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white mb-1">Original Content</h3>
            <div className="bg-gray-700 p-3 rounded text-sm leading-relaxed">{document.snippet}</div>
          </div>
          
          <div className="flex justify-between items-center pt-4 border-t border-gray-700 text-sm text-gray-400">
            <a 
              href={document.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-accent-blue hover:underline"
            >
              Visit Source Website
            </a>
            <span className="timestamp">Processed: {new Date(document.timestamp).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SourceDocumentModal;