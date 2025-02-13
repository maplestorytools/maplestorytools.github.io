// 計算成長藥水效率
function calculateElixirEfficiency(level) {
	const elixirRanges = {
		e209: [200, 209],
		e219: [210, 219],
		e229: [220, 229],
		e239: [230, 239],
		e249: [240, 249],
		e269: [250, 269],
	}

	for (let [id, range] of Object.entries(elixirRanges)) {
		if (level >= range[0] && level <= range[1]) {
			$(`#${id}`).text("推薦").addClass("text_green")
		} else {
			$(`#${id}`).text("不推薦").addClass("text_yellow")
		}
	}
}

// 檢查輸入值
function validateInput(currentLevel, targetLevel) {
	if (!currentLevel || !targetLevel || currentLevel >= targetLevel) {
		alert("請檢查等級輸入是否正確")
		return false
	}
	return true
}

// 檢查上級經驗券等級要求
function validateUpperExpLevel(level) {
	if (level < 260) {
		alert("需要260等以上才能使用上級經驗券")
		return false
	}
	return true
}

// 計算經驗券效果
function calculateTicketExp(level, couponType) {
	if (couponType === "upper_exp") {
		if (level < 260) {
			alert("需要260等以上才能使用上級經驗券")
			return null
		}
		return BigInt(superExpPerTicket[level])
	}
	return BigInt(expPerTicket[level])
}

// 計算當前等級的剩餘經驗值
function calculateRemainingExp(currentLevel, currentExp) {
	const currentLevelExpNeeded = BigInt(levelUpExp[currentLevel])
	const currentExpPercentage = BigInt(Math.floor(currentExp * 100))
	return (currentLevelExpNeeded * currentExpPercentage) / BigInt(10000)
}

// 計算單一等級需要的經驗券數量
function calculateTicketsForLevel(expNeeded, ticketExp) {
	return Math.ceil(Number(expNeeded) / Number(ticketExp))
}

// 計算目標等級模式
function calculateByTargetLevel(params) {
	const {
		currentLevel,
		currentExp,
		targetLevel,
		couponType,
		burningType,
		burningMaxLevel,
	} = params

	let totalExpNeeded = BigInt(0)
	let totalTicketsNeeded = 0
	let tempLevel = currentLevel

	// 計算初始剩餘經驗值
	let tempExp = calculateRemainingExp(currentLevel, currentExp)

	// 逐級計算
	while (tempLevel < targetLevel) {
		console.log("--------------------------------")
		// 計算這一級需要的經驗值
		const expNeededForThisLevel = BigInt(levelUpExp[tempLevel]) - tempExp

		// 計算經驗券效果
		const ticketExpForThisLevel = calculateTicketExp(tempLevel, couponType)
		if (ticketExpForThisLevel === null) return null
		console.log({ ticketExpForThisLevel })
		console.log({ expNeededForThisLevel })

		// 計算這一級需要的經驗券數量
		const ticketsForThisLevel = calculateTicketsForLevel(
			expNeededForThisLevel,
			ticketExpForThisLevel
		)

		// 更新總計
		totalTicketsNeeded += ticketsForThisLevel
		const expGainedThisLevel =
			ticketExpForThisLevel * BigInt(ticketsForThisLevel)
		totalExpNeeded += expGainedThisLevel

		// 準備下一級的計算
		tempExp = tempExp + expGainedThisLevel - BigInt(levelUpExp[tempLevel])

		// 計算燃燒效果
		if (tempLevel <= parseInt(burningMaxLevel)) {
			switch (burningType) {
				case "1":
					tempLevel += 3
					break // 1+2
				case "2":
					tempLevel += 5
					break // 1+4
				default:
					tempLevel++ // 無燃燒
			}
		} else {
			tempLevel++
		}
		console.log({ tempLevel })
	}

	return {
		totalTicketsNeeded,
		totalExpNeeded,
		tempExp,
		finalLevel: tempLevel,
	}
}

// 計算優惠券數量模式
function calculateByCouponCount(params) {
	const {
		currentLevel,
		currentExp,
		ticketCount,
		couponType,
		burningType,
		burningMaxLevel,
	} = params

	let totalExp = BigInt(0)
	let tempLevel = currentLevel
	let tempExpPercentage = BigInt(Math.floor(currentExp * 100))
	let remainingTickets = ticketCount
	let tempExp =
		(BigInt(levelUpExp[tempLevel]) * tempExpPercentage) / BigInt(10000)

	// 逐張使用優惠券
	while (remainingTickets > 0 && tempLevel < 300) {
		// console.log("--------------------------------")
		// 計算經驗券效果
		let ticketExpForThisLevel = calculateTicketExp(tempLevel, couponType)
		if (ticketExpForThisLevel === null) return null

		// 計算獲得的經驗值
		totalExp += ticketExpForThisLevel

		// 計算等級提升
		currentLevelExpNeeded = BigInt(levelUpExp[tempLevel])
		tempExp += ticketExpForThisLevel

		if (tempExp >= currentLevelExpNeeded) {
			let remainingExp = tempExp - currentLevelExpNeeded
			if (tempLevel <= parseInt(burningMaxLevel)) {
				if (burningType === 1) {
					tempLevel += 2
				} else if (burningType === 2) {
					tempLevel += 4
				} else {
					tempLevel++
				}
			} else {
				tempLevel++
			}

			if (tempLevel < 300) {
				let nextLevelExpNeeded = BigInt(levelUpExp[tempLevel])
				tempExpPercentage = (remainingExp * BigInt(10000)) / nextLevelExpNeeded
				tempExp = remainingExp
			}
		} else {
			tempExpPercentage = (tempExp * BigInt(10000)) / currentLevelExpNeeded
		}
		remainingTickets--
	}

	return {
		totalExp,
		finalLevel: tempLevel,
		finalExpPercentage: tempExpPercentage,
	}
}

// 更新結果顯示
function updateResults(result, params) {
	const { currentLevel } = params

	if (!result) return

	if ("totalTicketsNeeded" in result) {
		// 目標等級模式結果
		$("#result_coupon").text(result.totalTicketsNeeded.toLocaleString())
		$("#gain_exp").text(result.totalExpNeeded.toLocaleString())
		$("#gain_exp_per").text(
			(
				(Number(result.totalExpNeeded) * 100) /
				Number(BigInt(levelUpExp[currentLevel]))
			).toFixed(4)
		)
		$(".result_level").text(result.finalLevel)

		// 計算最終經驗值百分比
		const finalExp = result.tempExp
		const finalLevelExpNeeded = BigInt(levelUpExp[result.finalLevel])
		console.log({ finalExp })
		console.log({ finalLevelExpNeeded })
		$("#result_exp_per").text(
			((Number(finalExp) * 100) / Number(finalLevelExpNeeded)).toFixed(3)
		)
	} else {
		// 優惠券數量模式結果
		$("#result_coupon").text(params.ticketCount.toLocaleString())
		$("#gain_exp").text(result.totalExp.toLocaleString())
		$("#gain_exp_per").text(
			(
				(Number(result.totalExp) * 100) /
				Number(BigInt(levelUpExp[currentLevel]))
			).toFixed(4)
		)
		$(".result_level").text(result.finalLevel)
		$("#result_exp_per").text(
			(Number(result.finalExpPercentage) / 100).toFixed(3)
		)
	}

	// 顯示升級提示
	if (currentLevel < result.finalLevel) {
		$("#result_level_up").show()
		$("#result_before_level").text(currentLevel)
	} else {
		$("#result_level_up").hide()
	}

	// 計算成長藥水效率
	calculateElixirEfficiency(currentLevel)
}

// 主要計算函數
function fCalculate() {
	// 獲取輸入值
	const params = {
		currentLevel: parseInt($("#before_level").val()),
		currentExp: parseFloat($("#before_exp").val()) || 0,
		targetLevel: parseInt($("input[name='target_level']").val()),
		ticketCount: parseInt($("input[name='coupon_count']").val()),
		burningType: $("#burning_max_type").val(),
		burningMaxLevel: $("#burning_max_level").val(),
		couponType: $("input[name='coupon_type']:checked").val(),
		calType: $("input[name='cal_type']:checked").val(),
	}

	// 驗證基本輸入
	if (params.calType === "level") {
		if (!validateInput(params.currentLevel, params.targetLevel)) return
		const result = calculateByTargetLevel(params)
		updateResults(result, params)
	} else {
		if (!params.ticketCount || params.ticketCount <= 0) {
			alert("請輸入正確的優惠券數量")
			return
		}
		const result = calculateByCouponCount(params)
		updateResults(result, params)
	}
}

$(document).ready(function () {
	// 監聽計算類型選項的變化
	$('input[name="cal_type"]').change(function () {
		if ($(this).val() === "level") {
			$("#tr_level").show()
			$("#tr_coupon").hide()
		} else if ($(this).val() === "coupon") {
			$("#tr_level").hide()
			$("#tr_coupon").show()
		}
	})
})
