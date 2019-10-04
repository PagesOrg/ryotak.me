var cursor = '<span id="cursor">|</span>';
var typeTimer = null;
var cursorTimer = setInterval(toggleCursor,500);
var commands = null;
var blockedChars = null;
var variable = {"currentdirectory": "~"};
var typeSpeed = 0;
var text = "";
var currentTypingText = "";
var docText = "";
var docIndex = 0;
var docTargetId = 0;
var docTypeTimer = null;
var index = 0;
var shouldReceiveType = false;
function init(file,speed,typeable,cmds,blockChars){
	var xhr = new XMLHttpRequest();
	xhr.open("GET", file, true);
	xhr.onreadystatechange = function() {
		if(this.readyState === XMLHttpRequest.DONE){    
			if (this.status === 200) {
				typeSpeed = speed;
				shouldReceiveType = typeable;
				commands = cmds;
				blockedChars = blockChars;
				text = this.response;
				for(let cmd in commands){
					let ieCMD = cmd;
					let scriptText = commands[ieCMD];
					let xhr = new XMLHttpRequest();
					xhr.open("GET", scriptText, true);
					xhr.onreadystatechange = function() {
						if(this.readyState === XMLHttpRequest.DONE && this.status === 200){
							console.log(ieCMD+" "+this.response);
							commands[ieCMD] = this.response;
							let script = commands[ieCMD];
							let lines = script.split("\n");
							for(line in lines){
								let commandLine = lines[line].replace(/\t/g,"");
								if(commandLine.length != 0){
									let commandArgs = commandLine.split(" ");
								 	let labelArg = commandArgs[0];
									if(labelArg == "load"){
										let textFetcher = new XMLHttpRequest();
										textFetcher.open("GET", commandArgs[1], true);
										textFetcher.onreadystatechange = function() {
											if(this.readyState === XMLHttpRequest.DONE && this.status === 200){
												variable[[commandArgs[3]]] = this.response;
											}
										}
										textFetcher.send();
									}
								}
							}
						}
					}
					xhr.send();
				}
				startType();
			}else{
				typeSpeed = speed;
				text = "{skip:53}connect to host localhost port 22: Connection refused";
				startType();
			}
		}
	}
	xhr.send();
}

function startType(){
	typeTimer = setInterval(typeNext,typeSpeed);
}

function typeNext(){
	var terminal = document.getElementsByClassName("terminal")[0];
	var terminalLog = terminal.innerHTML;
	var cursorShown = false;
	if(terminalLog.endsWith(cursor)){
		terminal.innerHTML = terminalLog.substring(0,terminalLog.lastIndexOf(cursor));
		cursorShown = true;
	}
	var nextChar = text.charAt(index);
	if(nextChar == "{"){
		var command = text.substring(index,text.length);
		if(command.startsWith("{nl}")){
			terminal.innerHTML = terminal.innerHTML+"<br>";
			index = index + 4;
			return;
		}else if(command.startsWith("{wait:")){
			command = command.substring(0,command.indexOf("}")+1);
			index = index + command.length;
			var length = command.replace("{wait:","").replace("}","");
			clearInterval(typeTimer);
			setTimeout(startType,length);
			return;
		}else if(command.startsWith("{color:")){
			command = command.substring(0,command.indexOf("}")+1);
			index = index + command.length;
			var colorArgs = command.replace("{color:","").replace("}","").split(":");
			var color = colorArgs[0];
			var length = parseInt(colorArgs[1]);
			docText = text.substring(index,index + length);
			index = index + length;
			terminal.innerHTML = terminal.innerHTML+"<span id='"+index+"'style='color:"+color+"'>"+docText.charAt(0)+"</span>";
			docIndex = 1;
			docTargetId = index;
			clearInterval(typeTimer);
			docTypeTimer = setInterval(typeTextToDoc,typeSpeed);
			return;
		}else if(command.startsWith("{skip:")){
			command = command.substring(0,command.indexOf("}")+1);
			index = index + command.length;
			var length = parseInt(command.replace("{skip:","").replace("}",""));
			targetText = text.substring(index,index + length);
			index = index + length;
			terminal.innerHTML = terminal.innerHTML+targetText;
			return;
		}else if(command.startsWith("{link:")){
			command = command.substring(0,command.indexOf("}")+1);
			index = index + command.length;
			var linkArgs = command.replace("{link:","").replace("}","").split(":");
			var link = linkArgs[0];
			var length = parseInt(linkArgs[1]);
			docText = text.substring(index,index + length);
			index = index + length;
			terminal.innerHTML = terminal.innerHTML+"<a id='"+index+"' href='"+link+"'>"+docText.charAt(0)+"</a>";
			docIndex = 1;
			docTargetId = index;
			clearInterval(typeTimer);
			docTypeTimer = setInterval(typeTextToDoc,typeSpeed);
			return;
		}
	}
	terminal.innerHTML = terminal.innerHTML+nextChar;
	window.scrollTo(0,document.body.scrollHeight);
	index++;
	if(index >= text.length - 1){
		if(shouldReceiveType){
			terminal.innerHTML = terminal.innerHTML+"<span id='typing'></span>";
			document.onkeydown = keyTyped;
		}
		clearInterval(typeTimer);
	}
	if(cursorShown){
		terminal.innerHTML = terminal.innerHTML+cursor;
	}
}

function keyTyped(){
	var typing = document.getElementById("typing");
	var typingText = event.key;
	if(blockedChars.indexOf(typingText) == -1){
		if(typingText.length == 1){
			if(typingText === " "){
				if(!currentTypingText.endsWith(" ")){
					currentTypingText = currentTypingText + " ";
					typing.innerText = currentTypingText;
				}
			}else{
				currentTypingText = currentTypingText + typingText;
				typing.innerText = currentTypingText;
			}
		}else{
			let terminal = document.getElementsByClassName("terminal")[0];
			if(typingText === "Spacebar"){
				if(!currentTypingText.endsWith(" ")){
					currentTypingText = currentTypingText + " ";
					typing.innerText = currentTypingText;
				}
			}else if(typingText === "Backspace"){
				currentTypingText = currentTypingText.substring(0,currentTypingText.length - 1);
				typing.innerText = currentTypingText;
			}else if(typingText === "Enter"){
				document.getElementById("typing").removeAttribute("id");
				var cursorShown = false;
				if(terminal.innerHTML.endsWith(cursor)){
					terminal.innerHTML = terminal.innerHTML.substring(0,terminal.innerHTML.lastIndexOf(cursor));
					cursorShown = true;
				}
				//terminal.innerHTML = terminal.innerHTML+"<br>";
				var typedCommand = currentTypingText;
				currentTypingText = "";
				var typedCommandArgs = typedCommand.split(" ");
				let commandScript = commands[[typedCommandArgs[0]]];
				if(commandScript == undefined){
					let commandScript = commands["*"];
					if(commandScript != undefined){
						executeScript(commandScript,typedCommandArgs);
					}
				}else{
					executeScript(commandScript,typedCommandArgs);
				}
				//console.log(commandScript);
				window.scrollTo(0,document.body.scrollHeight);
				terminal.innerHTML = terminal.innerHTML+"<span id='typing'></span>";
				if(cursorShown){
					terminal.innerHTML = terminal.innerHTML+cursor;
				}
			}
		}
	}
	console.log(event.key)
	if(event.keyCode == 8){
		return false;
	}
}

function executeScript(commandScript,commandArgs){
	console.log(commandScript);
	let scriptLinesRaw = commandScript.split("\n");
	let requiredIndent = -1;
	let terminal = document.getElementsByClassName("terminal")[0];
	let previousIf = false;
	for(let scriptLineNum in scriptLinesRaw){
		let scriptLineRaw = scriptLinesRaw[scriptLineNum];
		if(scriptLineRaw != ""){
			console.log(scriptLineRaw)
			let scriptLine = scriptLineRaw.replace(/\t/g,"");
			let scriptArgs = scriptLine.split(" ");
			let indent = (scriptLineRaw.match(/\t/g) || []).length;
			let scriptLabel = scriptArgs[0];
			console.log(requiredIndent)
			console.log(indent)
			if(requiredIndent == -1 || requiredIndent >= indent){
				console.log("Executing: "+scriptLineRaw);
				console.log(commandArgs);
				console.log(scriptLabel);
				variable["arg0"] = commandArgs[0];
				variable["arg1"] = commandArgs[1];
				variable["arg2"] = commandArgs[2];
				variable["arg3"] = commandArgs[3];
				switch(scriptLabel){
					case "if":
						console.log(scriptArgs);
						if(scriptArgs[3] == "none"){
							scriptArgs[3] = "";
						}
						if(scriptArgs[2] == "is"){
							console.log(variable[[scriptArgs[1]]]+"=="+scriptArgs[3])
							if(variable[[scriptArgs[1]]] == scriptArgs[3]){
								requiredIndent = indent + 1;
								previousIf = true;
							}else{
								requiredIndent = indent;
								previousIf = false;
							}
						}else{
							if(variable[[scriptArgs[1]]] != scriptArgs[3]){
								requiredIndent = indent + 1;
								previousIf = true;
							}else{
								requiredIndent = indent;
								previousIf = false;
							}
						}
						break;
					case "else":
						if(!previousIf){
							if(scriptArgs[1] == "if"){
								if(scriptArgs[4] == "none"){
									scriptArgs[4] = "";
								}
								if(scriptArgs[3] == "is"){
									if(variable[[scriptArgs[2]]] == scriptArgs[4]){
										previousIf = true;
										requiredIndent = indent + 1;
									}else{
										requiredIndent = indent;
									}
								}else{
									if(variable[[scriptArgs[2]]] != scriptArgs[4]){
										previousIf = true;
										requiredIndent = indent + 1;
									}else{
										requiredIndent = indent;
									}
								}
							}else{
								previousIf = true;
								requiredIndent = indent + 1;
							}
						}else{
							requiredIndent = indent;
						}
						break;
					case "set":
						console.log("SET!");
						variable[[scriptArgs[1]]] = scriptArgs[3];
						break;
					case "text":
						let text = scriptLine.replace(scriptLabel,"").replace(" ","");
						console.log(text);
						if(text.startsWith("@")){
							let name = text.replace("@","");
							terminal.innerHTML = terminal.innerHTML + variable[[name]];
						}else{
							terminal.innerHTML = terminal.innerHTML + text;
						}
						break;
					case "clear":
						terminal.innerHTML = "";
						break;
					case "complete":
						let matchedText = "";
						let completeMatch = false;
						for(let arg in scriptArgs){
							if(arg.startsWith(commandArgs[1])){
								if(matchedText == ""){
									matchedText = arg;
									completeMatch = true;
								}else{
									matchedText = matchedText + "　"+ arg;
									completeMatch = false;
								}
							}
						}
						if(completeMatch){
							let typing = document.getElementById("typing");
							typing.innerText = typing.innerText + matchedText;
						}else{
							document.getElementById("typing").removeAttribute("id");
							var cursorShown = false;
							if(terminal.innerHTML.endsWith(cursor)){
								terminal.innerHTML = terminal.innerHTML.substring(0,terminal.innerHTML.lastIndexOf(cursor));
								cursorShown = true;
							}
							terminal.innerHTML = terminal.innerHTML + matchedText;
							terminal.innerHTML = terminal.innerHTML+"<span id='typing'></span>";
							if(cursorShown){
								terminal.innerHTML = terminal.innerHTML+cursor;
							}
						}
						break;
				}
			}
			for(let scriptArgNum in scriptArgs){
				let scriptArg = scriptArgs[scriptArgNum];
			}
		}
	}
}

function typeTextToDoc(){
	var target = document.getElementById(docTargetId);
	target.innerText = target.innerText + docText.charAt(docIndex);
	docIndex++;
	if(docIndex >= docText.length){
		docText = "";
		docIndex = 0;
		docTargetId = 0;
		clearInterval(docTypeTimer);
		startType();
	}
}

function toggleCursor(){
	var terminal = document.getElementsByClassName("terminal")[0];
	var terminalLog = terminal.innerHTML;
	if(terminalLog.endsWith(cursor)){
		terminal.innerHTML = terminalLog.substring(0,terminalLog.lastIndexOf(cursor));
	}else{
		terminal.innerHTML = terminalLog+cursor;
	}
}

if(!String.prototype.endsWith){
	String.prototype.endsWith = function(str) {
		var diff = this.length - str.length;
		return diff >= 0 && this.lastIndexOf(str) === diff;
	};
}

if(!String.prototype.startsWith){
	String.prototype.startsWith = function(str) {
		return this.indexOf(str) === 0;
	};
}
