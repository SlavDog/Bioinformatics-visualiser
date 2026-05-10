import './styles.css';
import BioIcon from '@/assets/bio.svg';
import InfIcon from '@/assets/inf.svg';
import MathIcon from '@/assets/math.svg';
import ChoiceIcon from '@/assets/choice.svg';
import OtherIcon from '@/assets/other.svg';
import OrGateIcon from '@/assets/or_gate.svg';
import SideBarTitle from './SideBarTitle';
import React, { useState } from 'react';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';

const LEGEND_SUBJECT_ITEMS = [
    { label: 'Informatika', color: 'var(--informatics)', icon: InfIcon },
    { label: 'Biologie', color: 'var(--biology)', icon: BioIcon },
    { label: 'Matematika', color: 'var(--math)', icon: MathIcon },
    { label: 'Povinně volitelný blok', color: 'var(--choice)', icon: ChoiceIcon },
    { label: 'Ostatní', color: 'var(--other)', icon: OtherIcon }
];

function HintBox() {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div style={{ position: 'relative' }}>
            {/* Expanded legend box */}
            <div
                className="hintBox"
                style={{
                    overflow: 'hidden',
                    maxHeight: isOpen ? '600px' : '0px',
                    opacity: isOpen ? 1 : 0,
                    transform: isOpen ? 'translateY(0)' : 'translateY(-8px)',
                    transition: 'max-height 0.35s ease, opacity 0.25s ease, transform 0.25s ease',
                    padding: isOpen ? '10px 15px' : '0 15px',
                    borderWidth: isOpen ? '2px' : '0px',
                    pointerEvents: isOpen ? 'auto' : 'none'
                }}
            >
                <button onClick={() => setIsOpen(false)} className="submitButton legendCloseButton">
                    ×
                </button>
                <SideBarTitle isOnTop={true}>Legenda</SideBarTitle>

                {LEGEND_SUBJECT_ITEMS.map(({ label, color, icon }) => (
                    <React.Fragment key={label}>
                        <div className="field">
                            <p className="preferenceFieldLabel">{label}</p>
                            <Tippy content={label} placement="right">
                                <div style={{ display: 'flex' }}>
                                    <div className="hintCircle" style={{ backgroundColor: color }}>
                                        <img src={icon} draggable="false" className="hintCircle" />
                                    </div>
                                </div>
                            </Tippy>
                        </div>
                        <div className="hintSeparator" />
                    </React.Fragment>
                ))}
                <div className="field">
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <p className="preferenceFieldLabel">Povinná prerekvizita</p>
                        <Tippy content="Plná čára představuje povinnou prerekvizitu, tedy vazbu, kdy je potřeba absolvovat jeden předmět před zapsáním jiného.">
                            <div
                                className="helpIcon"
                                style={{
                                    width: '12px',
                                    height: '12px',
                                    fontSize: '10px',
                                    marginLeft: '5px'
                                }}
                            >
                                ?
                            </div>
                        </Tippy>
                    </div>
                    <svg style={{ width: '70px', height: '20px' }}>
                        <path
                            d="M 10 10 h 50"
                            stroke="var(--connection-primary)"
                            fill="transparent"
                            strokeWidth="2"
                        />
                    </svg>
                </div>
                <div className="hintSeparator"></div>
                <div className="field">
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <p className="preferenceFieldLabel">Soft prerekvizita</p>
                        <Tippy content="Přerušované čáry představují soft prerekvizity, které slouží pouze jako doporučení. Není nutné absolvovat předměty v jimi daném pořadí.">
                            <div
                                className="helpIcon"
                                style={{
                                    width: '12px',
                                    height: '12px',
                                    fontSize: '10px',
                                    marginLeft: '5px'
                                }}
                            >
                                ?
                            </div>
                        </Tippy>
                    </div>
                    <svg style={{ width: '70px', height: '20px' }}>
                        <path
                            d="M 10 10 h 50"
                            stroke="var(--connection-secondary)"
                            fill="transparent"
                            strokeWidth="2"
                            strokeDasharray="2 3"
                        />
                    </svg>
                </div>
                <div className="hintSeparator"></div>
                <div className="field">
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <p className="preferenceFieldLabel">OR brána</p>
                        <Tippy content="OR brána znamená, že je potřeba splnit některé z prerekvizit, které do ní vstupují, nemusí však být nutně splněny všechny z nich.">
                            <div
                                className="helpIcon"
                                style={{
                                    width: '12px',
                                    height: '12px',
                                    fontSize: '10px',
                                    marginLeft: '5px'
                                }}
                            >
                                ?
                            </div>
                        </Tippy>
                    </div>
                    <svg width="70" height="25">
                        <path
                            d="M 10 10 C 20 10 20 12.5 30 12.5"
                            stroke="var(--connection-primary)"
                            fill="transparent"
                            strokeWidth="2"
                        />
                        <path
                            d="M 10 15 C 20 15 20 12.5 30 12.5"
                            stroke="var(--connection-primary)"
                            fill="transparent"
                            strokeWidth="2"
                        />
                        <path
                            d="M 42 12.5 H 58"
                            stroke="var(--connection-primary)"
                            fill="transparent"
                            strokeWidth="2"
                        />
                        <image href={OrGateIcon} x="22" y="0" width="25" height="25" />
                    </svg>
                </div>
            </div>

            {/* Collapsed "show legend" button */}
            <div
                style={{
                    overflow: 'hidden',
                    maxHeight: isOpen ? '0px' : '50px',
                    opacity: isOpen ? 0 : 1,
                    transform: isOpen ? 'translateY(-4px)' : 'translateY(0)',
                    transition:
                        'max-height 0.3s ease 0.1s, opacity 0.2s ease 0.15s, transform 0.2s ease 0.15s',
                    pointerEvents: isOpen ? 'none' : 'auto',
                    paddingBottom: '5px'
                }}
            >
                <button
                    onClick={() => setIsOpen(true)}
                    className="submitButton collapsedLegendButton"
                >
                    <div className="field">
                        <p className="preferenceFieldLabel">Zobrazit legendu</p>
                        <div className="helpIcon infoIcon">i</div>
                    </div>
                </button>
            </div>
        </div>
    );
}

export default HintBox;
