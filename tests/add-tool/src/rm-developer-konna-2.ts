function calcLuckyDraw2(t: number, b: number, normal: number, special: number) {
	const CNM = (() => {
		// 巴斯卡三角形
		let pascal = [[1], [1]];
		// 建立 n = 2 ~ t
		for (let n = 2; n <= t; ++n) {
			let tmp = [1];
			let len = (n + 2) >>> 1;
			// len = Math.min(b, len);
			for (let m = 1; m < len; ++m) {
				// C(n, m) = C(n - 1, m - 1) + C(n - 1, m)
				let prevArr = pascal[n - 1];
				tmp.push(
					pascal[n - 1][m - 1 < prevArr.length ? m - 1 : n - m] + pascal[n - 1][m < prevArr.length ? m : n - 1 - m],
				);
			}
			pascal.push(tmp);
		}

		// 查询巴斯卡三角形以获得 C(n, m)
		return function (n: number, m: number) {
			let len = (n + 2) >>> 1;
			m = m < len ? m : n - m;
			return pascal[n][m];
		};
	})();

	const data: Array<[string, number, number, number]> = [
		// 奖项, 中一般号个数, 中特别号个数, 中其他号码个数
		["10+3", 10, 3, b - 13],
		["10+2", 10, 2, b - 12],
		["10+1", 10, 1, b - 11],
		["10+0", 10, 0, b - 10],
		["9+3", 9, 3, b - 12],
		["9+2", 9, 2, b - 11],
		["9+1", 9, 1, b - 10],
		["9+0", 9, 0, b - 9],
		["8+3", 8, 3, b - 11],
		["8+2", 8, 2, b - 10],
		["8+1", 8, 1, b - 9],
		["8+0", 8, 0, b - 8],
		["7+3", 7, 3, b - 10],
		["7+2", 7, 2, b - 9],
		["7+1", 7, 1, b - 8],
		["7+0", 7, 0, b - 7],
		["6+3", 6, 3, b - 9],
		["6+2", 6, 2, b - 8],
		["6+1", 6, 1, b - 7],
		["6+0", 6, 0, b - 6],
		["5+3", 5, 3, b - 8],
		["5+2", 5, 2, b - 7],
		["5+1", 5, 1, b - 6],
		["5+0", 5, 0, b - 5],
		["4+3", 4, 3, b - 7],
		["4+2", 4, 2, b - 6],
		["4+1", 4, 1, b - 5],
		["4+0", 4, 0, b - 4],
		["3+3", 3, 3, b - 6],
		["3+2", 3, 2, b - 5],
		["3+1", 3, 1, b - 4],
		["3+0", 3, 0, b - 3],
		["2+3", 2, 3, b - 5],
		["2+2", 2, 2, b - 4],
		["2+1", 2, 1, b - 3],
		["2+0", 2, 0, b - 2],
		["1+3", 1, 3, b - 4],
		["1+2", 1, 2, b - 3],
		["1+1", 1, 1, b - 2],
		["1+0", 1, 0, b - 1],
		["0+3", 0, 3, b - 3],
		["0+2", 0, 2, b - 2],
		["0+1", 0, 1, b - 1],
		["0+0", 0, 0, b - 0],
	];

	data.forEach((arr) => {
		const result = CNM(normal, arr[1]) * CNM(special, arr[2]) * CNM(t - normal - special, arr[3]);
		if (!!result) console.log(`${arr[0]} 有 ${result} 個`);
	});
}

// console.log(calcLuckyDraw2(10, 4, 3, 1));
console.log(calcLuckyDraw2(36, 10, 6, 1));
