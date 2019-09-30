var cursor = '<span id="cursor">|</span>';
var typeTimer = null;
var cursorTimer = setInterval(toggleCursor,500);
var commands = null;
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
function init(file,speed,typeable,cmds){
	var xhr = new XMLHttpRequest();
	xhr.open("GET", file, true);
	xhr.onreadystatechange = function() {
		if(this.readyState === XMLHttpRequest.DONE){    
			if (this.status === 200) {
				typeSpeed = speed;
				shouldReceiveType = typeable;
				commands = cmds;
				text = this.response;
				for(let cmd in commands){
					let scriptText = commands[cmd];
					let xhr = new XMLHttpRequest();
					xhr.open("GET", scriptText, true);
					xhr.onreadystatechange = function() {
						if(this.readyState === XMLHttpRequest.DONE && this.status === 200){
							commands[cmd] = this.response;
							let script = commands[cmd];
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
	if(typingText.length == 1){
		currentTypingText = currentTypingText + typingText;
		typing.innerText = currentTypingText;
	}else{
		let terminal = document.getElementsByClassName("terminal")[0];
		if(typingText === "Spacebar"){
			currentTypingText = currentTypingText + " ";
			typing.innerText = currentTypingText;
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
			terminal.innerHTML = terminal.innerHTML+"<br>";
			var typedCommand = currentTypingText;
			currentTypingText = "";
			var typedCommandArgs = typedCommand.split(" ");
			let commandScript = commands[[typedCommandArgs[0]]];
			if(commandScript == undefined){
				let commandScript = commands["*"];
				if(commandScript != undefined){
					executeScript(commandScript);
				}
			}else{
				executeScript(commandScript);
			}
			//console.log(commandScript);
			terminal.innerHTML = terminal.innerHTML+"<span id='typing'></span>";
			if(cursorShown){
				terminal.innerHTML = terminal.innerHTML+cursor;
			}
		}
	}
	console.log(event.key);
}

function executeScript(commandScript){
	let scriptLinesRaw = commandScript.split("\n");
	let requiredIndent = -1;
	let terminal = document.getElementsByClassName("terminal")[0];
	for(let scriptLineNum in scriptLinesRaw){
		let scriptLineRaw = scriptLinesRaw[scriptLineNum];
		if(scriptLineRaw != ""){
			console.log(scriptLineRaw)
			let scriptLine = scriptLineRaw.replace("\t","");
			let scriptArgs = scriptLine.split(" ");
			let indent = (scriptLineRaw.match(/\t/g) || []).length;
			let scriptLabel = scriptArgs[0];
			switch(scriptLabel){
				case "if":
					break;
				case "else":
					break;
				case "set":
					variable[[scriptArgs[1]]] = scriptArgs[3];
					break;
				case "text":
					let text = scriptLine.replace(scriptLabel,"").replace(" ","");
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
