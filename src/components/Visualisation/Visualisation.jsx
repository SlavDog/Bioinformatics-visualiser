import subjectInfoData from '@/data/final_tree.json'
import Subject from '@components/Subject/Subject';
import SmallSubject from '@components/Subject/SmallSubject';
import {addHelperNodesAndGetOffsets, getPositions} from '@utils/Graph'
import VisualisationForeground from '@components/Visualisation/VisualisationForeground';
import VisualisationBackground from '@components/Visualisation/VisualisationBackground';

import { useState, useEffect } from 'react';

function Visualisation({scale, setDragEnabled}) {
    const [[processedSubjects, edgeXOffsets, edgeYOffsets], setOffsets] = useState([[], [], []]);
    const [[positions, maxX, maxY], setPositions] = useState([[], 0, 0]);

    const semesterCount = Object.keys(subjectInfoData["order"]).length;
    const SubjectComponent = scale < 0.7 ? SmallSubject : Subject;

    // Calculate positions and offsets only once
    useEffect(() => {
        const offsets = addHelperNodesAndGetOffsets(subjectInfoData);
        setOffsets(offsets);

        const pos = getPositions(offsets[0], subjectInfoData["order"],
                                 subjectInfoData["choices"]);
        setPositions(pos);
    }, []);

    return (
        <div className="visualisationBox" 
            style = {{
                width: (maxX - 75) * scale,
                height: (maxY + 100) * scale,
            }}
        >
            <VisualisationBackground
                maxX={maxX} 
                maxY={maxY}
                semesterCount={semesterCount}
                subjectInfoData={subjectInfoData}
                processedSubjects={processedSubjects}
                scale={scale}
            >
                <VisualisationForeground
                    edgeXOffsets={edgeXOffsets}
                    edgeYOffsets={edgeYOffsets}
                    positions={positions}
                    processedSubjects={processedSubjects}
                    subjectInfoData={subjectInfoData}
                    SubjectComponent={SubjectComponent}
                    setDragEnabled={setDragEnabled}
                />
            </VisualisationBackground>
        </div>
    );
}

export default Visualisation