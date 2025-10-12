// Text Node Error Debugging Utility
// This helps identify which component is rendering the problematic text node
// Copy and paste this code into your browser's console while the error is occurring

(function() {
    console.log('🔍 Text Node Error Debugger loaded');
    
    // Override console.error to catch React Native Web errors
    const originalError = console.error;
    let errorCount = 0;
    
    console.error = function(...args) {
        const errorMessage = args.join(' ');
        
        if (errorMessage.includes('Unexpected text node') && errorMessage.includes('A text node cannot be a child of a <View>')) {
            errorCount++;
            console.log(`🚨 Captured text node error #${errorCount}:`, errorMessage);
            
            // Try to get a stack trace to identify the source
            const error = new Error('Text node error stack trace');
            console.log('📍 Stack trace:', error.stack);
            
            // Look for React components in the DOM that might be causing issues
            setTimeout(() => {
                findSuspiciousTextNodes();
            }, 100);
        }
        
        return originalError.apply(console, args);
    };
    
    function findSuspiciousTextNodes() {
        console.log('🔎 Searching for suspicious text nodes...');
        
        // Find all text nodes in the document
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );
        
        const suspiciousNodes = [];
        let node;
        
        while (node = walker.nextNode()) {
            const text = node.textContent.trim();
            // Look for single periods or other suspicious text
            if (text === '.' || text === '' || /^\s*\.\s*$/.test(text)) {
                const parent = node.parentElement;
                if (parent) {
                    suspiciousNodes.push({
                        text: `"${text}"`,
                        parent: parent.tagName,
                        parentClass: parent.className,
                        parentStyle: parent.style.cssText,
                        html: parent.outerHTML.substring(0, 200) + '...'
                    });
                }
            }
        }
        
        if (suspiciousNodes.length > 0) {
            console.log('🎯 Found suspicious text nodes:');
            suspiciousNodes.forEach((node, index) => {
                console.log(`${index + 1}.`, node);
            });
        } else {
            console.log('✅ No obvious suspicious text nodes found in DOM');
        }
        
        // Also look for React components with data attributes
        const reactElements = document.querySelectorAll('[data-reactroot], [data-react-id]');
        console.log(`📋 Found ${reactElements.length} React elements in DOM`);
    }
    
    // Function to manually trigger text node search
    window.findTextNodes = findSuspiciousTextNodes;
    
    // Function to watch for DOM mutations that might cause text node issues
    function startMutationObserver() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.TEXT_NODE) {
                        const text = node.textContent.trim();
                        if (text === '.' || /^\s*\.\s*$/.test(text)) {
                            console.log('🔴 Detected problematic text node added:', {
                                text: `"${text}"`,
                                parent: node.parentElement?.tagName,
                                parentClass: node.parentElement?.className
                            });
                        }
                    }
                });
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        console.log('👀 Started mutation observer for text nodes');
        return observer;
    }
    
    // Start watching for mutations
    window.textNodeObserver = startMutationObserver();
    
    // Function to stop the observer
    window.stopTextNodeObserver = function() {
        if (window.textNodeObserver) {
            window.textNodeObserver.disconnect();
            console.log('⏹️ Stopped text node observer');
        }
    };
    
    console.log('🛠️ Available commands:');
    console.log('- findTextNodes() - Search for suspicious text nodes now');
    console.log('- stopTextNodeObserver() - Stop watching for new text nodes');
    console.log('- textNodeObserver - Access the mutation observer');
    
    // Run initial search
    findSuspiciousTextNodes();
})();
