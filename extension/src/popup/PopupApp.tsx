export function PopupApp() {
  return (
    <div className="popup">
      <h1>AI Meeting Assistant</h1>
      <p>
        Open a <strong>Google Meet</strong> tab. The floating assistant appears automatically on
        supported meeting pages.
      </p>
      <ol>
        <li>Join a Meet call</li>
        <li>Click the 🤖 button</li>
        <li>Press Start Assistant</li>
      </ol>
      <button type="button" onClick={() => chrome.runtime.openOptionsPage()}>
        Open settings
      </button>
    </div>
  );
}
