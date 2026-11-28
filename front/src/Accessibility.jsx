import { useState, useEffect } from 'react';

function SwitchSlider({ label = 'Enable notifications' }) {
  const [isOn, setIsOn] = useState(false);

  return (
    <label className="switch-wrapper">
      {label && <span className="switch-label">{label}</span>}
      <input
        type="checkbox"
        className="switch-input"
        checked={isOn}
        onChange={() => setIsOn(!isOn)}
      />
      <span className="switch-track">
        <span className="switch-thumb" />
      </span>
    </label>
  );
}

function FontDropdown() {
  const [selectedFont, setSelectedFont] = useState('arial');

  const options = [
    { label: 'Arial (Default)', value: 'Arial, sans-serif' },
    { label: 'Roboto Mono (Monospace)', value: '"Roboto Mono", monospace' },
    { label: 'Comic Sans (Dyslexia Friendly)', value: '"Comic Sans MS", "Comic Sans", cursive' },
    { label: 'Verdana (Wide Spacing)', value: 'Verdana, Geneva, sans-serif' },
  ];

  useEffect(() => {
    document.documentElement.style.setProperty('--chosen-font', `${selectedFont}`);
  }, [selectedFont]);

  return (
    <div>
      <label className="dropdown-title">Font Style: </label>
      <div>
        <select
            id="font-dropdown"
            className="font-dropdown"
            value={selectedFont}
            onChange={(e) => setSelectedFont(e.target.value)}
        >
            {options.map((option) => (
            <option key={option.value} value={option.value}>
                {option.label}
            </option>
            ))}
        </select>
      </div>
    </div>
  );
}

function TextSizeSlider() {
  const [value, setValue] = useState(16);

  useEffect(() => {
    document.documentElement.style.setProperty('--font-size', `${value}px`);
  }, [value]);

  return (
    <div className="font-size-slider">
      <label className="slider-title">
        Text Size:
      </label>

      <div className="slider-row">
        <input
          type="range"
          min={14}
          max={32}
          step={1}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
        />
        <strong>{value}px</strong>
      </div>
    </div>
  );
}

function Accessibility() {
  return (
    <main className="accessibility-container">
      <div className="accessibility-content">
        <h1>Accessibility</h1>
        <TextSizeSlider />
        <FontDropdown />
        <SwitchSlider label="Dark Mode" />
        <SwitchSlider label="Magnifier" />
        <SwitchSlider label="Narrator" />
      </div>
    </main>
  );
}

export default Accessibility;
