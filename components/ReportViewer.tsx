
import React, { useRef } from 'react';
import { LogEntry } from '../types';
import { DownloadIcon } from './icons/DownloadIcon';
// Note: In a real project, these would be installed via npm.
// For this environment, we assume they are loaded via CDN or are available globally.
// We'll use dynamic imports or global variables if necessary.
// For now, we declare them to satisfy TypeScript.
declare var jspdf: any;
declare var html2canvas: any;

interface ReportViewerProps {
  report: string;
  logs: LogEntry[];
}

const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
    const renderLine = (line: string) => {
        // This function will apply inline styling
        return line
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/_(.*?)_/g, '<em>$1</em>') // Underscore for italic
            .replace(/\*(.*?)\*/g, '<em>$1</em>') // Asterisk for italic
            .replace(/`(.*?)`/g, '<code class="bg-gray-700 rounded px-1 py-0.5 text-sm font-mono">$1</code>')
            .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-accent-blue hover:underline">$1</a>');
    };

    const elements = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (line.startsWith('### ')) {
            elements.push(<h3 key={i} className="text-xl font-bold mt-4 mb-2" dangerouslySetInnerHTML={{ __html: renderLine(line.substring(4)) }} />);
            continue;
        }
        if (line.startsWith('## ')) {
            elements.push(<h2 key={i} className="text-2xl font-bold mt-6 mb-3 border-b border-gray-600 pb-2" dangerouslySetInnerHTML={{ __html: renderLine(line.substring(3)) }} />);
            continue;
        }
        if (line.startsWith('# ')) {
            elements.push(<h1 key={i} className="text-3xl font-bold mt-8 mb-4 border-b-2 border-gray-500 pb-2" dangerouslySetInnerHTML={{ __html: renderLine(line.substring(2)) }} />);
            continue;
        }
        
        const isUnorderedListItem = line.startsWith('* ') || line.startsWith('- ');
        if (isUnorderedListItem) {
            const listItems = [];
            // Group subsequent list items
            while (i < lines.length && (lines[i].startsWith('* ') || lines[i].startsWith('- '))) {
                const itemContent = lines[i].substring(2);
                listItems.push(<li key={i} dangerouslySetInnerHTML={{ __html: renderLine(itemContent) }} />);
                i++;
            }
            i--; // Decrement because the outer loop will increment it again
            elements.push(<ul key={`ul-${i}`} className="list-disc ml-6 space-y-1 my-2">{listItems}</ul>);
            continue;
        }

        const isOrderedListItem = line.match(/^\d+\.\s/);
        if (isOrderedListItem) {
            const listItems = [];
            // Group subsequent list items
            while (i < lines.length && lines[i].match(/^\d+\.\s/)) {
                const itemContent = lines[i].replace(/^\d+\.\s/, '');
                listItems.push(<li key={i} dangerouslySetInnerHTML={{ __html: renderLine(itemContent) }} />);
                i++;
            }
            i--; // Decrement
            elements.push(<ol key={`ol-${i}`} className="list-decimal ml-6 space-y-1 my-2">{listItems}</ol>);
            continue;
        }

        if (line.trim() === '') {
            elements.push(<div key={i} className="h-4" />); // Represents a paragraph break
        } else {
            elements.push(<p key={i} className="my-2 leading-relaxed" dangerouslySetInnerHTML={{ __html: renderLine(line) }} />);
        }
    }
    
    return <div className="prose prose-invert max-w-none">{elements}</div>;
};


const ReportViewer: React.FC<ReportViewerProps> = ({ report, logs }) => {
  const reportRef = useRef<HTMLDivElement>(null);

  const exportToFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportMD = () => {
    exportToFile(report, 'research-report.md', 'text/markdown');
  };

  const handleExportJSON = () => {
    exportToFile(JSON.stringify({ report, logs }, null, 2), 'research-log.json', 'application/json');
  };

  const handleExportPDF = async () => {
    if (!reportRef.current || typeof jspdf === 'undefined' || typeof html2canvas === 'undefined') {
      alert('PDF generation library is not available.');
      return;
    }
    
    try {
        const { jsPDF } = jspdf;
        const canvas = await html2canvas(reportRef.current, {
            backgroundColor: '#1E1E1E',
            scale: 2,
        });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
        const imgX = (pdfWidth - imgWidth * ratio) / 2;
        const imgY = 10;
        pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
        pdf.save('research-report.pdf');
    } catch (error) {
        console.error("Failed to generate PDF:", error);
        alert("An error occurred while generating the PDF.");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-white">Final Report</h2>
        <div className="flex space-x-2">
          <button onClick={handleExportMD} className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-md text-sm font-medium transition">
            <DownloadIcon className="w-4 h-4" />
            <span>MD</span>
          </button>
          <button onClick={handleExportJSON} className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-md text-sm font-medium transition">
            <DownloadIcon className="w-4 h-4" />
            <span>JSON</span>
          </button>
          {/* <button onClick={handleExportPDF} className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-md text-sm font-medium transition">
            <DownloadIcon className="w-4 h-4" />
            <span>PDF</span>
          </button> */}
        </div>
      </div>
      <div ref={reportRef} className="bg-gray-900 p-6 rounded-lg text-gray-300">
        <MarkdownRenderer content={report} />
      </div>
    </div>
  );
};

export default ReportViewer;
