import React from 'react';
import { AgentName, LogEntry, ResearchState } from '../types';
import AgentNode from './AgentNode';
import LogViewer from './LogViewer';
import ReportViewer from './ReportViewer';
import ChevronRightIcon from './icons/ChevronRightIcon';

interface DashboardProps {
  agentNames: AgentName[];
  activeAgent: AgentName | null;
  logs: LogEntry[];
  finalReport: string;
  researchState: ResearchState;
  error: string | null;
}

const Dashboard: React.FC<DashboardProps> = ({
  agentNames,
  activeAgent,
  logs,
  finalReport,
  researchState,
  error,
}) => {
  const supervisorLogs = logs.filter(log => log.agent === 'supervisor');
  const researcherLogs = logs.filter(log => log.agent === 'researcher');
  const writerLogs = logs.filter(log => log.agent === 'writer');
  
  const showLogsContainer = researchState !== 'idle';
  const showReport = researchState === 'completed' && !!finalReport;

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto bg-gray-900">
      {/* Agent Workflow Graph */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-300">Agent Workflow</h3>
        <div className="flex items-center justify-center space-x-2 md:space-x-4 bg-gray-800 p-4 rounded-lg">
          {agentNames.map((name, index) => (
            <React.Fragment key={name}>
              <AgentNode name={name} isActive={activeAgent === name} />
              {index < agentNames.length - 1 && (
                <ChevronRightIcon className="w-8 h-8 text-gray-600" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-gray-800 rounded-lg p-6">
        {error && (
            <div className="bg-red-900 border border-red-500 text-red-200 p-4 rounded-md mb-4">
                <h3 className="font-bold">An Error Occurred</h3>
                <p>{error}</p>
            </div>
        )}

        {researchState === 'idle' && (
            <div className="text-center text-gray-400 h-full flex items-center justify-center">
                <p>Configure your research settings and click "Start Research" to begin.</p>
            </div>
        )}
        
        {showLogsContainer && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <LogViewer title="Supervisor" logs={supervisorLogs} />
                <LogViewer title="Researcher" logs={researcherLogs} />
                <LogViewer title="Writer" logs={writerLogs} />
            </div>
            {showReport && (
                <ReportViewer report={finalReport} logs={logs} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;