import React, { useState } from 'react';
import { SourceDocument } from '../types';
import SourceDocumentModal from './SourceDocumentModal';

interface SourceDocumentItemProps {
  sourceData: SourceDocument;
}

const SourceDocumentItem: React.FC<SourceDocumentItemProps> = ({ sourceData }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const truncatedTopic = sourceData.topic.length > 30 
    ? sourceData.topic.substring(0, 27) + '...' 
    : sourceData.topic;

  return (
    <div className="source-document-item">
      <button 
        className="document-button"
        onClick={() => setIsModalOpen(true)}
        aria-label={`View synthesis of ${sourceData.sources.length} sources for: ${sourceData.topic}`}
      >
        <span className="document-icon">📄</span>
        <div className="document-content">
          <span className="document-title">{truncatedTopic}</span>
          <span className="document-sources text-xs text-gray-500">
            {sourceData.sources.length} source{sourceData.sources.length !== 1 ? 's' : ''}
          </span>
        </div>
      </button>
      
      {isModalOpen && (
        <SourceDocumentModal 
          document={sourceData} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </div>
  );
};

export default SourceDocumentItem;