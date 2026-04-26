import { Layout } from '@/consts/visualisationParameters';
import DragScrollBox from '@components/Visualisation/DragScrollBox.jsx';
import { SubjectDataProvider } from '@components/providers/dataProvider';

function App() {
    return (
        <div style={{ '--sidebar-width': `${Layout.sidebarWidth}px` } as React.CSSProperties}>
            <SubjectDataProvider>
                <DragScrollBox />
            </SubjectDataProvider>
        </div>
    );
}

export default App;
