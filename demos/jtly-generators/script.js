var Generator = Generator || {};

Generator.getSelectById = function (id) {
	const el = document.getElementById(id);
	return el.options[el.selectedIndex].value;
};

Generator.getCheckListByName = function (name) {
	const checkbox = document.getElementsByName(name);
	const checkList = [];
	for (const key in checkbox) {
		if (checkbox[key].checked) {
			checkList.push(checkbox[key].value);
		}
	}
	return checkList;
};

Generator.generate = function () {
	let result = "";
	const schedule = this.getSelectById("schedule");

	// <schedule:
	if (schedule === "schedule") {
		result += "<schedule:";
	}
	// <schedule_wd:[weekday_arry],
	else if (schedule === "schedule_wd") {
		result += "<schedule_wd:";
		const checkList = this.getCheckListByName("weekday");
		result += `[${checkList}],`;
	}
	// <schedule_weather:[weather_id_array],
	else if (schedule === "schedule_weather") {
		result += "<schedule_weather:";
		const checkList = this.getCheckListByName("weather");
		result += `[${checkList}],`;
	}
	// <schedule_random:[0.3,-1],
	else if (schedule === "schedule_random") {
		result += "<schedule_random:";
		const prob = document.getElementById("prob").value;
		const checkList = this.getCheckListByName("random");
		result += `[${prob},${checkList[0]}],`;
	}

	// [x1,y1],[x2,y2],[x3,y3],[x4,y4]>
	const day = [];
	day.push(document.getElementById("night_x").value);
	day.push(document.getElementById("night_y").value);
	day.push(document.getElementById("dawn_x").value);
	day.push(document.getElementById("dawn_y").value);
	day.push(document.getElementById("day_x").value);
	day.push(document.getElementById("day_y").value);
	day.push(document.getElementById("dusk_x").value);
	day.push(document.getElementById("dusk_y").value);

	let dayStr = "";

	for (let i = 0; i < day.length; i += 2) {
		if (day[i] && day[i + 1]) dayStr += `[${day[i]},${day[i + 1]}]`;
		if (day[i + 2] && day[i + 3]) dayStr += ",";
	}

	dayStr += ">";

	// const night_x = document.getElementById('night_x').value;
	// const night_y = document.getElementById('night_y').value;
	// const dawn_x = document.getElementById('dawn_x').value;
	// const dawn_y = document.getElementById('dawn_y').value;
	// const day_x = document.getElementById('day_x').value;
	// const day_y = document.getElementById('day_y').value;
	// const dusk_x = document.getElementById('dusk_x').value;
	// const dusk_y = document.getElementById('dusk_y').value;

	// const arras_str = `[${night_x},${night_y}],[${dawn_x},${dawn_y}],[${day_x},${day_y}],[${dusk_x},${dusk_y}]>`;

	result += dayStr.replaceAll("-1", "null");

	const output = document.getElementById("output");
	output.value = result;
};

Generator.showSchedule = function (type) {
	const types = ["weekday", "weather", "random"];
	for (const t of types) {
		const el = document.getElementById(t);
		if (t === type) {
			el.style.display = "block";
			continue;
		}
		el.style.display = "none";
	}
};

Generator.showArgsNum = function (num) {
	const idList = ["args_1", "args_2", "args_3", "args_4"];
	for (let i = 0; i < idList.length; i++) {
		const el = document.getElementById(idList[i]);
		if (i < num) el.style.display = "inline-block";
		else el.style.display = "none";
	}
};

Generator.generateScript = function () {
	const type = this.getSelectById("script_type");
	const args_1 = document.getElementById("args_1").value;
	const args_2 = document.getElementById("args_2").value;
	const args_3 = document.getElementById("args_3").value;
	const args_4 = document.getElementById("args_4").value;

	const output = document.getElementById("output");

	// $gameSystem.isRandomSchedule(map_id, event_id, random_schedule_id)
	if (type === "is_random_schedule") output.value = `$gameSystem.isRandomSchedule(${args_1}, ${args_2}, ${args_3})`;
	// $gameSystem.linkSchedule(map_id, event_id, x, y);
	else if (type === "link_schedule")
		output.value = `$gameSystem.linkSchedule(${args_1}, ${args_2}, ${args_3}, ${args_4})`;
	// this.event().isLinkOk(event_id,day_phase)
	else if (type === "is_link") output.value = `this.event().isLinkOk(${args_1}, ${args_2})`;
};

Generator.init = function () {
	this.showSchedule(null);
	this.showArgsNum(3);

	const btn = document.getElementById("generate");
	btn.addEventListener("click", () => {
		this.generate();
	});

	const btn2 = document.getElementById("generate_2");
	btn2.addEventListener("click", () => {
		this.generateScript();
	});

	const selSchedule = document.getElementById("schedule");
	selSchedule.addEventListener("change", () => {
		const scheduleType = this.getSelectById("schedule");

		if (scheduleType === "schedule") {
			this.showSchedule(null);
		} else if (scheduleType === "schedule_wd") {
			this.showSchedule("weekday");
		} else if (scheduleType === "schedule_weather") {
			this.showSchedule("weather");
		} else if (scheduleType === "schedule_random") {
			this.showSchedule("random");
		}
	});

	const selScript = document.getElementById("script_type");
	selScript.addEventListener("change", () => {
		const scriptType = this.getSelectById("script_type");
		const tips = document.getElementById("tips");
		if (scriptType === "is_random_schedule") {
			this.showArgsNum(3);
			tips.innerText = "参数：map_id, event_id, random_schedule_id";
		} else if (scriptType === "link_schedule") {
			this.showArgsNum(4);
			tips.innerText = "参数：map_id, event_id, x, y";
		} else if (scriptType === "is_link") {
			this.showArgsNum(2);
			tips.innerText = "参数：event_id, day_phase";
		}
	});

	// selScript.options[0].selected = true;
	selScript.dispatchEvent(new Event("change"));
};

window.onload = function () {
	Generator.init();
};
