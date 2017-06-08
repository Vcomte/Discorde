function initCanvas(){
	canvas = document.getElementById("canvas");
	ctx = canvas.getContext("2d");
	gameloop = setInterval(playScenario, 16);
	animloop = setInterval(playAnimations, 100);
	tchatloop = setInterval(tchatBoxManager, 75);
	fadeIn = setInterval(fadeIn, 16);
	closedWalls = [];
	openWalls = [];

	//Getting parameters from URL
	parameters = {};

	if (window.location.search.length > 1) {
	  for (var aItKey, nKeyId = 0, aCouples = window.location.search.substr(1).split("&"); nKeyId < aCouples.length; nKeyId++) {
	    aItKey = aCouples[nKeyId].split("=");
	    parameters[unescape(aItKey[0])] = aItKey.length > 1 ? unescape(aItKey[1]) : "";
	  }
	}

	//Get all the walls in the scene
	imgs = document.getElementsByTagName("img");
	for (i = 0; i < imgs.length; i++){
		if (imgs[i].id.startsWith("wall")){
			openWalls.push(imgs[i]);
		}
	}
	
	// setting sounds volume
	document.getElementById("door_open").volume=0.5;
	document.getElementById("connexion").volume=0.2;
}

//adds or removes a wall
function clickWall(wall){

	if(wall.src.endsWith("clickablearea.png")){
		closedWalls.push(wall);
		openWalls.splice(openWalls.indexOf(wall), 1);

		wall.src = wall.src.substring(0, wall.src.length - 17) + "mousedown.png";
		document.getElementById("wall_create").play();
	}
	else if (wall.src.endsWith("mousedown.png")) {
		openWalls.push(wall);
		closedWalls.splice(closedWalls.indexOf(wall), 1);

		wall.src = wall.src.substring(0, wall.src.length - 13) + "clickablearea.png";
		document.getElementById("wall_cancel").play();
	}
}

//animates a particular character and adds messages to tchat. The tchat was also included
//	in order to make the scenario writing and action/messages coordination easier
function actionChar(char){
	if (char.actions[0] == "move"){

		x = parseInt(document.getElementById(char.id).style.left);
		y = parseInt(document.getElementById(char.id).style.top);

		xDifference = char.actions[1] - x;
		yDifference = char.actions[2] - y;
		xWay = xDifference / Math.abs(xDifference)
		yWay = yDifference / Math.abs(yDifference)

		char.direction = xWay;

		xDStep = Math.abs(xDifference) < xStep ? xDifference : xWay * xStep;
		yDStep = Math.abs(yDifference) < yStep ? yDifference : yWay * yStep;

		document.getElementById(char.id).style.left = (xDStep + x) + "px";
		document.getElementById(char.id).style.top = (yDStep + y) + "px";

		if (xDStep == xDifference && yDStep == yDifference){
			char.actions.shift();
			char.actions.shift();
			char.actions.shift();
		}
	}
	else if (char.actions[0] == "idle" || char.actions[0] ==  "attack" || char.actions[0] == "death") {
		if (char.time == 0){
			char.time = char.actions[1];
			/*if (char.actions[0] == "attack"){
				document.getElementById(char.id + "_hit").play();
			}*/
		}
		char.time -= 16;
		if (char.time <= 0){
			char.time = 0;
			/*if (char.actions[0] == "attack"){
				document.getElementById(char.id + "_hit").pause();
			}*/
			char.actions.shift();
			char.actions.shift(); 
		}
	}

	else if (char.actions[0] == "message"){
		if (tchat.scenario.length == 0){
			tchat.time = char.actions[2].length * 100;
		}
		tchat.scenario.push(char.actions[1], char.actions[2]);
		char.actions.shift();
		char.actions.shift();
		char.actions.shift();
	}

	else if (char.actions[0] == "ENDLEVEL" || char.actions[0] == "RESTARTLEVEL"){
		if(document.getElementById("black_background").style.opacity >= 1){
			if(char.actions[0] == "ENDLEVEL"){
				window.open(nextRoom + "?scenario=" + argument, "_self");
			}else{
				window.open("Base.html", "_self");
			}

			char.actions.shift();
		}
		else{
			var b_background = document.getElementById("black_background");
			b_background.style.zIndex = "11";
			b_background.style.opacity = (parseFloat(b_background.style.opacity, 10) + 0.01) + "";
		}
	}
	else if (char.actions[0] == "disappear" || char.actions[0] == "appear"){
		//does nothing
	}

	// Plays a sound, taking the id of the audio in the html file
	else if (char.actions[0] == "sound"){
		document.getElementById(char.actions[1]).play();
		char.actions.shift();
		char.actions.shift();
	}

}

//Full animations for the characters
function animChar(char){

	action = char.actions[0] != null  && char.actions[0] != "message"  && char.actions[0] != "ENDLEVEL" && char.actions[0] != "RESTARTLEVEL" && char.actions[0] != "disappear"  && char.actions[0] != "appear" ? char.actions[0] : "idle";


	if(action == "idle" || action == "death" || char.animation_count > 2){
		char.animation_count = 1;
	}

	if(action == "death" && char.sound_loop != "death" && !char.id.startsWith("lever")){
		document.getElementById(char.id + "_" + "death").play();
		char.sound_loop = "death";
	}

	direction = char.direction > 0 ? "right" : "left";
	document.getElementById(char.id).src = char.source + action + "_" + direction + "_" + char.animation_count++ + ".png";

	if (char.actions[0] == "disappear"){
		document.getElementById(char.id).style.opacity = "0";
		char.actions.shift();
	}
	else if (char.actions[0] == "appear"){
		document.getElementById(char.id).style.opacity = "1";
		document.getElementById("door_open").play();
		char.actions.shift();
	}
}

//Animation specific to the monsters, who only work with gifs
function animMonster(monster){
	action = monster.actions[0] == "death" ? "death" : "idle";

	direction = "left";
	monster_src = document.getElementById(monster.id).src;
	new_src = monster.source + action + "_" + direction + "_" + monster.animation_count + ".gif";

	if(new_src != monster_src){
		monster_src = new_src;
	}

	if(action == "death" && char.sound_loop != "death"){
		document.getElementById(char.id + "_" + "death").play();
		char.sound_loop = "death";
	}

	if (monster.actions[0] == "disappear"){
		document.getElementById(monster.id).style.opacity = "0";
	}
	else if (monster.actions[0] == "appear"){
		document.getElementById(monster.id).style.opacity = "1";
	}
}

function fadeIn(){
	var black_background = document.getElementById("black_background");
	if (black_background.style.opacity != "0"){
		black_background.style.opacity = (parseFloat(black_background.style.opacity) - 0.01) + "";
	}else{
		black_background.style.zIndex = "0";

		clearInterval(fadeIn);
	}
}

//Writes in the tchat box, tchat box has a size of 10
function tchatBoxManager(){
	if (tchat.scenario[0] != null){
		if (tchat.time <= 0){

			var div = document.getElementById("tchat_area");
			var messages = div.getElementsByTagName("p");

			name = "";
			color = "";
			if (tchat.scenario[0] == "system"){
				name = "System";
				color = "pink";
			}
			else if(tchat.scenario[0] == "monstre"){
				name = "CycloPoulpe";
				color = "purple";
			}
			else if(tchat.scenario[0] ==  "knight"){
				name = "Legend27";
				color = "black";
			}else if (tchat.scenario[0] == "ninja"){
				name = "DarkSasuke";
				color = "red";
			}else{
				name = "Charlène53";
				color = "green";
			}

			var newHtml = "";

			balise_system = tchat.scenario[0] == "system" ? "<i>" : "";
			close_system =  tchat.scenario[0] == "system" ? "</i>" : "";


 			if(div.childNodes.length > 6){
 				div.removeChild(div.firstChild);
 			}
		    var p = document.createElement("p");
		    
			p.innerHTML = "<div style=\"position:static; display:inline-block;border:2px solid black; border-radius:7px; background-color:white; padding:5px; font-family:Verdana;\">"
			+"<b style=\"color:" + color + ";\">" + name + ": </b>  " + balise_system + tchat.scenario[1] + close_system + " </div>";
		    div.appendChild(p); 

			tchat.scenario.shift();
			tchat.scenario.shift();
			//Setting time to next message depending on number of characters in text
			tchat.time = tchat.scenario[0] != null ? tchat.scenario[1].length*100 : 0;

			//play tchat sound
			document.getElementById("chat_sound").play();

			//newHtml += "<p alt=\"\" style=\"color:black; font-family: Verdana;\"><span style=\"display:inline; border:2px solid black; border-radius:7px; background-color:white; padding:5px;\"> <b style=\"color:" + color + ";\">" + name + ": </b>  " + tchat.scenario[1] + " </span></p>";

		}
		tchat.time -= 100;
	}
}