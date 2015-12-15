<?php
if(isset($_POST["overwrite"])){
    $f = fopen("src/parser.js", "w");
    fwrite($f, "var mtyParser = ".$_POST["overwrite"]);
    fclose($f);
    echo "ok";
    die;
}
?>
<html>
  <head>
    <title>Moin - Monty Syntax Generator</title>
        <meta charset="UTF-8"/>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <meta name="viewport" content="width=device-width"/>
        <meta name="author" content="Carsten Pfeffer"/>
  </head>
  <body>

    
    <textarea id="grammar" style="display: none;">
    <?php
        require('src/monty.grammar');
    ?>
    </textarea>

    <textarea id="mtycode" style="min-width: 800px; min-height: 250px;">class Point:
    Int x := 1
    Int y

    + initializer(Int x, Int y):
        self.x := x
        self.y := y

    + move(Int x, Int y):
        self.x += x
        self.y += y

Point p := Point(5,7)
p.move(1,1)
print(p.x)
print(" ")
println(p.y)
</textarea>
    <div style="display: inline-block">
        <button id="overwrite" onclick="generate('source')">overwrite version on server</button><br/>
        <button id="generate" onclick="generate()">generate grammar</button><br/>
        <button id="parse" onclick="onParse()">parse code</button>
    </div>

    <script src="jquery.js"></script>
    <script type="application/javascript" src="src/parser.js"></script>
    <script type="application/javascript" src="peg-0.9.0.min.js"></script>
    <script type="application/javascript">
    var parser = mtyParser;
    function generate(mode){
        mode = mode || "parser";
        
        var grammar = document.getElementById("grammar").value;
        // var parser = PEG.buildParser(, {output : "source"});
        try{
            var tmp = PEG.buildParser(grammar, {
                trace  : false,
                cache  : false,
                output : mode
            });
        }
        catch(err){
            console.log("ERROR!");
            console.log(err);
        }

        if(mode == "parser"){
            parser = tmp;
            console.log(parser)
        }
        else if(mode == "source"){
            $.post("generate.php", {overwrite : tmp}, function(msg){
                alert(msg);
            });
        }
    }

    var i = 0;
    function log(msg){
        console.log(i + ": "+msg);
        i++;
    }

    function onParse(){
        try{
            var ast = parser.parse(document.getElementById("mtycode").value+"\n",
                { tracer : { trace : function(evt){
                                if(evt.type == "rule.match"){
                                    console.log("MATCH  "+evt.rule+" at "
                                        +evt.location.start.line+":"
                                        +evt.location.start.column);
                                }
                                else if(evt.type == "rule.fail"){
                                    console.log("FAILED "+evt.rule+" at "
                                        +evt.location.start.line+":"
                                        +evt.location.start.column);
                                }
                }}});
            console.log(ast);
        }
        catch(err){
            console.log(err);
        }
    }
    </script>
  </body>
</html>