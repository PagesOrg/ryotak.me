var cursor = '<span id="cursor">|</span>';
var typeTimer = null;
var cursorTimer = setInterval(toggleCursor,500);
var text = "";
var index = 0;
function init(file,speed){
	var xhr = new XMLHttpRequest();
	xhr.open("GET", file, true);
	xhr.onreadystatechange = function() {
		if(this.readyState === XMLHttpRequest.DONE){    
			if (this.status === 200) {
				startType(this.response,speed);
			}else{
				startType("{skip:53}connect to host localhost port 22: Connection refused",speed);
			}
		}
	}
	xhr.send();
}

function startType(log,speed){
	text = log;
	typeTimer = setInterval(typeNext,speed);
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
		var command = text.substring(index,index+6);
		if(command.startsWith("{nl}")){
			terminal.innerHTML = terminal.innerHTML+"<br>"
			index = index + 4;
			return;
		}
	}
	terminal.innerHTML = terminal.innerHTML+nextChar;
	if(cursorShown){
		terminal.innerHTML = terminal.innerHTML+cursor;
	}
	index++;
	if(index >= text.length - 1){
		clearInterval(typeTimer);
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
