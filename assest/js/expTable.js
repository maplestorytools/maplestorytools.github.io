$(document).ready(function () {
	const tbody = $("tbody")
	tbody.empty()

	// 遍歷等級 200-299
	for (let level = 200; level <= 299; level++) {
		const tr = $("<tr>")

		// 特殊等級添加顏色標示
		if (level === 210) {
			tr.addClass("text_cyan")
		} else if (level === 260) {
			tr.addClass("text_purple")
		}

		// 等級
		tr.append($("<td>").text(level))

		// 升級所需經驗值
		tr.append($("<td>").text(levelUpExp[level].toLocaleString()))

		// 經驗券獲得經驗值
		tr.append($("<td>").text(expPerTicket[level].toLocaleString()))

		// 上級經驗券獲得經驗值
		if (level >= 260) {
			tr.append($("<td>").text(superExpPerTicket[level].toLocaleString()))
		} else {
			tr.append($("<td>").text("-"))
		}

		tbody.append(tr)
	}
})
