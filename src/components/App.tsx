import DragScrollBox from '@components/Visualisation/DragScrollBox.jsx';
import { SubjectDataProvider } from '@/components/providers/dataProvider';

function App() {
  return (
    <>
      <SubjectDataProvider>
        <DragScrollBox/>
      </SubjectDataProvider>
    </>
  );
}

export default App
