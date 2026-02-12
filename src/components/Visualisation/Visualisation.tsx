import Subject from '@components/Subject/Subject';
import SmallSubject from '@components/Subject/SmallSubject';
import {addHelperNodesAndGetOffsets, getAllOrGatesPositions, getPositions} from '@utils/Graph';
import VisualisationForeground from '@components/Visualisation/VisualisationForeground';
import VisualisationBackground from '@components/Visualisation/VisualisationBackground';
import { Layout } from '@/consts/VisualisationParameters';
import { useData, useSelectedSpecialization } from "@components/providers/dataProvider";
import { Details, EdgeOffsets, RealPositions, Spec, SubjectData } from '@/types/subjects';

import "./styles.css";

import { useState, useEffect, Dispatch, SetStateAction } from 'react';

type VisualisationProps = {
    scale: number,
    setDragEnabled: Dispatch<SetStateAction<boolean>>
}

type VisualisationState = {
    subjects: Details;
    spec: Spec;
    xOffsets: EdgeOffsets;
    yOffsets: EdgeOffsets;
    positions: RealPositions;
    maxX: number;
    maxY: number;
    orGatesPositions: Array<{x: number, y: number}>;
};

function Visualisation({scale, setDragEnabled}: VisualisationProps) {
    const subjectInfoData: SubjectData = useData();;
    const [visState, setVisState] = useState<VisualisationState>({
        subjects: {},
        spec: {},
        xOffsets: {},
        yOffsets: {},
        positions: {},
        maxX: 0,
        maxY: 0,
        orGatesPositions: []
    });
    const selectedSpecialization = useSelectedSpecialization();

    const SubjectComponent = scale < 0.7 ? SmallSubject : Subject;

    // Calculate positions when new data is loaded
    useEffect(() => {
        const [newDetails, newSpec, xOff, yOff] = addHelperNodesAndGetOffsets(subjectInfoData, selectedSpecialization);
        const [pos, maxX, maxY] = getPositions(newDetails, newSpec, selectedSpecialization);
        const orGatesPositions = getAllOrGatesPositions(newDetails, pos, yOff);
        
        setVisState({
            subjects: newDetails,
            spec: newSpec,
            xOffsets: xOff,
            yOffsets: yOff,
            positions: pos,
            maxX: maxX,
            maxY: maxY,
            orGatesPositions: orGatesPositions
        });
    }, [subjectInfoData, selectedSpecialization]);

    const width = (visState.maxX + 2 * Layout.paddingHorizontal) * scale;
    const height = (visState.maxY + Layout.semesterTitleInset + Layout.semesterColumnBottomPadding + 2 * Layout.paddingVertical) * scale;

    return (
        <div className="visualisationBackgroundWithPadding" 
            style = {{
                width: width,
                height: height,
            }}
        >
            <VisualisationBackground
                maxX={visState.maxX} 
                maxY={visState.maxY}
                semesterCount={Object.keys(visState.spec[selectedSpecialization] ?? []).length}
                processedSpec={visState.spec}
                processedSubjects={visState.subjects}
                scale={scale}
            >
                <VisualisationForeground
                    edgeXOffsets={visState.xOffsets}
                    edgeYOffsets={visState.yOffsets}
                    positions={visState.positions}
                    processedSubjects={visState.subjects}
                    choices={subjectInfoData.choices}
                    SubjectComponent={SubjectComponent}
                    setDragEnabled={setDragEnabled}
                    orGatesPositions={visState.orGatesPositions}
                />
            </VisualisationBackground>
        </div>
    );
}

export default Visualisation