import React, { useMemo, useState } from 'react';
import { Handle, Position, useStore, useReactFlow } from 'reactflow';
import './LinearRegressionNode.css';
import { FaChartLine, FaCog } from 'react-icons/fa';
import { parseFullTabularFile } from '../../utils/parseTabularFile';

const LinearRegressionNode = ({ id, data, isConnectable }) => {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [config, setConfig] = useState({
    learningRate: 0.01,
    maxIterations: 1000,
    regularization: 'none',
    alpha: 0.1
  });
  const [xCol, setXCol] = useState('');
  const [yCol, setYCol] = useState('');
  const [isTraining, setIsTraining] = useState(false);
  const [trainMsg, setTrainMsg] = useState('');
  const { setNodes } = useReactFlow();

  // Inspect incoming edge to find the upstream CSV node and its headers/file
  const upstreamCsv = useStore((store) => {
    const incoming = Array.from(store.edges.values()).filter((e) => e.target === id);
    if (incoming.length === 0) return null;
    for (const e of incoming) {
      const src = store.nodeInternals.get(e.source);
      if (src?.type === 'csvReader') {
        return { headers: src.data?.headers || [], file: src.data?.file };
      }
    }
    return null;
  });

  const headers = useMemo(() => upstreamCsv?.headers || [], [upstreamCsv]);

  const toggleConfig = () => {
    setIsConfigOpen(!isConfigOpen);
  };

  const onRun = async () => {
    setTrainMsg('');
    if (!upstreamCsv?.file) {
      alert('Please connect a CSV/Excel node with a loaded file.');
      return;
    }
    if (!xCol || !yCol) {
      alert('Please select both independent (X) and dependent (Y) columns.');
      return;
    }
    setIsTraining(true);
    try {
      const { headers: hs, rows } = await parseFullTabularFile(upstreamCsv.file);
      const xi = hs.indexOf(xCol);
      const yi = hs.indexOf(yCol);
      if (xi === -1 || yi === -1) throw new Error('Selected columns not found.');
      const X = [];
      const Y = [];
      for (const r of rows) {
        const xv = parseFloat(r[xi]);
        const yv = parseFloat(r[yi]);
        if (!Number.isFinite(xv) || !Number.isFinite(yv)) continue;
        X.push(xv);
        Y.push(yv);
      }
      if (X.length < 2) throw new Error('Not enough numeric rows for training.');

      // Simple linear regression (least squares)
      const n = X.length;
      const sumX = X.reduce((a, b) => a + b, 0);
      const sumY = Y.reduce((a, b) => a + b, 0);
      const sumXY = X.reduce((acc, x, i) => acc + x * Y[i], 0);
      const sumXX = X.reduce((acc, x) => acc + x * x, 0);
      const denom = n * sumXX - sumX * sumX;
      if (denom === 0) throw new Error('Degenerate data; cannot fit line.');
      const slope = (n * sumXY - sumX * sumY) / denom;
      const intercept = (sumY - slope * sumX) / n;

      setTrainMsg(`Training complete. y = ${slope.toFixed(4)} x + ${intercept.toFixed(4)}`);
      // Persist model info on this node's data for downstream nodes (visualizer)
      setNodes((nds) => nds.map((n) => {
        if (n.id !== id) return n;
        return { ...n, data: { ...n.data, model: { slope, intercept, xCol, yCol } } };
      }));
      alert('Linear Regression training finished.');
    } catch (err) {
      setTrainMsg(err?.message || 'Training failed.');
    } finally {
      setIsTraining(false);
    }
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

      {headers.length > 0 && (
        <div className="lr-selects">
          <div className="lr-row">
            <label>Independent (X):</label>
            <select value={xCol} onChange={(e) => setXCol(e.target.value)}>
              <option value="">Select column</option>
              {headers.map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>
          <div className="lr-row">
            <label>Dependent (Y):</label>
            <select value={yCol} onChange={(e) => setYCol(e.target.value)}>
              <option value="">Select column</option>
              {headers.map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>
          <div className="lr-actions">
            <button className="btn primary" onClick={onRun} disabled={isTraining}> {isTraining ? 'Running…' : 'Run'} </button>
          </div>
          {trainMsg && <div className="lr-msg">{trainMsg}</div>}
        </div>
      )}

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
