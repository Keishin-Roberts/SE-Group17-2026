import { useState, useEffect } from 'react';

/** 
 * Toggle Switch
 * Uses label to distinguish each instance of SwitchSlider
 * Checked stores a boolean value of whether the switch is on or off
 * onChange is to set the function of the button when toggled
 */

function SwitchSlider({ label = 'Enable notifications', checked, onChange }) {
  return (
    <label className="switch-wrapper">
      {label && <span className="switch-label">{label}</span>}
      <input
        type="checkbox"
        className="switch-input"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="switch-track">
        <span className="switch-thumb" />
      </span>
    </label>
  );
}

/**
 * dropdown box of font families the user can change to
 * options holds the font choices for the user that are displayed
 * useEffect element changes the font in the CSS to the chosen font
 */
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

/**
 * slider for the font size
 * useEffect changes the root font size within CSS
 * all CSS uses rem sizing for font so the whole app fonts are changed
 * max value set to 200% size with min value being 14px for 1rem
 * local storage is used to store information on users device so when screen is refreshed
 * settings arent reset
 */
function TextSizeSlider() {
  const [value, setValue] = useState(() => {
    const saved = localStorage.getItem('fontSize');
    return saved ? Number(saved) : 16;
  });

  useEffect(() => {
    document.documentElement.style.setProperty('--font-size', `${value}px`);
    localStorage.setItem('fontSize', String(value));
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


// function that displays accessibility settings and handles switches
function Accessibility() {
  //handles dark mode switch setting isDark to true or false based on switch state
  //local storage stores the state of darkmode button for if screen is refreshed
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  //if dark mode slider is on then sets the theme in the CSS to dark mode
  //local storage then saves the state of theme for screen refreshing
  useEffect(() => {
    const theme = isDark ? 'dark' : 'light';
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }, [isDark]);

  const [isMagnifier, setIsMagnifier] = useState(false);
  const [isNarrator, setIsNarrator] = useState(false);

  //displays accessibility options
  return (
    <main className="accessibility-container">
      <div className="accessibility-content">
        <h1>Accessibility</h1>
        <TextSizeSlider />
        <FontDropdown />
        <SwitchSlider
          label="Dark Mode"
          checked={isDark}
          onChange={setIsDark}
        />
        <SwitchSlider
          label="Magnifier"
          checked={isMagnifier}
          onChange={setIsMagnifier}
        />
        <SwitchSlider
          label="Narrator"
          checked={isNarrator}
          onChange={setIsNarrator}
        />
      </div>
    </main>
  );
}


export default Accessibility;
