export const Layout = {
    columnWidth: 500,
    rowHeight: 185,
    subjectHeight: 125,
    subjectWidth: 200,
    paddingHorizontal: 120,
    paddingVertical: 120,
    subjectPadding: 16,
    semesterTitleInset: 250,
    sidebarWidth: 240,
    semesterColumnBottomPadding: 50,
    edgeXOffsetStep: 12,
    detailMenuSubjectHeight: 140,
    detailMenuSubjectWidth: 250,
    detailMenuSubjectPadding: 16,
    offsetStep: 12
};

export const ZoomScale = {
    min: 0.3,
    max: 1.5,
    default: 0.7,
    logMin: Math.log(0.3),
    logMax: Math.log(1.5)
};

export const emptyNode = {
    name: '',
    faculty: '',
    successors: [],
    predecessors: [],
    language: '',
    completion: '',
    has_successors: true,
    has_parent: true,
    credits: 0,
    link: '',
    type: ''
};
