import React, { useMemo, useState } from 'react';
import { Handle, Position, useStore, useReactFlow } from 'reactflow';
import './LinearRegressionNode.css';
import { parseFullTabularFile } from '../../utils/parseTabularFile';
import { transpose, multiply, invert } from '../../utils/linearAlgebra';

const MultiLinearRegressionNode = ({ id, data, isConnectable }) => {
  const [selectedX, setSelectedX] = useState([]);
  const [yCol, setYCol] = useState('');
  const [isTraining, setIsTraining] = useState(false);
  const [trainMsg, setTrainMsg] = useState('');
  const { setNodes } = useReactFlow();

  const upstreamData = useStore((store) => {
    const incoming = Array.from(store.edges.values()).filter((e) => e.target === id);
    for (const e of incoming) {
      const src = store.nodeInternals.get(e.source);
      if (src?.type === 'csvReader') {
        return { 
          type: 'csv', 
          headers: src.data?.headers || [], 
          file: src.data?.file 
        };
      }
      if (src?.type === 'encoder') {
        return { 
          type: 'encoded', 
          headers: src.data?.headers || [], 
          encodedRows: src.data?.encodedRows || [],
          encodingInfo: src.data?.encodingInfo || {}
        };
      }
    }
    return null;
  });

  const headers = useMemo(() => upstreamData?.headers || [], [upstreamData]);

  const toggleX = (h) => {
    setSelectedX((prev) => (prev.includes(h) ? prev.filter((c) => c !== h) : [...prev, h]));
  };

  const onRun = async () => {
    setTrainMsg('');
    if (!upstreamData) {
      alert('Please connect a CSV/Excel node or Encoder node.');
      return;
    }
    if (selectedX.length === 0 || !yCol) {
      alert('Please select at least one independent column and one dependent column.');
      return;
    }
    setIsTraining(true);
    try {
      let rows;
      
      if (upstreamData.type === 'csv') {
        // Parse from CSV file
        const parsed = await parseFullTabularFile(upstreamData.file);
        rows = parsed.rows;
      } else if (upstreamData.type === 'encoded') {
        // Use pre-encoded data
        rows = upstreamData.encodedRows;
      } else {
        throw new Error('Unknown data source type.');
      }

      const xIdx = selectedX.map((c) => headers.indexOf(c));
      const yIdx = headers.indexOf(yCol);
      if (xIdx.some((i) => i === -1) || yIdx === -1) throw new Error('Selected columns not found.');

      const X = []; // with intercept term
      const Y = [];
      for (const r of rows) {
        const xRow = [1];
        let valid = true;
        for (const i of xIdx) {
          const v = parseFloat(r[i]);
          if (!Number.isFinite(v)) { valid = false; break; }
          xRow.push(v);
        }
        const yv = parseFloat(r[yIdx]);
        if (!Number.isFinite(yv)) valid = false;
        if (!valid) continue;
        X.push(xRow);
        Y.push([yv]);
      }
      if (X.length < selectedX.length + 1) throw new Error('Not enough valid rows to fit the model.');

      // OLS: beta = (X^T X)^{-1} X^T y
      const Xt = transpose(X);
      let XtX = multiply(Xt, X);
      // Add small ridge regularization on diagonal to avoid singular matrices
      const lambda = 1e-6;
      for (let d = 0; d < XtX.length; d++) {
        XtX[d][d] += lambda;
      }
      const XtXInv = invert(XtX);
      const XtY = multiply(Xt, Y);
      const Beta = multiply(XtXInv, XtY); // (k+1) x 1

      const intercept = Beta[0][0];
      const coefficients = Beta.slice(1).map((b) => b[0]);
      const parts = coefficients.map((c, i) => `${c.toFixed(4)}*${selectedX[i]}`);
      setTrainMsg(`Done. y = ${intercept.toFixed(4)} + ${parts.join(' + ')}`);

      setNodes((nds) => nds.map((n) => {
        if (n.id !== id) return n;
        return { ...n, data: { ...n.data, model: { intercept, coefficients, xCols: selectedX, yCol } } };
      }));
      alert('Multi Linear Regression training finished.');
    } catch (err) {
      setTrainMsg(err?.message || 'Training failed.');
    } finally {
      setIsTraining(false);
    }
  };

  return (
    <div className="linear-regression-node">
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} style={{ background: '#555' }} />

      <div className="node-header">
        <span className="node-title">{data.label || 'Multi Linear Regression'}</span>
      </div>

      {headers.length > 0 && (
        <div className="lr-selects">
          <div className="lr-row">
            <label>Independent (X columns):</label>
            <div className="mlr-columns">
              {headers.map((h) => (
                <label key={h} className="mlr-option">
                  <input type="checkbox" checked={selectedX.includes(h)} onChange={() => toggleX(h)} />
                  <span>{h}</span>
                </label>
              ))}
            </div>
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

      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} style={{ background: '#555' }} />
    </div>
  );
};

export default MultiLinearRegressionNode;


