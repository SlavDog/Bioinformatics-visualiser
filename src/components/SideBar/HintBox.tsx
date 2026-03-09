import "./styles.css"
import BioIcon from '@/assets/bio.svg'
import InfIcon from '@/assets/inf.svg'
import MathIcon from '@/assets/math.svg'
import ChoiceIcon from '@/assets/choice.svg'
import OtherIcon from '@/assets/other.svg'
import OrGateIcon from '@/assets/or_gate.svg';
import SideBarTitle from "./SideBarTitle"
import { useState } from "react"

function HintBox() {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div style={{ position: "relative" }}>
            {/* Expanded legend box */}
            <div
                className="hintBox"
                style={{
                    overflow: "hidden",
                    maxHeight: isOpen ? "600px" : "0px",
                    opacity: isOpen ? 1 : 0,
                    transform: isOpen ? "translateY(0)" : "translateY(-8px)",
                    transition: "max-height 0.35s ease, opacity 0.25s ease, transform 0.25s ease",
                    padding: isOpen ? "10px 15px" : "0 15px",
                    borderWidth: isOpen ? "2px" : "0px",
                    pointerEvents: isOpen ? "auto" : "none",
                }}
            >
                <button
                    title="Zavřít legendu"
                    onClick={() => setIsOpen(false)}
                    className='submitButton'
                    style={{ position: "absolute", right: "15px", top: "20px", height: "20px", width: "20px" }}
                >
                    ×
                </button>
                <SideBarTitle isOnTop={true}>Legenda</SideBarTitle>

                <div className="field">
                    <p className="preferenceFieldLabel">Informatika</p>
                    <div style={{ display: "flex" }}>
                        <img src={InfIcon} title="Informatika" draggable="false" className='hintCircle' />
                        <div className='hintCircle' title="Informatika" style={{ backgroundColor: "var(--informatics)" }} />
                    </div>
                </div>
                <div className="hintSeparator"></div>
                <div className="field">
                    <p className="preferenceFieldLabel">Biologie</p>
                    <div style={{ display: "flex" }}>
                        <img src={BioIcon} title="Biologie" draggable="false" className='hintCircle' />
                        <div className='hintCircle' title="Biologie" style={{ backgroundColor: "var(--biology)" }} />
                    </div>
                </div>
                <div className="hintSeparator"></div>
                <div className="field">
                    <p className="preferenceFieldLabel">Matematika</p>
                    <div style={{ display: "flex" }}>
                        <img src={MathIcon} title="Matematika" draggable="false" className='hintCircle' />
                        <div className='hintCircle' title="Matematika" style={{ backgroundColor: "var(--math)" }} />
                    </div>
                </div>
                <div className="hintSeparator"></div>
                <div className="field">
                    <p className="preferenceFieldLabel">Volba</p>
                    <div style={{ display: "flex" }}>
                        <img src={ChoiceIcon} title="Volba" draggable="false" className='hintCircle' />
                        <div className='hintCircle' title="Volba" style={{ backgroundColor: "var(--choice)" }} />
                    </div>
                </div>
                <div className="hintSeparator"></div>
                <div className="field">
                    <p className="preferenceFieldLabel">Ostatní</p>
                    <div style={{ display: "flex" }}>
                        <img src={OtherIcon} title="Ostatní" draggable="false" className='hintCircle' />
                        <div className='hintCircle' title="Ostatní" style={{ backgroundColor: "var(--other)" }} />
                    </div>
                </div>
                <div className="hintSeparator"></div>
                <div className="field">
                    <p className="preferenceFieldLabel">Povinná prerekvizita</p>
                    <svg style={{ width: "70px", height: "20px" }}>
                        <path d="M 10 10 h 50" stroke="var(--connection-primary)" fill="transparent" strokeWidth="2" />
                    </svg>
                </div>
                <div className="hintSeparator"></div>
                <div className="field">
                    <div style={{ display: "flex", alignContent: "center" }}>
                        <p className="preferenceFieldLabel">Soft prerekvizita</p>
                        <div className="helpIcon" style={{ width: "12px", height: "12px", fontSize: "10px", marginLeft: "5px" }} title="Soft prerekvizity slouží pouze jako doporučení. Není nutné absolvovat předměty v jimi daném pořadí.">
                            ?
                        </div>
                    </div>
                    <svg style={{ width: "70px", height: "20px" }}>
                        <path d="M 10 10 h 50" stroke="var(--connection-secondary)" fill="transparent" strokeWidth="2" strokeDasharray="2 3" />
                    </svg>
                </div>
                <div className="hintSeparator"></div>
                <div className="field">
                    <div style={{ display: "flex", alignContent: "center" }}>
                        <p className="preferenceFieldLabel">OR brána</p>
                        <div className="helpIcon" style={{ width: "12px", height: "12px", fontSize: "10px", marginLeft: "5px" }} title="OR brána znamená, že je potřeba splnit některé z prerekvizit, které do ní vstupují, nemusí však být nutně splněny všechny z nich.">
                            ?
                        </div>
                    </div>
                    <svg width="70" height="25">
                        <path d="M 10 10 C 20 10 20 12.5 30 12.5" stroke="var(--connection-primary)" fill="transparent" strokeWidth="2" />
                        <path d="M 10 15 C 20 15 20 12.5 30 12.5" stroke="var(--connection-primary)" fill="transparent" strokeWidth="2" />
                        <path d="M 42 12.5 H 58" stroke="var(--connection-primary)" fill="transparent" strokeWidth="2" />
                        <image href={OrGateIcon} x="22" y="0" width="25" height="25" />
                    </svg>
                </div>
            </div>

            {/* Collapsed "show legend" button */}
            <div
                style={{
                    overflow: "hidden",
                    maxHeight: isOpen ? "0px" : "50px",
                    opacity: isOpen ? 0 : 1,
                    transform: isOpen ? "translateY(-4px)" : "translateY(0)",
                    transition: "max-height 0.3s ease 0.1s, opacity 0.2s ease 0.15s, transform 0.2s ease 0.15s",
                    pointerEvents: isOpen ? "none" : "auto",
                }}
            >
                <button onClick={() => setIsOpen(true)} className='submitButton' style={{ width: "100%", padding: "1px 10px", height: "30px" }}>
                    <div className="field">
                        <p className="preferenceFieldLabel">Zobrazit legendu</p>
                        <div className="helpIcon" style={{ width: "12px", height: "12px", fontSize: "10px", cursor: "pointer" }}>
                            i
                        </div>
                    </div>
                </button>
            </div>
        </div>
    );
}

export default HintBox;