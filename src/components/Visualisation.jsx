import subjectInfoData from '../data/final_tree.json'
import Subject from './Subject';
import SmallSubject from './SmallSubject';
import Connections from './Connections';
import { useState, useEffect } from 'react';
import {addHelperNodesAndGetOffsets, getPositions, isInSomeChoice} from '../utils/helperFunctions'

const columnWidth = 325;
const rowHeight = 175;
const subjectHeight = 115;
const subjectWidth = 200;
const padding = 25;
const subjectPadding = 16;

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
                                 padding, columnWidth, rowHeight,
                                 subjectWidth, subjectHeight, subjectPadding);
        setPositions(pos);
    }, []);

    return (
        <div className="visualisationBox" 
            style = {{
                width: (maxX - 75) * scale,
                height: (maxY + 100) * scale,
                display: "grid",
                position: 'relative',
                gridTemplateColumns: "repeat(6, 1fr)",
            }}
        >
            <div
                style={{
                transform: `scale(${scale})`,
                transformOrigin: "0 0",
                transition: "transform 0.2s ease-out",
                width: maxX - 75,
                height: maxY + 300,
                position: "relative"
                }}
            >
                {Array.from({ length: semesterCount }).map((_, i) => {
                    const semesterSubjects = subjectInfoData["order"][i + 1];
                    const semesterCredits = semesterSubjects
                        .map(subject => {
                            if (!subject.code) return 0;
                            const course = newSubjectInfoData[subject.code];
                            return course && course.credits ? Number(course.credits) : 0;
                        })
                        .reduce((acc, c) => acc + c, 0);

                    return (
                        <div key={i} style={{display: 'flex',
                                            flexDirection: 'column',  // přidáno
                                            alignItems: 'center',     // přidáno
                                            position: 'absolute',
                                            backgroundColor: i % 2 == 0 ? "#e8e8e8" : "white",
                                            left: i * columnWidth,
                                            top: 0,
                                            height: "100%",
                                            width: columnWidth
                                            }}
                        >
                            <p className='semesterTitles'>{i + 1}. Semestr</p>
                            <p className='semesterSubtitles'>Celkem kreditů: {semesterCredits}</p>
                        </div>
                    )
                }
                    
                )}
                <div style={{
                    position: 'absolute',
                    inset: '250px 0 0 0'
                }}>
                    <Connections 
                        subjectInfoData={newSubjectInfoData}
                        positions={positions}
                        xOffsets={edgeXOffsets}
                        yOffsets={edgeYOffsets}
                        subjectHeight={subjectHeight}
                        subjectWidth={subjectWidth}
                        subjectPadding={subjectPadding}
                    />
                    {Object.entries(newSubjectInfoData).map(([code, course]) => {
                        const pos = positions[code];
                        if (!pos || course.name == "" || isInSomeChoice(code, subjectInfoData["choices"])) return null;
                        return (<SubjectComponent
                            key={code}
                            code={code}
                            course={course}
                            setDragEnabled={setDragEnabled}
                            style={{
                                position: "absolute",
                                left: positions[code].x,
                                top: positions[code].y,
                                width: subjectWidth,
                                height: subjectHeight,
                                padding: subjectPadding
                            }}
                        />)
                    })}
                </div>
            </div>
        </div>
    );
}

export default Visualisation