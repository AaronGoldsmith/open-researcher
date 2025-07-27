
import React from 'react';
import { AgentName } from '../types';

interface AgentNodeProps {
  name: AgentName;
  isActive: boolean;
}

const AgentNode: React.FC<AgentNodeProps> = ({ name, isActive }) => {
  const baseClasses = 'px-6 py-3 rounded-lg text-center font-semibold transition-all duration-300 transform';
  const activeClasses = 'bg-accent-blue text-white scale-105 shadow-lg shadow-accent-blue/20 animate-pulse';
  const inactiveClasses = 'bg-gray-700 text-gray-300';

  return (
    <div className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}>
      <p className="capitalize">{name}</p>
    </div>
  );
};

export default AgentNode;
