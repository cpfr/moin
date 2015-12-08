importScripts('parser.js', 'interpreter.js');

self.postMessage("Worker Started!");

function print(msg){
    self.postMessage({cmd: "print", value:msg});
}

self.addEventListener('message', function(e) {
    if(e.data.cmd == "run"){
        self.postMessage({cmd:"started"});
        var ast = mtyParser.parse(e.data.code+"\n");
        var interpreter = new MtyInterpreter(ast, print);
        interpreter.run();
        self.postMessage({cmd:"done"});
    }
    else{
        self.postMessage("other message");
    }
}, false);