// Console Log Downloader Utility
// To use: Copy and paste this code into your browser's console while your app is running

(function() {
    // Array to store console messages
    const logs = [];
    let isCapturing = false;
    
    // Store original console methods
    const originalConsole = {
        log: console.log,
        warn: console.warn,
        error: console.error,
        info: console.info,
        debug: console.debug
    };
    
    // Function to format timestamp
    function getTimestamp() {
        const now = new Date();
        return now.toISOString();
    }
    
    // Function to capture console output
    function captureConsole(method, args) {
        if (!isCapturing) return;
        
        const message = args.map(arg => {
            if (typeof arg === 'object') {
                try {
                    return JSON.stringify(arg, null, 2);
                } catch (e) {
                    return String(arg);
                }
            }
            return String(arg);
        }).join(' ');
        
        logs.push({
            timestamp: getTimestamp(),
            level: method,
            message: message
        });
    }
    
    // Override console methods
    console.log = function(...args) {
        captureConsole('log', args);
        originalConsole.log.apply(console, args);
    };
    
    console.warn = function(...args) {
        captureConsole('warn', args);
        originalConsole.warn.apply(console, args);
    };
    
    console.error = function(...args) {
        captureConsole('error', args);
        originalConsole.error.apply(console, args);
    };
    
    console.info = function(...args) {
        captureConsole('info', args);
        originalConsole.info.apply(console, args);
    };
    
    console.debug = function(...args) {
        captureConsole('debug', args);
        originalConsole.debug.apply(console, args);
    };
    
    // Function to start capturing
    function startCapture() {
        isCapturing = true;
        logs.length = 0; // Clear existing logs
        console.log('Console log capture started. Use stopCapture() to stop and download.');
    }
    
    // Function to stop capturing and download
    function stopCapture() {
        isCapturing = false;
        
        if (logs.length === 0) {
            console.log('No logs captured.');
            return;
        }
        
        // Format logs as text
        const logText = logs.map(log => 
            `[${log.timestamp}] [${log.level.toUpperCase()}] ${log.message}`
        ).join('\n');
        
        // Create and download file
        const blob = new Blob([logText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `console-logs-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log(`Downloaded ${logs.length} console messages to file.`);
    }
    
    // Function to get current log count
    function getLogCount() {
        return logs.length;
    }
    
    // Function to restore original console (cleanup)
    function restoreConsole() {
        console.log = originalConsole.log;
        console.warn = originalConsole.warn;
        console.error = originalConsole.error;
        console.info = originalConsole.info;
        console.debug = originalConsole.debug;
        isCapturing = false;
        console.log('Console logging restored to normal.');
    }
    
    // Make functions globally available
    window.startCapture = startCapture;
    window.stopCapture = stopCapture;
    window.getLogCount = getLogCount;
    window.restoreConsole = restoreConsole;
    
    console.log('Console Log Downloader loaded! Available commands:');
    console.log('- startCapture() - Start capturing console logs');
    console.log('- stopCapture() - Stop capturing and download logs as .txt file');
    console.log('- getLogCount() - Get current number of captured logs');
    console.log('- restoreConsole() - Restore normal console behavior');
})();
