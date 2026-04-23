import Subject from '@components/Subject/Subject';
import SmallSubject from '@components/Subject/SmallSubject';
import {
    addAuxNodes,
    createDuplicateSubjectDetails,
    getAllOrGatesPositions,
    getCodesToSem,
    getOffsets,
    getPositions
} from '@utils/Graph';
import VisualisationForeground from '@components/Visualisation/VisualisationForeground';
import VisualisationBackground from '@components/Visualisation/VisualisationBackground';
import { Layout } from '@/consts/VisualisationParameters';
import {
    useData,
    useSelectedSpecialization,
    useActiveSubstitutions
} from '@components/providers/dataProvider';
import {
    Details,
    EdgeOffsets,
    OrderSubject,
    CodeToPosition,
    Spec,
    SubjectData
} from '@/types/subjects';

import './styles.css';

import { useState, useEffect, Dispatch, SetStateAction } from 'react';

type VisualisationProps = {
    scale: number;
    setDragEnabled: Dispatch<SetStateAction<boolean>>;
};

type VisualisationState = {
    subjects: Details;
    spec: Spec;
    xOffsets: EdgeOffsets;
    yOffsets: EdgeOffsets;
    positions: CodeToPosition;
    maxX: number;
    maxY: number;
    orGatesPositions: Array<{ x: number; y: number }>;
};

function Visualisation({ scale, setDragEnabled }: VisualisationProps) {
    const subjectInfoData: SubjectData = useData();

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
    const activeSubstitutions = useActiveSubstitutions();
    const [visible, setVisible] = useState(true);
    const [pendingUpdate, setPendingUpdate] = useState(false);
    const [displayedSpecialization, setDisplayedSpecialization] = useState(selectedSpecialization);
    const SubjectComponent = scale < 0.7 ? SmallSubject : Subject;

    useEffect(() => {
        setVisible(false);
        setPendingUpdate(true);
    }, [subjectInfoData, selectedSpecialization, activeSubstitutions]);

    // Calculate positions when new data is loaded
    useEffect(() => {
        if (!pendingUpdate) return;
        const timeout = setTimeout(() => {
            const [codesToSem, dedupedPlan] = getCodesToSem(
                subjectInfoData.choices,
                subjectInfoData.spec[selectedSpecialization].plan,
                subjectInfoData.substitutions
            );
            const patchedData = createDuplicateSubjectDetails(
                subjectInfoData,
                dedupedPlan,
                selectedSpecialization
            );
            const [newDetails, newSpec] = addAuxNodes(
                patchedData,
                selectedSpecialization,
                activeSubstitutions,
                codesToSem
            );
            const [pos, maxX, maxY] = getPositions(
                newDetails,
                newSpec,
                selectedSpecialization,
                codesToSem
            );
            const [xOff, yOff] = getOffsets(
                newDetails,
                pos,
                newSpec[selectedSpecialization].plan,
                codesToSem
            );
            const orGatesPositions = getAllOrGatesPositions(
                newDetails,
                newSpec[selectedSpecialization],
                pos,
                yOff,
                codesToSem
            );

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
            setDisplayedSpecialization(selectedSpecialization);
            setPendingUpdate(false);
            setVisible(true);
        }, 150);
        return () => clearTimeout(timeout);
    }, [pendingUpdate]);

    const width = (visState.maxX + 2 * Layout.paddingHorizontal) * scale;
    const height =
        (visState.maxY +
            Layout.semesterTitleInset +
            Layout.semesterColumnBottomPadding +
            2 * Layout.paddingVertical) *
        scale;

    return (
        <div
            className="visualisationBackgroundWithPadding"
            style={{
                width: width,
                height: height,
                opacity: visible ? 1 : 0,
                transition: 'opacity 0.3s ease'
            }}
        >
            <VisualisationBackground
                maxX={visState.maxX}
                maxY={visState.maxY}
                semesterCount={Object.keys(visState.spec[displayedSpecialization] ?? []).length}
                processedSpec={visState.spec}
                processedSubjects={visState.subjects}
                scale={scale}
            >
                <VisualisationForeground
                    edgeXOffsets={visState.xOffsets}
                    edgeYOffsets={visState.yOffsets}
                    positions={visState.positions}
                    processedSubjects={visState.subjects}
                    specialization={visState.spec[displayedSpecialization] ?? { plan: {} }}
                    choices={subjectInfoData.choices}
                    SubjectComponent={SubjectComponent}
                    setDragEnabled={setDragEnabled}
                    orGatesPositions={visState.orGatesPositions}
                />
            </VisualisationBackground>
        </div>
    );
}

export default Visualisation;
