// 將 fCalculate 函數移到外部，並設為全局函數
function fCalculate() {
	console.log("calculate")
	let level = $("#before_level").val()
	let exp = $("#before_exp").val()

	let hyper = $("#hyper").is(":checked")
	let burning_type = $("input[name='burning_type']:checked").val()
	let burning_max_level = $("#burning_max_level").val()

	let coupon_type = $("input[name='coupon_type']:checked").val()
	let cal_type = $("input[name='cal_type']:checked").val()

	let target_level = $("input[name='target_level']").val()
	let coupon_count = $("input[name='coupon_count']").val()

	console.log(
		level,
		exp,
		hyper,
		burning_type,
		burning_max_level,
		coupon_type,
		cal_type,
		target_level,
		coupon_count
	)

	// 獲取輸入值
	let currentLevel = parseInt(level)
	let currentExp = parseFloat(exp) || 0
	let targetLevel = parseInt(target_level)

	// 檢查輸入值
	if (!currentLevel || !targetLevel || currentLevel >= targetLevel) {
		alert("請檢查等級輸入是否正確")
		return
	}

	if (cal_type === "level") {
		// 目標等級模式
		let totalExpNeeded = BigInt(0)
		let totalTicketsNeeded = 0

		// 1. 先減去當前等級已有的經驗值
		let currentLevelExpNeeded = BigInt(levelUpExp[currentLevel])
		let currentExpPercentage = BigInt(Math.floor(currentExp * 100))
		let remainingExpForCurrentLevel =
			(currentLevelExpNeeded * currentExpPercentage) / BigInt(10000)

		// 2. 逐級計算需要的經驗券數量
		let tempLevel = currentLevel
		let tempExp = remainingExpForCurrentLevel

		while (tempLevel < targetLevel) {
			let expNeededForThisLevel = BigInt(levelUpExp[tempLevel]) - tempExp
			let ticketExpForThisLevel = BigInt(0)

			// 計算經驗券效果
			if (coupon_type === "upper_exp") {
				if (tempLevel < 260) {
					alert("需要260等以上才能使用上級經驗券")
					return
				}
				ticketExpForThisLevel = BigInt(superExpPerTicket[tempLevel])
			} else {
				ticketExpForThisLevel = BigInt(expPerTicket[tempLevel])
			}

			// 計算燃燒效果
			let burningMultiplier = BigInt(1)
			if (hyper && tempLevel <= parseInt(burning_max_level)) {
				if (burning_type === "1_2") {
					burningMultiplier = BigInt(3)
				} else if (burning_type === "1_4") {
					burningMultiplier = BigInt(5)
				}
			}

			// 計算這一級需要的經驗券數量
			let ticketsForThisLevel = Math.ceil(
				Number(expNeededForThisLevel) /
					Number(ticketExpForThisLevel * burningMultiplier)
			)
			console.log({ ticketExpForThisLevel })

			totalTicketsNeeded += ticketsForThisLevel
			totalExpNeeded += ticketExpForThisLevel * BigInt(ticketsForThisLevel)
			// totalExpNeeded += expNeededForThisLevel

			tempLevel++
			tempExp = BigInt(0)
		}

		// 更新結果
		$("#result_coupon").text(totalTicketsNeeded.toLocaleString())
		$("#gain_exp").text(totalExpNeeded.toLocaleString())
		$("#gain_exp_per").text(
			(
				(Number(totalExpNeeded) * 100) /
				Number(BigInt(levelUpExp[currentLevel]))
			).toFixed(4)
		)
		$(".result_level").text(targetLevel)
		// $("#result_exp_per").text("0")

		// 計算成長藥水效率
		calculateElixirEfficiency(currentLevel)
	} else {
		// 優惠券數量模式
		let ticketCount = parseInt(coupon_count)
		if (!ticketCount || ticketCount <= 0) {
			alert("請輸入正確的優惠券數量")
			return
		}

		let totalExp = BigInt(0)
		let tempLevel = currentLevel
		let tempExpPercentage = BigInt(Math.floor(currentExp * 100))
		let remainingTickets = ticketCount

		// 逐張使用優惠券
		while (remainingTickets > 0 && tempLevel < 300) {
			let ticketExpForThisLevel = BigInt(0)

			// 計算經驗券效果
			if (coupon_type === "upper_exp") {
				if (tempLevel < 260) {
					alert("需要260等以上才能使用上級經驗券")
					return
				}
				ticketExpForThisLevel = BigInt(superExpPerTicket[tempLevel])
			} else {
				ticketExpForThisLevel = BigInt(expPerTicket[tempLevel])
			}

			// 計算燃燒效果
			let burningMultiplier = BigInt(1)
			if (hyper && tempLevel <= parseInt(burning_max_level)) {
				if (burning_type === "1_2") {
					burningMultiplier = BigInt(3)
				} else if (burning_type === "1_4") {
					burningMultiplier = BigInt(5)
				}
			}

			// 計算這張券獲得的經驗值
			let expGainedFromTicket = ticketExpForThisLevel * burningMultiplier
			totalExp += expGainedFromTicket

			// 計算當前等級的總經驗值需求
			let currentLevelExpNeeded = BigInt(levelUpExp[tempLevel])
			let currentLevelExp =
				(currentLevelExpNeeded * tempExpPercentage) / BigInt(10000)

			// 檢查是否升級
			if (currentLevelExp + expGainedFromTicket >= currentLevelExpNeeded) {
				// 升級了
				let remainingExp =
					currentLevelExp + expGainedFromTicket - currentLevelExpNeeded
				tempLevel++
				if (tempLevel < 300) {
					// 計算新等級的經驗值百分比
					let nextLevelExpNeeded = BigInt(levelUpExp[tempLevel])
					tempExpPercentage =
						(remainingExp * BigInt(10000)) / nextLevelExpNeeded
				} else {
					tempExpPercentage = 100
				}
			} else {
				// 沒升級，更新經驗值百分比
				tempExpPercentage =
					((currentLevelExp + expGainedFromTicket) * BigInt(10000)) /
					currentLevelExpNeeded
			}

			remainingTickets--
		}

		// 更新結果
		$("#result_coupon").text(ticketCount.toLocaleString())
		$("#gain_exp").text(totalExp.toLocaleString())
		$("#gain_exp_per").text(
			(
				(Number(totalExp) * 100) /
				Number(BigInt(levelUpExp[currentLevel]))
			).toFixed(4)
		)
		$(".result_level").text(tempLevel)
		$("#result_exp_per").text((Number(tempExpPercentage) / 100).toFixed(4))

		// 計算成長藥水效率
		calculateElixirEfficiency(currentLevel)

		// 顯示升級提示
		if (currentLevel < tempLevel) {
			$("#result_level_up").show()
			$("#result_before_level").text(currentLevel)
		} else {
			$("#result_level_up").hide()
		}
	}
}

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

$(document).ready(function () {
	// 監聽超級燃燒開關的變化
	$("#hyper").change(function () {
		if ($(this).is(":checked")) {
			console.log("checked")
			$("#burning-level").show()
			$("#burning-add-level").show()
		} else {
			$("#burning-level").hide()
			$("#burning-add-level").hide()
		}
	})

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

// 計算燃燒效果倍率
function calculateBurningMultiplier(
	hyper,
	level,
	burningMaxLevel,
	burningType
) {
	let burningMultiplier = BigInt(1)
	if (hyper && level <= parseInt(burningMaxLevel)) {
		if (burningType === "1_2") {
			burningMultiplier = BigInt(3)
		} else if (burningType === "1_4") {
			burningMultiplier = BigInt(5)
		}
	}
	return burningMultiplier
}

// 計算經驗券效果
function calculateTicketExp(level, couponType) {
	if (couponType === "upper_exp") {
		if (!validateUpperExpLevel(level)) return null
		return BigInt(superExpPerTicket[level])
	}
	return BigInt(expPerTicket[level])
}

// 計算目標等級模式
function calculateByTargetLevel(params) {
	const {
		currentLevel,
		currentExp,
		targetLevel,
		couponType,
		hyper,
		burningType,
		burningMaxLevel,
	} = params

	let totalExpNeeded = BigInt(0)
	let totalTicketsNeeded = 0

	// 計算當前等級剩餘經驗值
	let currentLevelExpNeeded = BigInt(levelUpExp[currentLevel])
	let currentExpPercentage = BigInt(Math.floor(currentExp * 100))
	let tempExp = (currentLevelExpNeeded * currentExpPercentage) / BigInt(10000)

	// 逐級計算
	let tempLevel = currentLevel
	while (tempLevel < targetLevel) {
		let expNeededForThisLevel = BigInt(levelUpExp[tempLevel]) - tempExp

		// 計算經驗券效果
		let ticketExpForThisLevel = calculateTicketExp(tempLevel, couponType)
		if (ticketExpForThisLevel === null) return null

		// 計算燃燒效果
		let burningMultiplier = calculateBurningMultiplier(
			hyper,
			tempLevel,
			burningMaxLevel,
			burningType
		)

		// 計算這一級需要的經驗券數量
		let ticketsForThisLevel = Math.ceil(
			Number(expNeededForThisLevel) /
				Number(ticketExpForThisLevel * burningMultiplier)
		)

		totalTicketsNeeded += ticketsForThisLevel
		// totalExpNeeded += expNeededForThisLevel
		totalExpNeeded += ticketExpForThisLevel * BigInt(ticketsForThisLevel)

		tempLevel++
		tempExp = totalExpNeeded - BigInt(levelUpExp[tempLevel])
		// tempExp = BigInt(0)
	}

	return { totalTicketsNeeded, totalExpNeeded, finalLevel: targetLevel }
}

// 計算優惠券數量模式
function calculateByCouponCount(params) {
	const {
		currentLevel,
		currentExp,
		ticketCount,
		couponType,
		hyper,
		burningType,
		burningMaxLevel,
	} = params

	let totalExp = BigInt(0)
	let tempLevel = currentLevel
	let tempExpPercentage = BigInt(Math.floor(currentExp * 100))
	let remainingTickets = ticketCount

	// 逐張使用優惠券
	while (remainingTickets > 0 && tempLevel < 300) {
		// 計算經驗券效果
		let ticketExpForThisLevel = calculateTicketExp(tempLevel, couponType)
		if (ticketExpForThisLevel === null) return null

		// 計算燃燒效果
		let burningMultiplier = calculateBurningMultiplier(
			hyper,
			tempLevel,
			burningMaxLevel,
			burningType
		)

		// 計算獲得的經驗值
		let expGainedFromTicket = ticketExpForThisLevel * burningMultiplier
		totalExp += expGainedFromTicket

		// 計算等級提升
		let currentLevelExpNeeded = BigInt(levelUpExp[tempLevel])
		let currentLevelExp =
			(currentLevelExpNeeded * tempExpPercentage) / BigInt(10000)

		if (currentLevelExp + expGainedFromTicket >= currentLevelExpNeeded) {
			let remainingExp =
				currentLevelExp + expGainedFromTicket - currentLevelExpNeeded
			tempLevel++
			if (tempLevel < 300) {
				let nextLevelExpNeeded = BigInt(levelUpExp[tempLevel])
				tempExpPercentage = (remainingExp * BigInt(10000)) / nextLevelExpNeeded
			}
		} else {
			tempExpPercentage =
				((currentLevelExp + expGainedFromTicket) * BigInt(10000)) /
				currentLevelExpNeeded
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
		const finalExp =
			result.totalExpNeeded % BigInt(levelUpExp[result.finalLevel - 1])
		const finalLevelExpNeeded = BigInt(levelUpExp[result.finalLevel])
		console.log({ finalExp })
		console.log({ finalLevelExpNeeded })
		$("#result_exp_per").text(
			((Number(finalExp) * 100) / Number(finalLevelExpNeeded)).toFixed(4)
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
			(Number(result.finalExpPercentage) / 100).toFixed(4)
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
		hyper: $("#hyper").is(":checked"),
		burningType: $("input[name='burning_type']:checked").val(),
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
