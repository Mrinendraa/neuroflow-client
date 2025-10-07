import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import './LinearRegressionNode.css';
import { FaChartLine, FaCog } from 'react-icons/fa';

const LinearRegressionNode = ({ data, isConnectable }) => {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [config, setConfig] = useState({
    learningRate: 0.01,
    maxIterations: 1000,
    regularization: 'none',
    alpha: 0.1
  });

  const toggleConfig = () => {
    setIsConfigOpen(!isConfigOpen);
  };

  return (
    <div className="linear-regression-node">
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        style={{ background: '#555' }}
      />
      
      <div className="node-header">
        <FaChartLine className="node-icon" />
        <span className="node-title">{data.label}</span>
        <button className="config-button" onClick={toggleConfig}>
          <FaCog className={`gear-icon ${isConfigOpen ? 'rotating' : ''}`} />
        </button>
      </div>

      {isConfigOpen && (
        <div className="config-panel">
          <div className="config-section">
            <label>Learning Rate:</label>
            <input
              type="number"
              value={config.learningRate}
              onChange={(e) => setConfig({...config, learningRate: parseFloat(e.target.value)})}
              step="0.001"
              min="0"
              max="1"
            />
          </div>
          
          <div className="config-section">
            <label>Max Iterations:</label>
            <input
              type="number"
              value={config.maxIterations}
              onChange={(e) => setConfig({...config, maxIterations: parseInt(e.target.value)})}
              min="1"
              max="10000"
            />
          </div>

          <div className="config-section">
            <label>Regularization:</label>
            <select
              value={config.regularization}
              onChange={(e) => setConfig({...config, regularization: e.target.value})}
            >
              <option value="none">None</option>
              <option value="l1">L1 (Lasso)</option>
              <option value="l2">L2 (Ridge)</option>
              <option value="elastic">Elastic Net</option>
            </select>
          </div>

          {config.regularization !== 'none' && (
            <div className="config-section">
              <label>Alpha:</label>
              <input
                type="number"
                value={config.alpha}
                onChange={(e) => setConfig({...config, alpha: parseFloat(e.target.value)})}
                step="0.01"
                min="0"
                max="1"
              />
            </div>
          )}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        style={{ background: '#555' }}
      />
    </div>
  );
};

export default LinearRegressionNode;
