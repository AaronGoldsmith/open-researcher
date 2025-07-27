import React, { useState } from 'react';
import { SourceDocument } from '../types';
import SourceDocumentModal from './SourceDocumentModal';

interface SourceDocumentItemProps {
  sourceData: SourceDocument;
}

const SourceDocumentItem: React.FC<SourceDocumentItemProps> = ({ sourceData }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="source-document-item">
      <button 
        className="document-button"
        onClick={() => setIsModalOpen(true)}
        aria-label={`View source: ${sourceData.title}`}
      >
        <span className="document-icon">📄</span>
        <span className="document-title">{sourceData.title}</span>
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