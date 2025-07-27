import React from 'react';
import { SourceDocument } from '../types';

interface SourceDocumentModalProps {
  document: SourceDocument;
  onClose: () => void;
}

const SourceDocumentModal: React.FC<SourceDocumentModalProps> = ({ document, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Research Synthesis</h2>
          <button className="text-gray-400 hover:text-white text-2xl leading-none" onClick={onClose}>×</button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 text-gray-300">
          <div className="mb-4 pb-4 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-1">Research Topic</h3>
            <p className="text-sm">{document.topic}</p>
          </div>
          
          <div className="mb-4 pb-4 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-1">AI Synthesis ({document.sources.length} sources)</h3>
            <div className="bg-gray-700 p-3 rounded text-sm leading-relaxed whitespace-pre-wrap">{document.summary}</div>
          </div>
          
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white mb-3">Source Materials</h3>
            <div className="space-y-4">
              {document.sources.map((source, index) => (
                <div key={index} className="bg-gray-700 p-4 rounded">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-white text-sm">Source {index + 1}: {source.title}</h4>
                    <a 
                      href={source.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-accent-blue hover:underline text-xs ml-2 flex-shrink-0"
                    >
                      Visit →
                    </a>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">{source.url}</p>
                  <div className="text-sm leading-relaxed">{source.snippet}</div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-between items-center pt-4 border-t border-gray-700 text-sm text-gray-400">
            <span>Total Sources: {document.sources.length}</span>
            <span className="timestamp">Processed: {new Date(document.timestamp).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SourceDocumentModal;