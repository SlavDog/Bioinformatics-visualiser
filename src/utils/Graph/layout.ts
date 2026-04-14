import { Layout } from '@/consts/VisualisationParameters';
import { getUniquePredGroups } from '@utils/Graph/orGroups';
import { getYOffsetForOrGroup } from '@utils/Graph/offsets';
import {
    CodeToPosition,
    Coordinates,
    Course,
    Details,
    EdgeOffsets,
    OrderSubject,
    PositionToCode,
    Spec,
    Specialization
} from '@/types/subjects';

/** Maximum number of attempts to find a valid position for a subject */
const MAX_POSITION_ATTEMPTS = 20;

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Main entry point for the layout calculation.
 * Converts a study plan structure into specific pixel coordinates for rendering.
 * @param {Details} details - Catalog of all subjects and their metadata.
 * @param {Spec} spec - Specification of study programs/specializations.
 * @param {string} selectedSpecialization - ID of the currently active specialization.
 * @param {Record<string, number>} codesToSem - Mapping of subject codes to their recommended semester indices.
 * @returns {[CodeToPosition, number, number]} A tuple containing [coordinate map, total width, total height].
 */
export function getPositions(
    details: Details,
    spec: Spec,
    selectedSpecialization: string,
    codesToSem: Record<string, number>
): [CodeToPosition, number, number] {
    const plan = spec[selectedSpecialization].plan;
    let semestersCount = Object.keys(plan).length;
    const codeToPosition: CodeToPosition = {};
    const positionToCode: PositionToCode = Array.from({ length: semestersCount }, () => []);
    const currentSpecializationCodes = new Set(
        Object.values(plan)
            .flat()
            .map((subject) => getSubjectCode(subject))
    );

    Object.values(plan).forEach((semesterArray, semesterIndex) => {
        semesterArray.forEach((subject) => {
            let code = getSubjectCode(subject);

            if (isAlreadyPlaced(code, codeToPosition, details, currentSpecializationCodes)) {
                return;
            }

            const placement = findValidPlacement(
                code,
                semesterIndex,
                semestersCount,
                details,
                codeToPosition,
                positionToCode,
                currentSpecializationCodes,
                codesToSem
            );

            if (placement) {
                mergePlacements(codeToPosition, positionToCode, placement);
            }
        });
    });
    return getRealPositionsAndBoundaries(codeToPosition);
}

/**
 * Recursively places a subject node and its entire subtree of successors into the grid.
 * @param {Details} details - Catalog of subjects.
 * @param {number} semesterIndex - The horizontal index (X-axis).
 * @param {number} positionIndex - The vertical index (Y-axis).
 * @param {string} code - Code of the subject currently being placed.
 * @param {CodeToPosition} codeToPosition - Global map of already confirmed positions.
 * @param {PositionToCode} positionToCode - Global grid of occupied slots.
 * @param {CodeToPosition} tempCodeToCoordinates - Temporary coordinate map for the current placement transaction.
 * @param {PositionToCode} tempPositionsToCode - Temporary occupancy grid for the current transaction.
 * @param {Set<string>} currentSpecializationCodes - Set of codes valid for the current plan.
 * @param {Record<string, number>} codesToSem - Recommended semesters mapping.
 * @returns {false | number} Returns the number of vertical slots consumed by the subtree, or false if placement is blocked.
 */
export function getTreePositions(
    details: Details,
    semesterIndex: number,
    positionIndex: number,
    code: string,
    codeToPosition: CodeToPosition,
    positionToCode: PositionToCode,
    tempCodeToCoordinates: CodeToPosition,
    tempPositionsToCode: PositionToCode,
    currentSpecializationCodes: Set<string>,
    codesToSem: Record<string, number>
): false | number {
    if (isPositionOccupied(semesterIndex, positionIndex, positionToCode, tempPositionsToCode)) {
        return false;
    }

    // Node already placed or semester doesn't match the one in data
    if (
        shouldSkipPlacement(
            code,
            semesterIndex,
            codeToPosition,
            tempCodeToCoordinates,
            codesToSem,
            details,
            currentSpecializationCodes
        )
    ) {
        return 0;
    }

    const nextAvailableY = placeSuccessors(
        code,
        semesterIndex,
        positionIndex,
        details,
        codesToSem,
        codeToPosition,
        positionToCode,
        tempCodeToCoordinates,
        tempPositionsToCode,
        currentSpecializationCodes
    );

    if (nextAvailableY === false) {
        return false;
    }

    tempCodeToCoordinates[code] = { x: semesterIndex, y: positionIndex };
    tempPositionsToCode[semesterIndex][positionIndex] = code;
    return nextAvailableY - positionIndex || 1;
}

/**
 * Performs a Breadth-First Search (BFS) to find all nodes reachable from a starting point.
 * @param {string} startCode - The starting subject code.
 * @param {Details} details - Subject catalog containing graph edges.
 * @param {boolean} [searchPredecessorEdges=true] - If true, the search also traverses towards prerequisites.
 * @returns {string[]} An array of unique reachable subject codes.
 */
export function getReachableCodes(
    startCode: string,
    details: Details,
    searchPredecessorEdges: boolean = true
): string[] {
    if (details[startCode] == null) {
        return [];
    }

    const visited = new Set<string>([startCode]);
    const queue = [startCode];

    while (queue.length > 0) {
        const currentCode = queue.shift();
        if (!currentCode) continue;

        const course = details[currentCode];
        const succs = (course.successors ?? []).map((s) => s.code);
        const preds = searchPredecessorEdges ? (course.predecessors ?? []).map((p) => p.code) : [];

        [...succs, ...preds].forEach((neighbour) => {
            if (neighbour && !visited.has(neighbour) && details[neighbour]) {
                visited.add(neighbour);
                queue.push(neighbour);
            }
        });
    }

    return Array.from(visited);
}

/**
 * Calculates Y-axis offsets for visualizing "OR gates" (logical prerequisite groups).
 * @param {string} code - The subject code.
 * @param {Course} course - The course object.
 * @param {Details} processedSubjects - Map of already processed subjects.
 * @param {EdgeOffsets} edgeYOffsets - Existing edge offsets.
 * @param {Record<string, number>} codesToSem - Recommended semesters mapping.
 * @returns {Array<number>} An array of Y-offsets for the gate connection points.
 */
export function getOrGatesYOffsetsForSubject(
    code: string,
    course: Course,
    processedSubjects: Details,
    edgeYOffsets: EdgeOffsets,
    codesToSem: Record<string, number>
): Array<number> {
    if (!hasOrGate(code, course, processedSubjects, codesToSem)) {
        return [];
    }

    return getUniquePredGroups(course)
        .filter((group) => group.length > 1)
        .map((group) => {
            let yOffset = getYOffsetForOrGroup(edgeYOffsets, group, code);
            if (yOffset != undefined) {
                return yOffset + Layout.subjectHeight / 2 + 15;
            }
        })
        .filter((element) => element != undefined);
}

/**
 * Scans the specialization plan and collects coordinates for all OR gates in the graph.
 * @param {Details} details - Catalog of subjects.
 * @param {Specialization} specialization - Current specialization object.
 * @param {CodeToPosition} positions - Calculated pixel positions of subjects.
 * @param {EdgeOffsets} edgeYOffsets - Offsets used for edge rendering.
 * @param {Record<string, number>} codesToSem - Recommended semesters mapping.
 * @returns {Coordinates[]} An array of {x, y} coordinates for all found gates.
 */
export function getAllOrGatesPositions(
    details: Details,
    specialization: Specialization,
    positions: CodeToPosition,
    edgeYOffsets: EdgeOffsets,
    codesToSem: Record<string, number>
): Coordinates[] {
    const specializationCodes = new Set(
        Object.values(specialization.plan).flat().map(getSubjectCode)
    );

    return Object.entries(details)
        .filter(
            ([code, course]) =>
                specializationCodes.has(code) && hasOrGate(code, course, details, codesToSem)
        )
        .flatMap(([code, course]) => {
            const x = positions[code].x;
            return getOrGatesYOffsetsForSubject(
                code,
                course,
                details,
                edgeYOffsets,
                codesToSem
            ).map((yOffset) => ({ x, y: yOffset + positions[code].y - 15 }));
        });
}

// ─── Layout helpers ───────────────────────────────────────────────────────────

/**
 * Search strategy to find a valid coordinate. It attempts different Y indices
 * until the node and its subtree can be placed without overlapping existing elements.
 * @returns {[CodeToPosition, PositionToCode] | null} A tuple of placement maps, or null if no valid position was found.
 */
function findValidPlacement(
    code: string,
    semesterIndex: number,
    semestersCount: number,
    details: Details,
    globalCoords: CodeToPosition,
    globalPos: PositionToCode,
    specCodes: Set<string>,
    codesToSem: Record<string, number>
): [CodeToPosition, PositionToCode] | null {
    for (let positionIndex = 0; positionIndex < MAX_POSITION_ATTEMPTS; positionIndex++) {
        let tempCoords = {};
        let tempPos = Array.from({ length: semestersCount }, () => []);

        const isTreeOk = getTreePositions(
            details,
            semesterIndex,
            positionIndex,
            code,
            globalCoords,
            globalPos,
            tempCoords,
            tempPos,
            specCodes,
            codesToSem
        );
        if (isTreeOk === false) {
            continue;
        }
        const arePredsOk = addMissedPredecessorsPositions(
            details,
            globalCoords,
            globalPos,
            tempCoords,
            tempPos,
            codesToSem
        );

        if (arePredsOk) {
            return [tempCoords, tempPos];
        }
    }
    return null;
}

/**
 * Helper function for getTreePositions recursion. Handles iteration over successor nodes.
 * @returns {number | false} The next available Y position or false on collision.
 */
function placeSuccessors(
    code: string,
    semesterIndex: number,
    positionIndex: number,
    details: Details,
    codesToSem: Record<string, number>,
    codeToPosition: CodeToPosition,
    positionToCode: PositionToCode,
    tempCodeToPosition: CodeToPosition,
    tempPositionToCode: PositionToCode,
    currentSpecializationCodes: Set<string>
): number | false {
    let nextAvailableY = positionIndex;

    for (const succ of details[code].successors) {
        if (!details[succ.code] || codesToSem[succ.code] == null) {
            continue;
        }

        const result = getTreePositions(
            details,
            semesterIndex + 1,
            nextAvailableY,
            succ.code,
            codeToPosition,
            positionToCode,
            tempCodeToPosition,
            tempPositionToCode,
            currentSpecializationCodes,
            codesToSem
        );

        if (result === false) {
            return false;
        }
        nextAvailableY += result;
    }

    return nextAvailableY;
}

function mergePlacements(
    destCoords: CodeToPosition,
    destPos: PositionToCode,
    src: [CodeToPosition, PositionToCode]
): void {
    const [srcCoords, srcPos] = src;
    Object.assign(destCoords, srcCoords);
    srcPos.forEach((semesterArray, semesterIdx) => {
        semesterArray.forEach((code, positionIdx) => {
            if (code) destPos[semesterIdx][positionIdx] = code;
        });
    });
}

/**
 * Ensures that subjects not reached by tree recursion (e.g., secondary predecessors)
 * are assigned a valid position in the grid.
 * * @returns {boolean} True if all missed predecessors were successfully placed.
 */
function addMissedPredecessorsPositions(
    details: Details,
    codesToCoordinates: CodeToPosition,
    positionToCode: PositionToCode,
    tempCodeToCoordinates: CodeToPosition,
    tempPositionsToCode: PositionToCode,
    codesToSem: Record<string, number>
): boolean {
    const missedCodes: string[] = getReachableCodes(
        Object.keys(tempCodeToCoordinates)[0],
        details
    ).filter(
        (code) =>
            !tempCodeToCoordinates[code] && !codesToCoordinates[code] && codesToSem[code] != null
    );

    // Place subjects closer to their successors first
    missedCodes.sort(
        (a, b) =>
            avgSuccessorY(a, details, tempCodeToCoordinates, codesToCoordinates) -
            avgSuccessorY(b, details, tempCodeToCoordinates, codesToCoordinates)
    );

    for (let i = 0; i < missedCodes.length; i++) {
        const code = missedCodes[i];
        let currentSemester = codesToSem[code];
        const semesterIndex = currentSemester! - 1; // can't be null because of the filtering above

        const currentSemesterData = positionToCode[semesterIndex];
        const tempSemesterData = tempPositionsToCode[semesterIndex];
        let positionIndex = tempPositionsToCode[semesterIndex].length;

        if (!currentSemesterData || currentSemesterData[positionIndex]) {
            return false;
        }

        while (tempSemesterData[positionIndex]) {
            positionIndex++;
            if (currentSemesterData[positionIndex]) {
                return false;
            }
        }
        tempCodeToCoordinates[code] = { x: semesterIndex, y: positionIndex };
        tempPositionsToCode[semesterIndex][positionIndex] = code;
    }
    return true;
}

/**
 * Converts abstract grid indices (0, 1, 2...) into real pixel coordinates for the canvas.
 * Also calculates the total bounding box for SVG/Canvas sizing.
 * @returns {[CodeToPosition, number, number]} A tuple of [real coordinate map, total width, total height].
 */
function getRealPositionsAndBoundaries(
    codeToPosition: CodeToPosition
): [CodeToPosition, number, number] {
    const realPositions: CodeToPosition = {};
    let maxX = 0;
    let maxY = 0;
    Object.entries(codeToPosition).forEach(([code, { x: coordX, y: coordY }]) => {
        const x =
            coordX * Layout.columnWidth +
            (Layout.columnWidth - Layout.subjectWidth - 2 * Layout.subjectPadding) / 2;
        const y =
            coordY * Layout.rowHeight +
            (Layout.rowHeight - Layout.subjectHeight - 2 * Layout.subjectPadding) / 2;
        realPositions[code] = { x, y };

        // adding one, because the outer edge's real coordinate is required for size calculation
        if ((coordX + 1) * Layout.columnWidth > maxX) {
            maxX = (coordX + 1) * Layout.columnWidth;
        }
        if ((coordY + 1) * Layout.rowHeight > maxY) {
            maxY = (coordY + 1) * Layout.rowHeight;
        }
    });
    return [realPositions, maxX, maxY];
}

// ─── Predicates ───────────────────────────────────────────────────────────────

/** Checks if a subject is already placed in the grid. */
function isAlreadyPlaced(
    code: string,
    codeToCoordinates: CodeToPosition,
    details: Details,
    currentSpecializationCodes: Set<string>
): boolean {
    return !!codeToCoordinates[code] || !details[code] || !currentSpecializationCodes.has(code);
}

/** Determines if a specific grid cell is already occupied by another subject. */
function isPositionOccupied(
    semesterIndex: number,
    positionIndex: number,
    positionsToCode: PositionToCode,
    tempPositionsToCode: PositionToCode
): boolean {
    return (
        !!positionsToCode[semesterIndex]?.[positionIndex] ||
        !!tempPositionsToCode[semesterIndex]?.[positionIndex]
    );
}

/** Logic to decide if a node should be skipped during the current placement step. */
function shouldSkipPlacement(
    code: string,
    semesterIndex: number,
    codeToCoordinates: CodeToPosition,
    tempCodeToCoordinates: CodeToPosition,
    codesToSem: Record<string, number>,
    details: Details,
    currentSpecializationCodes: Set<string>
): boolean {
    const isPlaced = !!codeToCoordinates[code] || !!tempCodeToCoordinates[code];
    const wrongSemester =
        codesToSem[code] != null &&
        codesToSem[code] !== semesterIndex + 1 &&
        details[code].predecessors.length > 0;
    const notInSpec = !currentSpecializationCodes.has(code);
    return isPlaced || wrongSemester || notInSpec;
}

/** Checks if a subject requires an OR gate visualization based on its prerequisite groups. */
function hasOrGate(
    code: string,
    course: Course,
    processedSubjects: Details,
    codesToSem: Record<string, number>
): boolean {
    return (
        course.predecessors.some((pred) => pred.groups.length > 0) &&
        course.predecessors.some((pred) =>
            pred.groups.some(
                (g) =>
                    g
                        .filter(
                            (s) => codesToSem[s] != null && codesToSem[s] < (codesToSem[code] ?? 0)
                        )
                        .filter((s) => processedSubjects[s]).length > 1
            )
        )
    );
}

// ─── Utilities ───────────────────────────────────────────────────────────

/** Normalizes the subject code, handling both direct codes and choice/elective blocks. */
function getSubjectCode(s: OrderSubject): string {
    return 'code' in s ? s.code : s.choice;
}

/** * Calculates the average Y coordinate of all successors for a given subject.
 * Used to minimize edge crossings and produce a "straighter" layout.
 */
function avgSuccessorY(
    code: string,
    details: Details,
    tempPositions: CodeToPosition,
    globalPositions: CodeToPosition
): number {
    const ys = (details[code].successors ?? [])
        .map((s) => tempPositions[s.code]?.y ?? globalPositions[s.code]?.y)
        .filter((y): y is number => y != null);
    return ys.length > 0 ? ys.reduce((sum, y) => sum + y, 0) / ys.length : Infinity;
}
