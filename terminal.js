var cursor = '<span id="cursor">|</span>';
var typeTimer = null;
var cursorTimer = setInterval(toggleCursor,500);
var typeSpeed = 0;
var text = "";
var colorText = "";
var colorIndex = 0;
var colorTargetId = 0;
var colorTypeTimer = null;
var index = 0;
function init(file,speed){
	var xhr = new XMLHttpRequest();
	xhr.open("GET", file, true);
	xhr.onreadystatechange = function() {
		if(this.readyState === XMLHttpRequest.DONE){    
			if (this.status === 200) {
				typeSpeed = speed;
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
			colorText = text.substring(index,index + length);
			index = index + length;
			terminal.innerHTML = terminal.innerHTML+"<span id='"+index+"'style='color:"+color+"'>"+colorText.charAt(0)+"</span>";
			colorIndex = 1;
			colorTargetId = index;
			clearInterval(typeTimer);
			colorTypeTimer = setInterval(typeColoredText,typeSpeed);
			return;
		}else if(command.startsWith("{skip:")){
			command = command.substring(0,command.indexOf("}")+1);
			index = index + command.length;
			var length = parseInt(command.replace("{skip:","").replace("}",""));
			targetText = text.substring(index,index + length);
			index = index + length;
			terminal.innerHTML = terminal.innerHTML+targetText;
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

function typeColoredText(){
	var target = document.getElementById(colorTargetId);
	target.innerText = target.innerText + colorText.charAt(colorIndex);
	colorIndex++;
	if(colorIndex >= colorText.length){
		colorText = "";
		colorIndex = 0;
		colorTargetId = 0;
		clearInterval(colorTypeTimer);
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
