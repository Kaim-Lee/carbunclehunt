
function convertEngToKorZone(eng) {
	return engZone[eng] == null ? eng : engZone[eng];
}

function handleClientLoad() {
	gapi.load('client:auth2', initClient);
}

function initClient() {
	gapi.client.init(gapiConfig).then(function () {
		gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
		updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
	});
}

function updateSigninStatus(isSignedIn) {
	if (isSignedIn) {
		//logged in
		initMain();
		
		$("#login").hide();
		screenChange();
	} else {
		//set screen login
		//gapi.auth2.getAuthInstance().signIn();
		
		$("#login").show();
		$("#special").hide();
		$("#contents").hide();		
	}
}

function doLoginGoogle() {
	gapi.auth2.getAuthInstance().signIn();
}

//https://docs.google.com/spreadsheets/d/10wH2_hjnP-08xuVTPFp6h7IF5Fo9H2e3IQnm7ghOsBM/edit?pref=2&pli=1#gid=234086343
function loadMamulListFromSheet() {
	gapi.client.sheets.spreadsheets.values.get({
		spreadsheetId: '10wH2_hjnP-08xuVTPFp6h7IF5Fo9H2e3IQnm7ghOsBM',
		range: 'Act',
		dateTimeRenderOption: "SERIAL_NUMBER",
		valueRenderOption: "UNFORMATTED_VALUE"
	}).then(function(response) {
		var range = response.result;
		$("#contents table tbody").empty();
		if (range.values.length > 0) {
			importMamul(range.values);
		}
		renderList();
	}, function(response) {
		//appendPre('Error: ' + response.result.error.message);
		renderList();
	});
}

function appendRowSheet(values, callback) {
	gapi.client.sheets.spreadsheets.values.append({
    	spreadsheetId: '1uxXDxWAnFx1_YzHhTtUXEBwT2Rl_jLyaDpOWr_MV8MA',
		range: getParameterByName("admin") == null ? "일반용" : "관리용",
		valueInputOption: "USER_ENTERED", 
		resource: { 
			"majorDimension": "ROWS", 
			values: [ values ] 
		}
	}).then(function(res) { 
		callback();
	});
}


var mamulList = {
	A: [],
	S: [],	
	E: [],
	ES: [],
	ALL: [],
	map: {}
};

function renderList() {
	render(mamulList.A, $("#contents table"));
	render(mamulList.ES, $("#special table"));
	//render(mamulList.E, $("#other table"));
}

var zoneColor = [
	["라노", "lano"],
	["삼림", "sanlim"],
	["다날", "danal"],
	["모르도나", "mordona"],
	["커르", "curu"],
	["아발", "abal"],
	["아지스", "abal"],
	["드라", "dura"]
];

function getZoneColorclass(zone) {
	if (zone == null) return null;
	for (var i = 0; i < zoneColor.length; i++) {
		if (zone.indexOf(zoneColor[i][0]) != -1) return zoneColor[i][1];
	}
	return null;
}

function render(list, $table) {
	$table.find("tbody").empty();
	
	var now = new Date();
	
	for (var i = 0; i < list.length; i++) {
		var mamul = list[i];
		var $row = $table.find(".rowTemplate").clone().removeClass("rowTemplate");
		$row.find(".zone").text(mamulZone[mamul.name]);
		var zoneClass = getZoneColorclass(mamulZone[mamul.name]);
		
		$row.find(".name").text(mamul.name);
		
		var time = "";
		var barWidth = 0;
		var barColor = "";
		if (mamul.s.getTime() > now.getTime()) {
			//노 젠
			time = timeToString(mamul.s.getTime() - now.getTime()) + " 남음";
			$row.addClass("nojen");

			//6시간 미만 일때 바 생성
			if (mamul.s.getTime() - now.getTime() < 21600000) {
				var div = 1 - ((mamul.s.getTime() - now.getTime()) / 21600000);
			//	barWidth = Math.round(div * 100);
			}

			barColor = "rgba(128, 128, 128, 0.5)";
		} else if (mamul.e.getTime() < now.getTime()) {
			//풀 젠
			time = timeToString(now.getTime() - mamul.e.getTime()) + " 경과";
			$row.find(".time").addClass("full");
			$row.find(".name").addClass("glow");

			barWidth = 100;
			barColor = "rgba(231, 76, 60, 0.5)";

			if (zoneClass != null) $row.find(".zone").addClass(zoneClass);
		} else {
			//초 젠과 풀젠 사이
			time = timeToString(mamul.e.getTime() - now.getTime()) + " 남음";
			$row.find(".time").addClass("mid");
			$row.find(".name").addClass("glow");

			var div = 1 - ((mamul.e.getTime() - now.getTime()) / (mamul.e.getTime() - mamul.s.getTime()));
			div = div >= 0.05 ? div : 0.05; //최소 5%
			var blend = blend_colors('#f1c40f', '#2ecc71', div);

			barWidth = Math.round(div * 100);
			barColor = "rgba(" + blend.join(', ') + ", 0.5)";

			if (zoneClass != null) $row.find(".zone").addClass(zoneClass);
		}

		$row.find(".time .text").html(time);
		$row.find(".time .timebar").css({"width": barWidth + "%", "background-color": barColor});

		$table.find("tbody").append($row);
	}

}


var screen = localStorage.getItem("screen");
if (screen == null) screen = 0;

function onClickNavi() {
	screen++;
	screen %= 3;
	screenChange();
}

function screenChange() {
	if (screen == 0) {
		$("#special").hide();
		$("#contents").show();
		$("#other").hide();
		$("#headerTitle span").text("A급 마물 시간표 (카벙클)");
	} else if (screen == 1) {
		$("#special").show();
		$("#contents").hide();
		$("#other").hide();
		$("#headerTitle span").text("S급/특수 돌발 시간표 (카벙클)");
	} else if (screen == 2) {
		$("#special").hide();
		$("#contents").hide();
		$("#other").hide();
		$("#other").hide();
		$("#headerTitle span").text("카벙클 마물 시간표");
	}
	localStorage.setItem("screen", screen);
}

var scales = [ "scale1", "scale2", "scale3", "scale4" ];
var scaleIndex = localStorage.getItem("scaleIndex");
if (scaleIndex == null) scaleIndex = 0;

function onScaleChange() {
	var $html = $("html");
	for (var i = 0; i < scales.length; i++) $html.removeClass(scales[i]);
	$html.addClass(scales[scaleIndex]);
	localStorage.setItem("scaleIndex", scaleIndex);
}


function onOverlayDataUpdate(e) {
	try {
		
		var dead = (e.detail.Encounter.kills > 0);
		var name = e.detail.Encounter.title;
		var zone = e.detail.Encounter.CurrentZoneName;
		
		if (getParameterByName("log") != null) {
			var kor = convertEngToKorZone(zone);
			$("#headerTitle span").text(kor + ": " + name);
			console.log(e.detail.Encounter);
			console.log(e.detail.Combatant["YOU"]);
		}
		
		if (getParameterByName("view") != null) return;
		
		console.log(zone + " -> " + name + " : " + dead + " isActive: " + e.detail.isActive);
		
		if (getParameterByName("report") == "0") return;
		
		if (name == null || name === "Encounter") return;
		
		if (mamulNameConvert[name] != null) name = mamulNameConvert[name];
		
		if (isMamul(name, zone) == false) return;
		if (checkIfReported(name)) return;
		if (isMamulInTimeRange(name) == false) return;
		
		var info = combatInfo(e.detail);
		
		doReport(name, info, dead);
	} catch (ex) {
		
	}
}

function importMamul(rows) {
	var a = [], s = [], e = [];
	var r = s;
	for (i = 0; i < rows.length; i++) {
		var row = rows[i];
		//appendPre(row[0] + ', ' + row[1] + ", " + row[2]);
		//$("#contents table tbody").append("<tr><td>" + row[0] + "</td><td>test</td></tr>");
		
		a.push({
			name: row[0],
			s: convert2jsDate(row[1]),
			e: convert2jsDate(row[2])
		});
		
		if (row[3] === "" || row[3] == null) {
			r = e;
			continue;
		} 
		
		r.push({
			name: row[3],
			s: convert2jsDate(row[4]),
			e: convert2jsDate(row[5])
		});
	}
	
	var es = [], all = [], map = {}
	for (var i = 0; i < a.length; i++) all.push(a[i]);
	for (var i = 0; i < e.length; i++) { es.push(e[i]); all.push(e[i]); }
	for (var i = 0; i < s.length; i++) { es.push(s[i]); all.push(s[i]); }
	for (var i = 0; i < all.length; i++) map[all[i].name] = all[i];
	mamulList.A = a;
	mamulList.S = s;
	mamulList.E = e;
	mamulList.ES = es;
	mamulList.ALL = all;
	mamulList.map = map;
}

function importMamulFromFirebase(list) {
	
	for (var i = 0; i < list.A.length; i++) { list.A[i].s = convert2jsDate(list.A[i].s); list.A[i].e = convert2jsDate(list.A[i].e); } 
	for (var i = 0; i < list.E.length; i++) { list.E[i].s = convert2jsDate(list.E[i].s); list.E[i].e = convert2jsDate(list.E[i].e); }
	for (var i = 0; i < list.S.length; i++) { list.S[i].s = convert2jsDate(list.S[i].s); list.S[i].e = convert2jsDate(list.S[i].e); }
	mamulList = list;
	
	var es = [], all = [], map = {}
	for (var i = 0; i < list.A.length; i++) all.push(list.A[i]);
	for (var i = 0; i < list.E.length; i++) { es.push(list.E[i]); all.push(list.E[i]); }
	for (var i = 0; i < list.S.length; i++) { es.push(list.S[i]); all.push(list.S[i]); }
	for (var i = 0; i < all.length; i++) map[all[i].name] = all[i];
	mamulList.ES = es;
	mamulList.ALL = all;
	mamulList.map = map;
}

function isMamul(name, zone) {
	zone = convertEngToKorZone(zone);
	if (name == "오딘" && zone.indexOf("삼림") != -1) return true;
	return (mamulZone[name] === zone); 
}

function isMamulInTimeRange(name) {
	var info = mamulList.map[name];
	if (info == null) return false;
	var now = new Date().getTime();
	return info.s.getTime() - (1000 * 60 * 60) < now; // 초젠부터 한시간 이후만 신고 가능
}

function combatInfo(data) {
	var info = {
		title:  data.Encounter['title'],
		duration: data.Encounter['DURATION'],
		demage: data.Encounter['denage'],
		encdps: data.Encounter['encdps'],
		combat: {},
		zone: convertEngToKorZone(data.Encounter.CurrentZoneName)
	};
	for (var k in data.Combatant) info.combat[k] = data.Combatant[k].Job;
	return info;
}

function checkIfReported(name) {
	var date = localStorage.getItem("report." + name);
	if (date == null) return false;
	date = new Date(date);
	return (new Date().getTime() - date.getTime()) <= (3 * 60 * 60 * 1000); //3시간 주기
}

function markReported(name) {
	localStorage.setItem("report." + name, (new Date().getTime()));
}

var rTimeout = 0;
function doReport(name, info, dead) {
	var run = function() {
		appendRowSheet([ name, JSON.stringify(info), new Date(), new Date().getTime() ], function() {
			markReported(name);
		});	
	};
	if (rTimeout != 0) {
		clearTimeout(rTimeout);
		rTimeout = 0;
	}
	if (dead) return run();
	
	setTimeout(run, 10000);
}

function setFirebaseListener() {
	firebase.database().ref("timetable").on("value", onFirebaseData);
}

function onFirebaseData(res) {
	importMamulFromFirebase(JSON.parse(res.val().data));
	renderList();
}

$(function() {
	
	$("#toggleBtn").click(function() {
		scaleIndex++;
		scaleIndex %= scales.length;
		onScaleChange();
	});
	onScaleChange();
	
	firebase.initializeApp(firebaseConfig);
});


function initMain() {
	//loadMamulListFromSheet();
	//setInterval(loadMamulListFromSheet, 30000);

	$("#naviButton").click(onClickNavi);
	screenChange();
	
	setFirebaseListener();
}
