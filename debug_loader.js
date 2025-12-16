// Debug Console Overlay
window.onerror = function (message, source, lineno, colno, error) {
    const errorMsg = `${message} at ${source}:${lineno}:${colno}`;

    let debugContainer = document.getElementById('debug-container');
    if (!debugContainer) {
        debugContainer = document.createElement('div');
        debugContainer.id = 'debug-container';
        debugContainer.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 50%; background: rgba(0,0,0,0.8); color: red; overflow-y: scroll; z-index: 10000; font-family: monospace; font-size: 12px; pointer-events: none;';
        document.body.appendChild(debugContainer);
    }

    const log = document.createElement('div');
    log.textContent = errorMsg;
    log.style.borderBottom = '1px solid #444';
    log.style.padding = '4px';
    debugContainer.appendChild(log);

    // Also try to alert if critical
    // alert('Error: ' + message);
    return false;
};

// Console log capture
const originalLog = console.log;
console.log = function (...args) {
    originalLog.apply(console, args);
    // Optional: display logs too
};
