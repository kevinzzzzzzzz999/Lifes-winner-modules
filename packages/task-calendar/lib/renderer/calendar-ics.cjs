Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
let open_source_inkspace_desktop_src_renderer_calendar_model_ts = require("./calendar-model.cjs");
//#region open-source/inkspace/desktop/src/renderer/calendar-ics.ts
const DAYS = [
	"SU",
	"MO",
	"TU",
	"WE",
	"TH",
	"FR",
	"SA"
];
const DAY = 864e5;
const MAX_BYTES = 4194304;
const error = (message) => {
	throw new Error(message);
};
const unescapeText = (s) => s.replace(/\\([nN,;\\])/g, (_, c) => /n/i.test(c) ? "\n" : c);
const escapeText = (s) => s.replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r/g, "\\n");
const basicDate = (s) => s.replace(/[-:]/g, "");
const utcStamp = (ms) => new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
const uid = () => globalThis.crypto.randomUUID();
const isUtc = (zone) => [
	"UTC",
	"Etc/UTC",
	"GMT",
	"Etc/GMT"
].includes(zone);
function standaloneUid(eventUid, originalStart) {
	let hash = 2166136261;
	for (const char of eventUid + "|" + originalStart) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
	return `${eventUid.slice(0, 350)}-instance-${(hash >>> 0).toString(16)}@winner.local`;
}
function splitUnquoted(value, separator) {
	const result = [];
	let quoted = false, start = 0;
	for (let i = 0; i < value.length; i++) {
		if (value[i] === "\"" && value[i - 1] !== "\\") quoted = !quoted;
		if (!quoted && value[i] === separator) {
			result.push(value.slice(start, i));
			start = i + 1;
		}
	}
	if (quoted) error("属性包含未闭合的引号");
	result.push(value.slice(start));
	return result;
}
function property(line) {
	let quoted = false, colon = -1;
	for (let i = 0; i < line.length; i++) {
		if (line[i] === "\"" && line[i - 1] !== "\\") quoted = !quoted;
		if (line[i] === ":" && !quoted) {
			colon = i;
			break;
		}
	}
	if (colon < 0) return error("属性缺少冒号");
	const head = splitUnquoted(line.slice(0, colon), ";"), name = head.shift().toUpperCase();
	if (!/^[A-Z0-9-]+$/.test(name)) return error("属性名称无效");
	const params = Object.create(null);
	for (const p of head) {
		const index = p.indexOf("=");
		if (index < 1) return error("属性参数无效");
		const key = p.slice(0, index).toUpperCase();
		if (Object.hasOwn(params, key)) return error("属性参数重复");
		params[key] = p.slice(index + 1).replace(/^"(.*)"$/, "$1").replace(/\^n/gi, "\n").replace(/\^'/g, "\"").replace(/\^\^/g, "^");
	}
	return {
		name,
		params,
		value: line.slice(colon + 1)
	};
}
function parseComponents(input) {
	if (input.length > MAX_BYTES || new TextEncoder().encode(input).length > MAX_BYTES) return error("ICS 文件超过 4 MiB");
	if (input.includes("\0")) return error("ICS 包含无效字符");
	const lines = input.replace(/^\uFEFF/, "").replace(/\r\n[ \t]|\n[ \t]/g, "").split(/\r\n|\n|\r/);
	if (lines.length > 1e5) return error("ICS 行数超出限制");
	const root = {
		name: "ROOT",
		properties: [],
		children: []
	}, stack = [root];
	for (const line of lines) {
		if (!line.trim()) continue;
		const p = property(line), top = stack[stack.length - 1];
		if (p.name === "BEGIN") {
			if (stack.length > 8 || !/^[A-Z0-9-]+$/i.test(p.value)) return error("ICS 组件嵌套过深或名称无效");
			const component = {
				name: p.value.toUpperCase(),
				properties: [],
				children: []
			};
			top.children.push(component);
			stack.push(component);
		} else if (p.name === "END") {
			if (stack.length < 2 || top.name !== p.value.toUpperCase()) return error("ICS 组件没有正确闭合");
			stack.pop();
		} else top.properties.push(p);
	}
	if (stack.length !== 1 || root.children.length !== 1 || root.children[0].name !== "VCALENDAR") return error("文件不是完整的 VCALENDAR");
	return root.children[0];
}
function all(c, name) {
	return c.properties.filter((p) => p.name === name);
}
function one(c, name, required = false) {
	const values = all(c, name);
	if (values.length > 1 || required && !values.length) return error(`${name} 缺失或重复`);
	return values[0];
}
function parseDate(p, floatingZone, warnings) {
	const raw = p.value;
	if (p.params.VALUE && !["DATE", "DATE-TIME"].includes(p.params.VALUE.toUpperCase())) return error("不支持此日期值类型");
	if (p.params.VALUE?.toUpperCase() === "DATE") {
		if (!/^\d{8}$/.test(raw) || p.params.TZID) return error("全天日期格式无效");
		const value = `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
		(0, open_source_inkspace_desktop_src_renderer_calendar_model_ts.addDays)(value, 0);
		return {
			value,
			allDay: true,
			timeZone: floatingZone
		};
	}
	if (!/^\d{8}T\d{6}Z?$/.test(raw) || raw.slice(13, 15) !== "00") return error("仅支持精确到分钟的 DATE-TIME（秒必须为 00）");
	if (raw.endsWith("Z") && p.params.TZID) return error("UTC 时间不能同时设置 TZID");
	const value = `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}T${raw.slice(9, 11)}:${raw.slice(11, 13)}`;
	const timeZone = raw.endsWith("Z") ? "UTC" : p.params.TZID || floatingZone;
	(0, open_source_inkspace_desktop_src_renderer_calendar_model_ts.wallToMs)(value, timeZone);
	if (!raw.endsWith("Z") && !p.params.TZID && warnings) warnings.push(`浮动时间按本机时区 ${floatingZone} 导入`);
	return {
		value,
		allDay: false,
		timeZone
	};
}
function duration(value) {
	const m = /^([+-])?P(?:(\d+)W|(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?)$/.exec(value);
	if (!m || !m.slice(2).some(Boolean) || m[6] && +m[6] % 60) return error("不支持此持续时间（需要整分钟）");
	const days = Number(m[2] || 0) * 7 + Number(m[3] || 0), ms = (Number(m[4] || 0) * 60 + Number(m[5] || 0) + Number(m[6] || 0) / 60) * 6e4;
	if (!Number.isSafeInteger(days) || !Number.isSafeInteger(ms) || days > 11e4 || ms > 11e4 * DAY) return error("持续时间超出限制");
	return {
		days,
		ms,
		sign: m[1] === "-" ? -1 : 1
	};
}
function parseRule(p, start) {
	const values = Object.create(null);
	for (const segment of p.value.toUpperCase().split(";")) {
		const pair = segment.split("=");
		if (pair.length !== 2 || !pair[1] || Object.hasOwn(values, pair[0])) return error("重复规则格式无效");
		values[pair[0]] = pair[1];
	}
	for (const key of Object.keys(values)) if (![
		"FREQ",
		"INTERVAL",
		"COUNT",
		"UNTIL",
		"BYDAY",
		"WKST"
	].includes(key)) return error(`不支持重复规则 ${key}`);
	if (![
		"DAILY",
		"WEEKLY",
		"MONTHLY",
		"YEARLY"
	].includes(values.FREQ)) return error(`不支持重复频率 ${values.FREQ || "缺失"}`);
	if (values.INTERVAL && !/^\d+$/.test(values.INTERVAL)) return error("重复间隔无效");
	const rule = {
		frequency: values.FREQ.toLowerCase(),
		interval: Number(values.INTERVAL || 1)
	};
	if (rule.interval < 1 || rule.interval > 1e3) return error("重复间隔超出 1–1000");
	if (values.COUNT) {
		if (!/^\d+$/.test(values.COUNT) || +values.COUNT < 1 || +values.COUNT > 1e4) return error("重复次数超出 1–10000");
		rule.count = +values.COUNT;
	}
	if (values.COUNT && values.UNTIL) return error("COUNT 和 UNTIL 不能同时使用");
	if (values.WKST && values.WKST !== "MO" && !(values.FREQ === "WEEKLY" && rule.interval === 1 && DAYS.includes(values.WKST))) return error("不支持此周起始日规则");
	if (values.BYDAY) {
		const days = values.BYDAY.split(",");
		if (rule.frequency !== "weekly" || days.some((d) => !DAYS.includes(d)) || new Set(days).size !== days.length) return error("仅支持每周重复中的普通星期（不支持第几个星期）");
		rule.weekdays = days.map((d) => DAYS.indexOf(d));
	}
	if (values.UNTIL) {
		if (start.allDay) {
			if (!/^\d{8}$/.test(values.UNTIL)) return error("全天重复的 UNTIL 必须为 DATE");
			rule.until = parseDate({
				name: "UNTIL",
				params: { VALUE: "DATE" },
				value: values.UNTIL
			}, start.timeZone).value;
		} else if (values.UNTIL.endsWith("Z")) {
			if (!/^\d{8}T\d{6}Z$/.test(values.UNTIL) || +values.UNTIL.slice(13, 15) > 59) return error("UNTIL 无效");
			const end = parseDate({
				name: "UNTIL",
				params: {},
				value: values.UNTIL.slice(0, 13) + "00Z"
			}, "UTC");
			rule.until = new Date((0, open_source_inkspace_desktop_src_renderer_calendar_model_ts.wallToMs)(end.value, "UTC") + Number(values.UNTIL.slice(13, 15)) * 1e3).toISOString();
		} else rule.until = parseDate({
			name: "UNTIL",
			params: {},
			value: values.UNTIL
		}, start.timeZone).value;
	}
	return rule;
}
function normalizedStart(value, event) {
	if (value.allDay !== event.allDay) return error("重复例外的日期类型与系列不同");
	return value.allDay ? value.value : (0, open_source_inkspace_desktop_src_renderer_calendar_model_ts.localWallInZone)((0, open_source_inkspace_desktop_src_renderer_calendar_model_ts.wallToMs)(value.value, value.timeZone), event.timeZone);
}
function assertEvent(event) {
	(0, open_source_inkspace_desktop_src_renderer_calendar_model_ts.validateCalendar)({
		schemaVersion: 1,
		kind: "winner-calendar",
		id: "ics-validation",
		calendars: [{
			id: event.calendarId,
			name: "ICS",
			color: "#3578e5",
			visible: true
		}],
		events: [event],
		updatedAt: (/* @__PURE__ */ new Date()).toISOString()
	});
}
function parseCalendarICS(text, calendarId) {
	const root = parseComponents(text), components = root.children.filter((c) => c.name === "VEVENT");
	if (components.length > 5e3) return error("ICS 超过 5000 个日程组件");
	const warnings = [], events = [], floatingZone = (0, open_source_inkspace_desktop_src_renderer_calendar_model_ts.systemTimeZone)();
	const detached = [];
	const failedMasters = /* @__PURE__ */ new Set(), failedSeries = /* @__PURE__ */ new Set();
	const methodCancelled = one(root, "METHOD")?.value.toUpperCase() === "CANCEL";
	const version = one(root, "VERSION");
	if (version && version.value !== "2.0") return error("仅支持 iCalendar 2.0");
	for (const c of components) {
		let name = "未命名日程", eventUid = "", hasRecurrenceId = false;
		const warningStart = warnings.length;
		try {
			name = unescapeText(one(c, "SUMMARY")?.value || name);
			eventUid = unescapeText(one(c, "UID")?.value || `${uid()}@winner.local`);
			const rid = one(c, "RECURRENCE-ID");
			hasRecurrenceId = !!rid;
			if (rid?.params.RANGE) return error("不支持 RECURRENCE-ID RANGE（整段系列改动）");
			if (methodCancelled || one(c, "STATUS")?.value.toUpperCase() === "CANCELLED") {
				if (rid) detached.push({
					uid: eventUid,
					start: parseDate(rid, floatingZone),
					cancelled: true
				});
				else warnings.push(`${name}：已取消的日程未导入`);
				continue;
			}
			if (all(c, "RDATE").length || all(c, "EXRULE").length) return error("不支持 RDATE / EXRULE；该日程已跳过");
			const start = parseDate(one(c, "DTSTART", true), floatingZone, warnings);
			const event = {
				...(0, open_source_inkspace_desktop_src_renderer_calendar_model_ts.newCalendarEvent)(calendarId, start.value.slice(0, 10), start.timeZone),
				uid: eventUid,
				title: name,
				start: start.value,
				allDay: start.allDay,
				timeZone: start.timeZone
			};
			const end = one(c, "DTEND"), span = one(c, "DURATION");
			if (end && span) return error("DTEND 和 DURATION 不能同时存在");
			if (end) {
				const parsed = parseDate(end, floatingZone);
				if (parsed.allDay !== event.allDay) return error("开始与结束日期类型不一致");
				event.end = parsed.allDay ? parsed.value : (0, open_source_inkspace_desktop_src_renderer_calendar_model_ts.localWallInZone)((0, open_source_inkspace_desktop_src_renderer_calendar_model_ts.wallToMs)(parsed.value, parsed.timeZone), event.timeZone);
			} else if (span) {
				const d = duration(span.value);
				if (d.sign < 0 || !d.days && !d.ms || event.allDay && d.ms) return error("持续时间必须为正数，全天日程必须为整天");
				const baseDate = (0, open_source_inkspace_desktop_src_renderer_calendar_model_ts.addDays)(start.value.slice(0, 10), d.days);
				event.end = event.allDay ? baseDate : (0, open_source_inkspace_desktop_src_renderer_calendar_model_ts.localWallInZone)((0, open_source_inkspace_desktop_src_renderer_calendar_model_ts.wallToMs)(baseDate + start.value.slice(10), event.timeZone) + d.ms, event.timeZone);
			} else {
				event.end = event.allDay ? (0, open_source_inkspace_desktop_src_renderer_calendar_model_ts.addDays)(event.start, 1) : (0, open_source_inkspace_desktop_src_renderer_calendar_model_ts.localWallInZone)((0, open_source_inkspace_desktop_src_renderer_calendar_model_ts.wallToMs)(event.start, event.timeZone) + 36e5, event.timeZone);
				if (!event.allDay) warnings.push(`${name}：未提供结束时间，按 1 小时导入`);
			}
			event.location = unescapeText(one(c, "LOCATION")?.value || "");
			event.notes = unescapeText(one(c, "DESCRIPTION")?.value || "");
			const url = unescapeText(one(c, "URL")?.value || "");
			if (url) try {
				if (/[\u0000-\u0020\u007f]/.test(url) || !["https:", "http:"].includes(new URL(url).protocol)) throw new Error();
				event.url = url;
			} catch {
				warnings.push(`${name}：忽略了非 http(s) 或无效网址`);
			}
			event.availability = one(c, "TRANSP")?.value.toUpperCase() === "TRANSPARENT" ? "free" : "busy";
			const repeat = one(c, "RRULE");
			if (repeat) event.repeat = parseRule(repeat, start);
			if (repeat && span && !event.allDay && duration(span.value).days) return error("暂不支持重复定时日程的按天 DURATION（无法保留跨夏令时的名义天数）");
			if (rid && repeat) return error("独立重复实例不能携带 RRULE");
			for (const excluded of all(c, "EXDATE")) for (const value of excluded.value.split(",")) event.excludedStarts.push(normalizedStart(parseDate({
				...excluded,
				value
			}, floatingZone), event));
			event.excludedStarts = [...new Set(event.excludedStarts)];
			for (const alarm of c.children.filter((a) => a.name === "VALARM")) try {
				if (one(alarm, "ACTION")?.value.toUpperCase() !== "DISPLAY" || one(alarm, "REPEAT") || one(alarm, "DURATION")) return error("仅导入一次性的屏幕提醒");
				const trigger = one(alarm, "TRIGGER", true);
				if (trigger.params.VALUE && trigger.params.VALUE !== "DURATION" || trigger.params.RELATED && trigger.params.RELATED !== "START") return error("仅支持相对于开始时间的提醒");
				const d = duration(trigger.value), minutes = (d.days * DAY + d.ms) / 6e4;
				if (minutes && d.sign > 0 || minutes > 525600) return error("提醒必须在开始前且不超过一年");
				event.reminders.push(minutes);
			} catch (e) {
				warnings.push(`${name}：提醒未导入（${e.message}）`);
			}
			event.reminders = [...new Set(event.reminders)].slice(0, 10);
			if (all(c, "ATTACH").length) warnings.push(`${name}：附件未导入，也未访问外部链接`);
			if (all(c, "ATTENDEE").length || all(c, "ORGANIZER").length || all(c, "SEQUENCE").length) warnings.push(`${name}：会议成员、组织者、版本和回复状态未导入；不会发送邀请、接受会议或回复组织者`);
			if (one(c, "STATUS")?.value.toUpperCase() === "TENTATIVE") warnings.push(`${name}：暂定状态未保留，已按忙闲状态导入`);
			assertEvent(event);
			if (rid) detached.push({
				event,
				uid: eventUid,
				start: parseDate(rid, floatingZone),
				cancelled: false
			});
			else events.push(event);
		} catch (e) {
			warnings.push(`${name}：${e.message}，已跳过`);
			if (eventUid && !hasRecurrenceId) failedMasters.add(eventUid);
			if (eventUid && hasRecurrenceId) failedSeries.add(eventUid);
		} finally {
			if (warnings.length > warningStart + 1) warnings.push(warnings.splice(warningStart).join("；"));
		}
	}
	const masters = /* @__PURE__ */ new Map();
	for (const event of events) if (masters.has(event.uid)) warnings.push(`${event.title}：ICS 中包含重复 UID，导入时需要去重`);
	else masters.set(event.uid, event);
	for (const instance of detached) {
		const master = masters.get(instance.uid);
		if (failedMasters.has(instance.uid) || failedSeries.has(instance.uid)) {
			warnings.push(`${instance.uid}：所属重复系列无法导入，已跳过例外`);
			continue;
		}
		if (!master) {
			if (instance.event) {
				instance.event.uid = standaloneUid(instance.event.uid, instance.start.value);
				events.push(instance.event);
				warnings.push(`${instance.event.title}：缺少所属重复系列，按独立日程导入`);
			} else warnings.push(`${instance.uid}：找不到已取消实例的重复系列`);
			continue;
		}
		try {
			const originalStart = normalizedStart(instance.start, master);
			if (instance.event) {
				if (instance.event.allDay !== master.allDay) return error("例外实例的全天类型与系列不同");
				const event = instance.event;
				if (!event.allDay) {
					event.start = (0, open_source_inkspace_desktop_src_renderer_calendar_model_ts.localWallInZone)((0, open_source_inkspace_desktop_src_renderer_calendar_model_ts.wallToMs)(event.start, event.timeZone), master.timeZone);
					event.end = (0, open_source_inkspace_desktop_src_renderer_calendar_model_ts.localWallInZone)((0, open_source_inkspace_desktop_src_renderer_calendar_model_ts.wallToMs)(event.end, event.timeZone), master.timeZone);
					event.timeZone = master.timeZone;
				}
				event.seriesId = master.id;
				event.originalStart = originalStart;
				assertEvent(event);
				events.push(event);
			}
			if (!master.excludedStarts.includes(originalStart)) master.excludedStarts.push(originalStart);
		} catch (e) {
			warnings.push(`${instance.uid}：重复例外未导入（${e.message}）`);
		}
	}
	for (const eventUid of failedSeries) warnings.push(`${eventUid}：系列包含无法支持的重复例外，整个系列已跳过`);
	const distinct = [...new Set(warnings)], limit = Math.max(1, Math.min(1e3, components.length));
	const bounded = distinct.length > limit ? [...distinct.slice(0, Math.max(0, limit - 1)), `兼容性提示较多，另有 ${distinct.length - limit + 1} 项未显示；请分批检查此文件。`] : distinct;
	return {
		events: events.filter((e) => !failedSeries.has(e.uid)),
		warnings: bounded
	};
}
function dateProperty(name, value, event) {
	if (event.allDay) return `${name};VALUE=DATE:${basicDate(value)}`;
	if (isUtc(event.timeZone)) return `${name}:${basicDate(value)}00Z`;
	return `${name};TZID=${event.timeZone}:${basicDate(value)}00`;
}
function fold(line) {
	const encoder = new TextEncoder();
	let current = "", size = 0;
	const lines = [];
	for (const char of line) {
		const bytes = encoder.encode(char).length;
		if (size + bytes > 75) {
			lines.push(current);
			current = " ";
			size = 1;
		}
		current += char;
		size += bytes;
	}
	lines.push(current);
	return lines.join("\r\n");
}
function exportRule(rule, event) {
	const values = [`FREQ=${rule.frequency.toUpperCase()}`, `INTERVAL=${rule.interval}`];
	if (rule.weekdays) values.push(`BYDAY=${rule.weekdays.map((d) => DAYS[d]).join(",")}`);
	if (rule.count) values.push(`COUNT=${rule.count}`);
	if (rule.until) {
		let until;
		if (event.allDay) until = basicDate(rule.until.slice(0, 10));
		else if (rule.until.endsWith("Z")) until = utcStamp(Date.parse(rule.until));
		else until = utcStamp((0, open_source_inkspace_desktop_src_renderer_calendar_model_ts.wallToMs)(rule.until.length === 10 ? rule.until + "T23:59" : rule.until, event.timeZone));
		values.push(`UNTIL=${until}`);
	}
	return "RRULE:" + values.join(";");
}
const zoneDefinitions = /* @__PURE__ */ new Map();
function timezoneDefinition(zone) {
	const cached = zoneDefinitions.get(zone);
	if (cached) return cached;
	const f = new Intl.DateTimeFormat("en-CA-u-ca-iso8601-nu-latn", {
		timeZone: zone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hourCycle: "h23"
	});
	const offsetAt = (ms) => {
		const p = {};
		for (const part of f.formatToParts(ms)) if (part.type !== "literal") p[part.type] = Number(part.value);
		return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - ms;
	};
	const offsetText = (ms) => {
		const seconds = Math.abs(ms / 1e3), hours = Math.floor(seconds / 3600), minutes = Math.floor(seconds % 3600 / 60), sec = seconds % 60;
		return `${ms < 0 ? "-" : "+"}${String(hours).padStart(2, "0")}${String(minutes).padStart(2, "0")}${sec ? String(sec).padStart(2, "0") : ""}`;
	};
	const begin = Date.UTC(1899, 0, 1), limit = Date.UTC(2201, 0, 1), initial = offsetAt(begin);
	const lines = [
		"BEGIN:VTIMEZONE",
		`TZID:${zone}`,
		`X-LIC-LOCATION:${zone}`,
		"BEGIN:STANDARD",
		"DTSTART:18990101T000000",
		`TZOFFSETFROM:${offsetText(initial)}`,
		`TZOFFSETTO:${offsetText(initial)}`,
		"END:STANDARD"
	];
	const groups = /* @__PURE__ */ new Map();
	let previousTime = begin, previousOffset = initial;
	for (let probe = begin + DAY; previousTime < limit; probe += DAY) {
		const nextTime = Math.min(probe, limit), nextOffset = offsetAt(nextTime);
		if (nextOffset !== previousOffset) {
			let low = previousTime, high = nextTime;
			while (high - low > 1e3) {
				const middle = Math.floor((low + high) / 2e3) * 1e3;
				if (offsetAt(middle) === previousOffset) low = middle;
				else high = middle;
			}
			const key = `${previousOffset}:${nextOffset}`, group = groups.get(key) || {
				from: previousOffset,
				to: nextOffset,
				dates: []
			};
			group.dates.push(utcStamp(high + previousOffset).replace(/Z$/, ""));
			groups.set(key, group);
		}
		previousTime = nextTime;
		previousOffset = nextOffset;
	}
	for (const group of groups.values()) {
		const name = group.to > group.from ? "DAYLIGHT" : "STANDARD";
		lines.push(`BEGIN:${name}`, `DTSTART:${group.dates[0]}`, `TZOFFSETFROM:${offsetText(group.from)}`, `TZOFFSETTO:${offsetText(group.to)}`);
		if (group.dates.length > 1) lines.push(`RDATE:${group.dates.slice(1).join(",")}`);
		lines.push(`END:${name}`);
	}
	lines.push("END:VTIMEZONE");
	if (zoneDefinitions.size >= 100) zoneDefinitions.clear();
	zoneDefinitions.set(zone, lines);
	return lines;
}
/** Export local TZID values, preserving wall-clock recurrence across daylight-saving changes. */
function exportCalendarICS(doc, calendarIds) {
	(0, open_source_inkspace_desktop_src_renderer_calendar_model_ts.validateCalendar)(doc);
	const chosen = calendarIds ? new Set(calendarIds) : void 0;
	const events = doc.events.filter((e) => !chosen || chosen.has(e.calendarId));
	const byId = new Map(events.map((e) => [e.id, e]));
	const lines = [
		"BEGIN:VCALENDAR",
		"VERSION:2.0",
		"PRODID:-//Winner//Calendar 45//ZH",
		"CALSCALE:GREGORIAN"
	];
	const zones = new Set(events.filter((e) => !e.allDay && !isUtc(e.timeZone)).map((e) => e.timeZone));
	if (zones.size > 100) return error("一次最多导出 100 个时区，请分日历导出");
	for (const zone of zones) lines.push(...timezoneDefinition(zone));
	for (const event of events) {
		const master = event.seriesId ? byId.get(event.seriesId) : void 0;
		const exportUid = master?.uid || (event.seriesId && event.originalStart ? standaloneUid(event.uid, event.originalStart) : event.uid);
		lines.push("BEGIN:VEVENT", `UID:${escapeText(exportUid)}`, `DTSTAMP:${utcStamp(Date.parse(event.updatedAt))}`, dateProperty("DTSTART", event.start, event), dateProperty("DTEND", event.end, event), `SUMMARY:${escapeText(event.title)}`);
		if (master && event.originalStart) lines.push(dateProperty("RECURRENCE-ID", event.originalStart, master));
		if (event.location) lines.push(`LOCATION:${escapeText(event.location)}`);
		if (event.notes) lines.push(`DESCRIPTION:${escapeText(event.notes)}`);
		if (event.url) lines.push(`URL:${event.url}`);
		lines.push(`TRANSP:${event.availability === "free" ? "TRANSPARENT" : "OPAQUE"}`);
		if (event.repeat && !master) lines.push(exportRule(event.repeat, event));
		const detached = new Set(events.filter((e) => e.seriesId === event.id).map((e) => e.originalStart));
		for (const excluded of event.excludedStarts) if (!detached.has(excluded)) lines.push(dateProperty("EXDATE", excluded, event));
		for (const minutes of event.reminders) lines.push("BEGIN:VALARM", "ACTION:DISPLAY", `TRIGGER:-PT${minutes}M`, `DESCRIPTION:${escapeText(event.title)}`, "END:VALARM");
		lines.push("END:VEVENT");
	}
	lines.push("END:VCALENDAR");
	const result = lines.map(fold).join("\r\n") + "\r\n";
	if (new TextEncoder().encode(result).length > MAX_BYTES) return error("导出的 ICS 超过 4 MiB，请分日历导出");
	return result;
}
//#endregion
exports.exportCalendarICS = exportCalendarICS;
exports.parseCalendarICS = parseCalendarICS;
