import subjectInfoData from '@/data/final_tree.json'
import Subject from '@components/Subject/Subject';
import SmallSubject from '@components/Subject/SmallSubject';
import Connections from '@components/Visualisation/Connections';
import OrGates from '@components/Visualisation/OrGates';
import SemesterColumn from '@components/Visualisation/SemesterColumn';
import { Layout } from '@/consts/VisualisationParameters';
import {addHelperNodesAndGetOffsets, getPositions, isInSomeChoice} from '@utils/Graph'
import { getOrGatesPositionsForSubject } from '@utils/Graph';
import VisualisationForeground from '@components/Visualisation/VisualisationForeground';

import { useState, useEffect } from 'react';

const Visualisation = ({scale, setDragEnabled}) => {
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
            <div className="visualisationBackground"
                style={{
                    transform: `scale(${scale})`,
                    width: maxX - 75,
                    height: maxY + 300,
                }}
            >
                {Array.from({ length: semesterCount }).map((_, i) => {
                    return (
                        <SemesterColumn 
                            index={i} 
                            semesterSubjects={subjectInfoData["order"][i + 1]}
                            subjectInfoData={processedSubjects}
                        />
                    )
                }
                    
                )}
                <VisualisationForeground
                    edgeXOffsets={edgeXOffsets}
                    edgeYOffsets={edgeYOffsets}
                    positions={positions}
                    processedSubjects={processedSubjects}
                    subjectInfoData={subjectInfoData}
                    SubjectComponent={SubjectComponent}
                    setDragEnabled={setDragEnabled}
                />
            </div>
        </div>
    );
}

export default Visualisation