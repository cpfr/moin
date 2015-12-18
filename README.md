# moin

**moin** is a *Monty* interpreter implemented in pure *Javascript* using the
parser generator [PEG.js](http://pegjs.org/). Besides the
[moco](https://github.com/MontysCoconut/moco) *Monty* compiler, it is the second
attempt to implement the language.

### Status
**moin** is still in development and does not cover the whole language.

### Demo
A live demo can be found [here](http://htmlpreview.github.io/?https://github.com/cpfr/moin/blob/master/demo.html)

### Usage

Since the execution of a Monty program may take some time, the browser
window will freeze while the program is interpreted. To avoid that, web workers
can be used. Web workers are threads for Javascript. **moin** is able to
automatically detect whether web workers are available. If yes, a web worker
thread will be started for the interpretation of the Monty program. If not,
the browser window will freeze during execution. The user of the library does
not have to care about web workers.

For **moin** to work properly, the four files ``moin.js``, ``parser.js``,
``interpreter.js`` and ``worker.js`` must be copied into your project folder. 
However, only the ``moin.js`` file must be included in the HTML file, the other 
files are loaded dynamically.

```html
<script type="application/javascript" src="moin.js"></script>
<script type="application/javascript">
moin("println(55)");
</script>
```

First, the script ``moin.js`` is included. Then, the function ``moin`` is used 
in order to start the interpreter in a worker thread. The first parameter of 
the function is a string that contains the input *Monty* program. The second 
parameter is an optional options object. The following example shows all 
possible options:

```javascript
moin("println(55)", {
    done : function(){},
    print : function(msg){},
    read : function(){return "";},
    err : function(msg){},
    scriptpath : ""
});
```

**Options:**
- ``done`` A function that is called when the execution of the code is done.
   It should not take any parameters and have no return value
- ``print`` This function will be called when the *Monty* ``print`` or
   ``println`` function is called. You can use it in order to pop up a dialog
   or write it into an HTML element.
- ``read`` This function will be called when the *Monty* ``read`` or ``readln``
   function is called. It should return a string value.
- ``err`` This function will be called when an error occurs.
- ``scriptpath`` this parameter specifies where the **moin** javascript files 
   are located. If omitted, it is assumed that they reside in the same directoy
   as the HTML document.

### License
The MIT license is a very permissive open source license. See the 
[LICENSE](https://github.com/cpfr/moin/blob/master/LICENSE) file for more 
information.