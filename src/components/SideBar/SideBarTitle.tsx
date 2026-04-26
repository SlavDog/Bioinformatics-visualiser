import Tippy from '@tippyjs/react';

type SidebarTitleProps = {
    children: React.ReactNode;
    tooltip?: string;
    isOnTop?: boolean;
};

function SideBarTitle({ children, tooltip = '', isOnTop = false }: SidebarTitleProps) {
    return (
        <div className="titleBox" style={{ paddingTop: `${isOnTop ? '10px' : '20px'}` }}>
            <h1 className="sideBarTitle">{children}</h1>
            {tooltip && (
                <Tippy content={tooltip}>
                    <div className="helpIcon">?</div>
                </Tippy>
            )}
        </div>
    );
}

export default SideBarTitle;
