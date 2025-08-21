import Subject from './Subject.jsx'
import subjectData from './order.json';

function App() {
  for (let i = 0; i < 6; i++) {
    console.log(subjectData[i])    
  }
  return (
    <Subject></Subject>
  );
}

export default App
