function MtyInterpreter(ast, printfn, readfn){
    this.ast = ast;

    var _printfn = printfn || function(msg){ console.log(msg); };
    var _readfn = readfn || function(){ return prompt(); };

    var _abortBlock = undefined;
    var _actions = {};
    var currentNode = undefined;

    var _eval = function(node, lvalue){
        lvalue = lvalue || false;
        currentNode = node;
        return _actions[node.name](node, lvalue);
    };
    var _blockStack = [];

    var _returnValue = undefined;
    var _getReturnValue = function(){
        var val = _returnValue; 
        _returnValue = undefined;
        return val;
    }

    var _setReturnValue = function(val){
        _returnValue = val;
    }

    var _resolveVariable = function(variableName, lvalue){
        var blockIndex = _blockStack.length-1;
        var result = undefined;
        while((result == undefined)&&(blockIndex >= 0)){
            result = _blockStack[blockIndex].resolveVariable(variableName);
            blockIndex--;
        }
        if(result == undefined){
            throw { toString: function(){return "Variable '"+variableName+"' could not be resolved at "+currentNode.pos;} }
        }
        return result;
    }

    var _resolveFunction = function(functionName){
        var blockIndex = _blockStack.length-1;
        var result = undefined;
        // TODO: overload resolution
        while((result == undefined)&&(blockIndex >= 0)){
            result = _blockStack[blockIndex].resolveFunction(functionName);
            blockIndex--;
        }
        return result;
    }

    // -------------------------------------------------------------------------
    // -- evaluation action functions ------------------------------------------
    // -------------------------------------------------------------------------
    
    _actions['WhileLoop'] = function(node) {
        while(_eval(node.condition).getValue()){
            _eval(node.body);
            if(_abortBlock != undefined){
                if(_abortBlock.command == "skip"){
                    _abortBlock = undefined;
                    continue;
                }
                else if(_abortBlock.command == "break"){
                    _abortBlock = undefined;
                    break;
                }
                else if(_abortBlock.command == "return"){
                    break;
                }
            }
        }
    }

    _actions['IfStatement'] = function(node) {
        if(_eval(node.condition).getValue()){
            _eval(node.trueBody);
        }
        else{
            _eval(node.falseBody);
        }
    }

    _actions['Literal'] = function(node) {
        return node;
    }

    _actions['FunctionCall'] = function(node) {
        var funDecl = _resolveFunction(node.functionName);
        if(funDecl == undefined){
            switch(node.functionName){
                case "print":
                    var param = _eval(node.parameters[0]);
                    _printfn(""+param.getValue());
                    break;
                case "println":
                    var param = _eval(node.parameters[0]);
                    _printfn(""+param.getValue() + "\n");
                    break;
                default:
                    console.log("error, function '"+node.functionName
                        +"' not found.");
            }
        }
        else{
            console.log("function found: "+funDecl);

            var contents = [];
            var argc = node.parameters.length;
            var parc = funDecl.parameters.length;

            for(var i=0; i < parc; i++){
                if(i < argc){
                    var param = funDecl.parameters[i];
                    if(Array.isArray(param)){ param = param[0]; }
                    var arg = node.parameters[i];
                    var varaccess = mtyParser.createVariableAccess(arg.pos,
                                                        param.variableName);
                    contents.push(param);
                    contents.push(mtyParser.createAssignment(arg.pos,
                                                            varaccess, arg));
                }
                else{
                    var param = funDecl.parameters[i][0];
                    var assign = funDecl.parameters[i][1];
                    contents.push(param);
                    contents.push(assign);
                }
            }
            var paramBlock = mtyParser.createBlock(funDecl.pos,
                                                    contents, "parameters");

            _eval(paramBlock);
            // the param block is a parent block of the function body block
            // this way, the parameter declarations are visible within the
            // function body
            _blockStack.push(paramBlock);
            _eval(funDecl.body);
            _blockStack.pop();

            _abortBlock = undefined;
            return _getReturnValue();
        }
    }

    /* declarations are not processed by the interpreter for now
       this may be used when a REPL is implemented
    _actions['VariableDeclaration'] = function(node) {}
    _actions['FunctionDeclaration'] = function(node) {}
    _actions['ClassDeclaration'] = function(node) {}
    */

    _actions['VariableAccess'] = function(node, lvalue) {
        var vardecl = _resolveVariable(node.variableName);
        if(! lvalue){vardecl = vardecl.getValue(); }
        return vardecl;
    }

    _actions['Assignment'] = function(node) {
        var lvalue = _eval(node.left, true);
        var rvalue = _eval(node.right);
        // TODO: type check
        lvalue.value = rvalue;
    }

    _actions['CommandStatement'] = function(node) {
        // TODO: implement
        switch(node.command){
            case 'return':
                if(node.argument){
                    _setReturnValue(_eval(node.argument));
                }
                _abortBlock = node;
                break;
            case 'yield':
                break;
            case 'raise':
                break;
            case 'skip': // node.argument always undefined
                _abortBlock = node;
                break;
            case 'break': // node.argument always undefined
                _abortBlock = node;
                break;
        }
    }

    var _checkAbortBlock = function(node){
        if((_abortBlock.command == "break")||(_abortBlock.command == "skip")){
            if((node.blockType == "function")||(node.blockType == "module")){
                throw {
                    msg: "Invalid "+_abortBlock.command
                        +" statement outside function at "+_abortBlock.pos,
                    line  : _abortBlock.pos.line,
                    column: _abortBlock.pos.column
                } 
            }
        }
        else if(_abortBlock.command == "return"){
            if(node.blockType == "module"){
                throw {
                    msg: "Invalid return statement "
                        +"outside function at "+node.pos,
                    line  : node.pos.line,
                    column: node.pos.column
                } 
            }
        }
    }

    _actions['Block'] = function(node) {
        _blockStack.push(node);

        var stmts = node.statements;
        for(var i = 0; i < stmts.length; i++){
            _eval(stmts[i]);
            if(_abortBlock != undefined){
                _checkAbortBlock(node);
                break;
            }
        }

        _blockStack.pop();
    }

    _actions['UnaryExpression'] = function(node) {
        switch(node.operator){
            case '-':
                break;
            case 'not':
                break;
        }
    }

    _actions['BinaryExpression'] = function(node) {
        var left = _eval(node.left).getValue()
        var right = _eval(node.right).getValue()

        // result = new Expression();
        result = mtyParser.createExpression();
        switch(node.op){
            case '+':
                result.value = left + right;
                break;
            case '-':
                result.value = left - right;
                break;
            case '*':
                result.value = left * right;
                break;
            case '/':
                result.value = left / right;
                break;
            case '%':
                result.value = left % right;
                break;
            case '^':
                result.value = Math.pow(left, right);
                break;
            case '=':
                result.value = left === right;
                break;
            case '!=':
                result.value = left !== right;
                break;
            case '<':
                result.value = left < right;
                break;
            case '>':
                result.value = left > right;
                break;
            case '<=':
                result.value = left <= right;
                break;
            case '>=':
                result.value = left >= right;
                break;
        }
        return result;
    }

    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------

    this.run = function(){
        try{
            _eval(ast);
        }
        catch(err){
            console.log(err);
            throw {
                error : err,
                line : currentNode.pos.line,
                column : currentNode.pos.column,
                node : currentNode,
                toString : function(){
                    return "ERROR: "+err+" @ "+currentNode;
                }
            };
        }
    }
}