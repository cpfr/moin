function MtyInterpreter(ast, printfn, readfn){
    this.ast = ast;

    var _printfn = printfn || function(msg){ console.log(msg); };
    var _readfn = readfn || function(){ return prompt(); };

    var _actions = {};

    var _eval = function(node, lvalue){
        lvalue = lvalue || false;
        return _actions[node.name](node, lvalue);
    };
    var _blockStack = [];

    var _resolveVariable = function(variableName, lvalue){
        var blockIndex = _blockStack.length-1;
        var result = undefined;
        while((result == undefined)&&(blockIndex >= 0)){
            result = _blockStack[blockIndex].resolveVariable(variableName);
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
        if(node.functionName == "print"){
            var param = _eval(node.parameters[0]);
            _printfn(param.getValue());
        }
        else if(node.functionName == "println"){
            var param = _eval(node.parameters[0]);
            _printfn(param.getValue());
            _printfn("\n");
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
                break;
            case 'yield':
                break;
            case 'raise':
                break;
            case 'skip': // node.argument always undefined
                break;
            case 'break': // node.argument always undefined
                break;
        }
    }

    _actions['Block'] = function(node) {
        _blockStack.push(node);

        var stmts = node.statements;
        for(i = 0; i < stmts.length; i++){
            _actions[stmts[i].name](stmts[i]);
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
        _actions[ast.name](ast);
    }
}