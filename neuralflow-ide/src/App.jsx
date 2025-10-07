import { ReactFlowProvider } from 'reactflow';
import EditorPage from './pages/EditorPage';

function App() {
  return (
    <ReactFlowProvider>
      <EditorPage />
    </ReactFlowProvider>
  );
}

export default App;