import subjectInfoData from '../data/final_tree.json'
import Subject from './Subject';
import SmallSubject from './SmallSubject';
import Connections from './Connections';
import { useState, useEffect } from 'react';
import {addHelperNodesAndGetOffsets, getPositions, getUniquePredGroups, isInSomeChoice, getYOffsetForOrGroup} from '../utils/helperFunctions'
import OrGates from './OrGates';
import SemesterColumn from './SemesterColumn';


const Layout = {
    columnWidth: 325,
    rowHeight: 175,
    subjectHeight: 115,
    subjectWidth: 200,
    padding: 25,
    subjectPadding: 16,
}


const Visualisation = ({scale, setDragEnabled}) => {
    const [[newSubjectInfoData, edgeXOffsets, edgeYOffsets], setOffsets] = useState([[], [], []]);
    const [[positions, maxX, maxY], setPositions] = useState([[], 0, 0]);
    const semesterCount = Object.keys(subjectInfoData["order"]).length;
    const SubjectComponent = scale < 0.7 ? SmallSubject : Subject;

    // Calculate positions and offsets only once
    useEffect(() => {
        const offsets = addHelperNodesAndGetOffsets(subjectInfoData);
        setOffsets(offsets);

        const pos = getPositions(offsets[0], subjectInfoData["order"],
                                 subjectInfoData["choices"],
                                 Layout.padding, Layout.columnWidth, Layout.rowHeight,
                                 Layout.subjectWidth, Layout.subjectHeight, Layout.subjectPadding);
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
                            columnWidth={Layout.columnWidth}
                            index={i} 
                            semesterSubjects={subjectInfoData["order"][i + 1]}
                            subjectInfoData={newSubjectInfoData}
                        />
                    )
                }
                    
                )}
                <div className="visualisationForeground">
                    <Connections 
                        subjectInfoData={newSubjectInfoData}
                        positions={positions}
                        xOffsets={edgeXOffsets}
                        yOffsets={edgeYOffsets}
                        subjectHeight={Layout.subjectHeight}
                        subjectWidth={Layout.subjectWidth}
                        subjectPadding={Layout.subjectPadding}
                    />
                    {Object.entries(newSubjectInfoData).map(([code, course]) => {
                        const pos = positions[code];
                        if (!pos || course.name == "" || isInSomeChoice(code, subjectInfoData["choices"])) { return null; }

                        let hasOrGate = course.predecessors.some(pred => pred.groups.length > 0) &&
                            course.predecessors
                                .some(pred => pred.groups
                                .some(g => g
                                    .filter(s => newSubjectInfoData[s]).length > 1));

                        let orGatesPositions = hasOrGate ? getUniquePredGroups(course)
                            .filter(group => group.length > 1)
                            .map(group => {
                                let yOffset = getYOffsetForOrGroup(edgeYOffsets, group, code);
                                yOffset + Layout.subjectHeight / 2 + 15;
                            }) : [];

                        return (<>
                            <SubjectComponent
                                code={code}
                                key={code}
                                course={course}
                                setDragEnabled={setDragEnabled}
                                style={{
                                    position: "absolute",
                                    left: positions[code].x,
                                    top: positions[code].y,
                                    width: Layout.subjectWidth,
                                    height: Layout.subjectHeight,
                                    padding: Layout.subjectPadding
                                }}
                            />
                            {hasOrGate && <OrGates 
                                orGatesPositions={orGatesPositions} 
                                positions={positions}
                                code={code}
                            />}
                        </>)
                    })}
                </div>
            </div>
        </div>
    );
}

export default Visualisation