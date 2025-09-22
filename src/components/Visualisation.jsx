import subjectOrderData from '../data/order.json';
import subjectInfoData from '../data/final_tree.json'
import Subject from './Subject';
import Connections from './Connections';
import { useState, useEffect } from 'react';
import {addHelperNodesAndGetOffsets, getPositions} from '../utils/helperFunctions'

const columnWidth = 400;
const rowHeight = 175;
const subjectHeight = 125;
const subjectWidth = 250;
const padding = 25;
const subjectPadding = 16;

const Visualisation = () => {
    const [[newSubjectInfoData, edgeXOffsets, edgeYOffsets], setOffsets] = useState([[], [], []]);
    const [[positions, maxX, maxY], setPositions] = useState([[], 0, 0]);

    // Calculate positions and offsets only once
    useEffect(() => {
        const offsets = addHelperNodesAndGetOffsets(subjectInfoData, subjectOrderData);
        setOffsets(offsets);

        const pos = getPositions(offsets[0], subjectOrderData,
                                 padding, columnWidth, rowHeight,
                                subjectWidth, subjectHeight, subjectPadding);
        setPositions(pos);
    }, []);

    return (
        <div className="visualisationBox" 
            style = {{
                width: maxX - 75,
                height: maxY + 100,
                display: "grid",
                position: 'relative',
                gridTemplateColumns: "repeat(6, 1fr)"
            }}
        >
            {Array.from({ length: 6 }).map((_, i) => 
                <div key={i} style={{display: 'flex',
                                     justifyContent: 'center',
                                     position: 'absolute',
                                     backgroundColor: i % 2 == 0 ? "#e8e8e8" : "white",
                                     left: i * columnWidth,
                                     top: 0,
                                     height: "100%",
                                     width: columnWidth
                                    }}
                >
                    <p className='semesterTitles'>{i + 1}. Semestr</p>
                </div>
            )}
            <div style={{
              position: 'absolute',
              inset: '100px 0 0 0'
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
                    if (course.semester == 3) {
                        console.log(code);
                    }
                    if (!pos || course.name == "") return null;
                    return (<Subject
                        key={code}
                        code={code}
                        course={course}
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
    );
}

export default Visualisation