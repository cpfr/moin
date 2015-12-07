importScripts('parser.js', 'interpreter.js');

self.postMessage("Worker Started!");

self.addEventListener('message', function(e) {
  self.postMessage(e.data);
}, false);