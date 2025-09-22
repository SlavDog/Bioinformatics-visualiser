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
    
const Visualisation = () => {
    const [[newSubjectInfoData, edgeXOffsets, edgeYOffsets], setOffsets] = useState([[], [], []]);
    const [[positions, maxX, maxY], setPositions] = useState([[], 0, 0]);

    // Calculate positions and offsets only once
    useEffect(() => {
        const offsets = addHelperNodesAndGetOffsets(subjectInfoData, subjectOrderData);
        setOffsets(offsets);

        const pos = getPositions(offsets[0], subjectOrderData,
                                 padding, columnWidth, rowHeight);
        setPositions(pos);
    }, []);

    return (
        <div className="visualisationBox" 
                style = {{
                    width: maxX - 75,
                    height: maxY
                }}
        >
            <Connections 
                subjectInfoData={newSubjectInfoData}
                positions={positions}
                xOffsets={edgeXOffsets}
                yOffsets={edgeYOffsets}
                subjectHeight={subjectHeight}
                subjectWidth={subjectWidth}
            />
            {Object.entries(newSubjectInfoData).map(([code, course]) => {
                const pos = positions[code];
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
                        height: subjectHeight
                    }}
                />)
            })}
        </div> 
    );
}

export default Visualisation