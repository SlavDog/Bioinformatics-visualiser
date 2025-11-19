import subjectInfoData from '@/data/final_tree.json';
import Subject from '@components/Subject/Subject';
import SmallSubject from '@components/Subject/SmallSubject';
import {addHelperNodesAndGetOffsets, getPositions} from '@utils/Graph';
import VisualisationForeground from '@components/Visualisation/VisualisationForeground';
import VisualisationBackground from '@components/Visualisation/VisualisationBackground';
import { Layout } from '@/consts/VisualisationParameters';
import "./Visualisation.css";

import { useState, useEffect } from 'react';

function Visualisation({scale, setDragEnabled}) {
    const [[processedSubjects, processedOrder, edgeXOffsets, edgeYOffsets], setOffsets] = useState([[], [], [], []]);
    const [[positions, maxX, maxY], setPositions] = useState([[], 0, 0]);

    const SubjectComponent = scale < 0.7 ? SmallSubject : Subject;
    const width = (maxX + 2 * Layout.paddingHorizontal) * scale;
    const height = (maxY + Layout.semesterTitleInset + 2 * Layout.paddingVertical) * scale;

    // Calculate positions and offsets only once
    useEffect(() => {
        const offsets = addHelperNodesAndGetOffsets(subjectInfoData);
        setOffsets(offsets);

        const pos = getPositions(offsets[0], offsets[1],
                                 subjectInfoData["choices"]);
        setPositions(pos);
    }, []);

    return (
        <div className="visualisationBox" 
            style = {{
                width: width,
                height: height,
                backgroundColor: "aquamarine",
            }}
        >
            <VisualisationBackground
                maxX={maxX} 
                maxY={maxY}
                semesterCount={Object.keys(processedOrder).length}
                processedOrder={processedOrder}
                processedSubjects={processedSubjects}
                scale={scale}
            >
                <VisualisationForeground
                    edgeXOffsets={edgeXOffsets}
                    edgeYOffsets={edgeYOffsets}
                    positions={positions}
                    processedSubjects={processedSubjects}
                    choices={subjectInfoData["choices"]}
                    SubjectComponent={SubjectComponent}
                    setDragEnabled={setDragEnabled}
                />
            </VisualisationBackground>
        </div>
    );
}

export default Visualisation