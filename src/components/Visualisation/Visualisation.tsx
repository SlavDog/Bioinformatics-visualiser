import Subject from '@components/Subject/Subject';
import SmallSubject from '@components/Subject/SmallSubject';
import {addHelperNodesAndGetOffsets, getPositions} from '@utils/Graph';
import VisualisationForeground from '@components/Visualisation/VisualisationForeground';
import VisualisationBackground from '@components/Visualisation/VisualisationBackground';
import { Layout } from '@/consts/VisualisationParameters';
import { useData } from "@components/providers/dataProvider";
import { Details, EdgeOffsets, Order, SubjectData } from '@/types/subjects';

import "./styles.css";

import { useState, useEffect, Dispatch, SetStateAction } from 'react';

type VisualisationProps = {
    scale: number,
    setDragEnabled: Dispatch<SetStateAction<boolean>>
}

function Visualisation({scale, setDragEnabled}: VisualisationProps) {
    const subjectInfoData: SubjectData = useData();;
    const [[processedSubjects, processedOrder, edgeXOffsets, edgeYOffsets], setOffsets] = useState<[Details, Order, EdgeOffsets, EdgeOffsets]>([{}, {}, {}, {}]);
    const [[positions, maxX, maxY], setPositions] = useState([{}, 0, 0]);

    const SubjectComponent = scale < 0.7 ? SmallSubject : Subject;
    const width = (maxX + 2 * Layout.paddingHorizontal) * scale;
    const height = (maxY + Layout.semesterTitleInset + Layout.semesterColumnBottomPadding + 2 * Layout.paddingVertical) * scale;

    // Calculate positions when new data is loaded
    useEffect(() => {
        const offsets = addHelperNodesAndGetOffsets(subjectInfoData);
        setOffsets(offsets);

        const pos = getPositions(offsets[0], offsets[1],
                                 subjectInfoData["choices"]);
        setPositions(pos);
    }, [subjectInfoData]);

    console.log(edgeXOffsets);

    return (
        <div className="visualisationBackgroundWithPadding" 
            style = {{
                width: width,
                height: height,
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