var cursor = '<span id="cursor">|</span>';
var typeTimer = null;
var cursorTimer = setInterval(toggleCursor,500);
var commands = null;
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
	if(cursorShown){
		terminal.innerHTML = terminal.innerHTML+cursor;
	}
	index++;
	if(index >= text.length - 1){
		if(shouldReceiveType){
			terminal.innerHTML = terminal.innerHTML+"<span id='typing'></span>";
			document.onkeydown = keyTyped;
		}
		clearInterval(typeTimer);
	}
}

function keyTyped(){
	var typing = document.getElementById("typing");
	var typingText = event.key;
	if(typingText.length == 1){
		currentTypingText = currentTypingText + typingText;
		typing.innerText = currentTypingText;
	}else{
		if(typingText === "Spacebar"){
			currentTypingText = currentTypingText + " ";
			typing.innerText = currentTypingText;
		}else if(typingText === "Backspace"){
			currentTypingText = currentTypingText.substring(0,currentTypingText.length - 1);
			typing.innerText = currentTypingText;
		}else if(typingText === "Enter"){
			console.log(commands);
			//Execute
		}
	}
	console.log(event.key);
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

String.prototype.bytes = function () {
	return(encodeURIComponent(this).replace(/%../g,"x").length);
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
