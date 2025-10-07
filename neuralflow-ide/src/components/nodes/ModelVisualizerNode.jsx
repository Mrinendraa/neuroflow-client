import React, { useMemo } from 'react';
import { Handle, Position, useStore } from 'reactflow';
import './ModelVisualizerNode.css';
import { parseFullTabularFile } from '../../utils/parseTabularFile';

const width = 260;
const height = 180;
const padding = 24;

function scatterAndLine(points, slope, intercept, xDomain, yDomain) {
  const [xMin, xMax] = xDomain;
  const [yMin, yMax] = yDomain;
  const scaleX = (x) => padding + ((x - xMin) / (xMax - xMin)) * (width - 2 * padding);
  const scaleY = (y) => height - padding - ((y - yMin) / (yMax - yMin)) * (height - 2 * padding);

  const dots = points.map((p, i) => (
    <circle key={i} cx={scaleX(p[0])} cy={scaleY(p[1])} r={2} fill="#1976d2" />
  ));

  const x1 = xMin;
  const y1 = slope * x1 + intercept;
  const x2 = xMax;
  const y2 = slope * x2 + intercept;

  return { dots, line: (
    <line x1={scaleX(x1)} y1={scaleY(y1)} x2={scaleX(x2)} y2={scaleY(y2)} stroke="#d32f2f" strokeWidth="2" />
  ) };
}

function ModelVisualizerNode({ id, data }) {
  // Walk upstream graph to find linearRegression (with model) and csvReader (with data)
  const upstream = useStore((store) => {
    const edges = Array.from(store.edges.values());
    const nodes = store.nodeInternals;
    const visited = new Set();
    const stack = [id];
    const result = { model: null, csv: null };
    while (stack.length) {
      const targetId = stack.pop();
      if (visited.has(targetId)) continue;
      visited.add(targetId);
      const incoming = edges.filter((e) => e.target === targetId);
      for (const e of incoming) {
        const src = nodes.get(e.source);
        if (!src) continue;
        // capture model from linear regression
        if (!result.model && src.type === 'linearRegression' && src.data?.model) {
          result.model = src.data.model;
        }
        // capture csv
        if (!result.csv && src.type === 'csvReader' && src.data?.file && src.data?.headers) {
          result.csv = { file: src.data.file, headers: src.data.headers };
        }
        // continue walking upstream until we found both
        if (!(result.model && result.csv)) {
          stack.push(src.id);
        }
      }
      if (result.model && result.csv) break;
    }
    return result;
  });

  const [viz, setViz] = React.useState({ points: [], xDomain: [0, 1], yDomain: [0, 1] });

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!upstream.model || !upstream.csv) return;
      const { headers, file } = upstream.csv;
      const { xCol, yCol } = upstream.model;
      if (!xCol || !yCol) return;
      const { headers: hs, rows } = await parseFullTabularFile(file);
      const xi = hs.indexOf(xCol);
      const yi = hs.indexOf(yCol);
      if (xi === -1 || yi === -1) return;
      const pts = [];
      for (const r of rows) {
        const xv = parseFloat(r[xi]);
        const yv = parseFloat(r[yi]);
        if (!Number.isFinite(xv) || !Number.isFinite(yv)) continue;
        pts.push([xv, yv]);
      }
      if (pts.length < 2) return;
      const xs = pts.map(p => p[0]);
      const ys = pts.map(p => p[1]);
      const xMin = Math.min(...xs);
      const xMax = Math.max(...xs);
      const yMin = Math.min(...ys);
      const yMax = Math.max(...ys);
      if (!cancelled) setViz({ points: pts, xDomain: [xMin, xMax], yDomain: [yMin, yMax] });
    }
    load();
    return () => { cancelled = true; };
  }, [upstream]);

  const hasEverything = upstream.model && upstream.csv && viz.points.length > 0;
  const content = useMemo(() => {
    if (!hasEverything) return null;
    const { slope, intercept } = upstream.model;
    // guard against zero ranges
    const xr = viz.xDomain[0] === viz.xDomain[1]
      ? [viz.xDomain[0] - 1, viz.xDomain[1] + 1]
      : viz.xDomain;
    const yr = viz.yDomain[0] === viz.yDomain[1]
      ? [viz.yDomain[0] - 1, viz.yDomain[1] + 1]
      : viz.yDomain;
    const { dots, line } = scatterAndLine(viz.points, slope, intercept, xr, yr);
    return (
      <svg width={width} height={height}>
        <rect x="0" y="0" width={width} height={height} fill="#fff" stroke="#eee" />
        {dots}
        {line}
      </svg>
    );
  }, [hasEverything, upstream, viz]);

  return (
    <div className="model-visualizer-node">
      <div className="mv-title">Model Visualizer</div>
      {hasEverything ? content : <div className="mv-placeholder">Connect Linear Regression (trained) and CSV nodes</div>}
      <Handle type="target" position={Position.Top} />
      <Handle type="target" position={Position.Left} />
    </div>
  );
}

export default ModelVisualizerNode;


