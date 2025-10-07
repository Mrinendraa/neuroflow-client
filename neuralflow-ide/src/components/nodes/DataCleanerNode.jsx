import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import './DataCleanerNode.css';
import { FaCogs, FaCog } from 'react-icons/fa';

const DataCleanerNode = ({ data, isConnectable }) => {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [config, setConfig] = useState({
    removeDuplicates: true,
    handleMissingValues: 'drop',
    removeOutliers: false,
    outlierMethod: 'iqr',
    outlierThreshold: 1.5
  });

  const toggleConfig = () => {
    setIsConfigOpen(!isConfigOpen);
  };

  return (
    <div className="data-cleaner-node">
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        style={{ background: '#555' }}
      />
      
      <div className="node-header">
        <FaCogs className="node-icon" />
        <span className="node-title">{data.label}</span>
        <button className="config-button" onClick={toggleConfig}>
          <FaCog className={`gear-icon ${isConfigOpen ? 'rotating' : ''}`} />
        </button>
      </div>

      {isConfigOpen && (
        <div className="config-panel">
          <div className="config-section">
            <label>
              <input
                type="checkbox"
                checked={config.removeDuplicates}
                onChange={(e) => setConfig({...config, removeDuplicates: e.target.checked})}
              />
              Remove Duplicates
            </label>
          </div>
          
          <div className="config-section">
            <label>Handle Missing Values:</label>
            <select
              value={config.handleMissingValues}
              onChange={(e) => setConfig({...config, handleMissingValues: e.target.value})}
            >
              <option value="drop">Drop Rows</option>
              <option value="fill_mean">Fill with Mean</option>
              <option value="fill_median">Fill with Median</option>
              <option value="fill_mode">Fill with Mode</option>
              <option value="interpolate">Interpolate</option>
            </select>
          </div>

          <div className="config-section">
            <label>
              <input
                type="checkbox"
                checked={config.removeOutliers}
                onChange={(e) => setConfig({...config, removeOutliers: e.target.checked})}
              />
              Remove Outliers
            </label>
          </div>

          {config.removeOutliers && (
            <>
              <div className="config-section">
                <label>Outlier Method:</label>
                <select
                  value={config.outlierMethod}
                  onChange={(e) => setConfig({...config, outlierMethod: e.target.value})}
                >
                  <option value="iqr">IQR Method</option>
                  <option value="zscore">Z-Score</option>
                  <option value="isolation">Isolation Forest</option>
                </select>
              </div>

              <div className="config-section">
                <label>Threshold:</label>
                <input
                  type="number"
                  value={config.outlierThreshold}
                  onChange={(e) => setConfig({...config, outlierThreshold: parseFloat(e.target.value)})}
                  step="0.1"
                  min="0.5"
                  max="3"
                />
              </div>
            </>
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

export default DataCleanerNode;
