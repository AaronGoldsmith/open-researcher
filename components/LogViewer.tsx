import React, { useRef, useEffect, useState } from 'react';
import { LogEntry, ResearchResult, SourceDocument, SourceDocumentLogEntry } from '../types';
import SourceDocumentModal from './SourceDocumentModal';

interface LogViewerProps {
  title: string;
  logs: LogEntry[];
}

const LogViewer: React.FC<LogViewerProps> = ({ title, logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedDocument, setSelectedDocument] = useState<SourceDocument | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const handleDocumentClick = (log: SourceDocumentLogEntry) => {
    setSelectedDocument(log.data.sourceData);
  };

  const closeModal = () => {
    setSelectedDocument(null);
  };

  return (
    <div className="bg-gray-900 rounded-lg p-4 h-96 flex flex-col">
      <h4 className="text-md font-bold mb-3 text-white border-b border-gray-700 pb-2">{title}</h4>
      <div ref={scrollRef} className="flex-1 overflow-y-auto text-sm space-y-3">
        {logs.map((log, index) => (
          <div key={index} className="text-gray-400 font-mono">
            {log.data?.type === 'sourceDocument' ? (
              <div onClick={() => handleDocumentClick(log as SourceDocumentLogEntry)} className="cursor-pointer">
                <p>{log.message}</p>     
              </div>
            ) : (<div> <p>{log.message}</p></div>)}
            {log.data && log.data.results && (
              <div className="mt-2 pl-4 border-l-2 border-gray-600 space-y-2">
                {(log.data.results as ResearchResult[]).map((res, i) => (
                    <div key={i} className="bg-gray-800 p-2 rounded">
                        <a href={res.url} target="_blank" rel="noopener noreferrer" className="text-accent-blue hover:underline font-semibold block">{res.title}</a>
                        <p className="text-xs text-gray-500">{res.snippet}</p>
                    </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      {selectedDocument && (
        <SourceDocumentModal document={selectedDocument} onClose={closeModal} />
      )}
    </div>
  );
};

export default LogViewer;
