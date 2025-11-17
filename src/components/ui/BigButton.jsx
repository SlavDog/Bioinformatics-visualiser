function BigButton({color, text, onClick}) {
  return (
    <div onClick={onClick} className={`big-button`} style={{ "--button-color": color, "--glow-color": `${color}33` }}>
      {text}
    </div>
  );
};


export default BigButton;