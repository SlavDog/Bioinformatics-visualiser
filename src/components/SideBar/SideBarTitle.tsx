type SidebarTitleProps = {
    children: React.ReactNode,
    tooltip?: string
}


function SideBarTitle({children, tooltip=""} : SidebarTitleProps) {
    return (
        <div className="titleBox">
            <h1 className="sideBarTitle">{children}</h1>
            {tooltip != "" 
            && <div className="helpIcon" title={tooltip}>
                    ?
                </div>}
        </div>
    );
}

export default SideBarTitle;