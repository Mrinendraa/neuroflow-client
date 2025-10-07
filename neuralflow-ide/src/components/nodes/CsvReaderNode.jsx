import React from 'react';
import { Handle, Position } from 'reactflow';
import './CsvReaderNode.css';
// We'll remove the icon for this simpler design or keep it subtle
// import { FaTable } from 'react-icons/fa';

function CsvReaderNode({ data }) {
  return (
    <div className="csv-reader-node minimal"> {/* Added 'minimal' class */}
      {/* No header in this simpler version, just the label */}
      <div className="node-label">{data.label || 'Node'}</div>

      {/* Input handles */}
      <Handle type="target" position={Position.Top} className="custom-handle" id="a" />
      <Handle type="target" position={Position.Left} className="custom-handle" id="b" />

      {/* Output handles */}
      <Handle type="source" position={Position.Bottom} className="custom-handle" id="c" />
      <Handle type="source" position={Position.Right} className="custom-handle" id="d" />
    </div>
  );
}

export default CsvReaderNode;