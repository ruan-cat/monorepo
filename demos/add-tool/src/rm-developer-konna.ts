function generateCombinations(n, m) {
	const arr = Array.from({ length: n }, (_, i) => i + 1);
	let result = [];
	function combine(start, comb) {
		if (comb.length === m) {
			result.push(comb.slice());
			return;
		}
		for (let i = start; i < arr.length; i++) {
			comb.push(arr[i]);
			combine(i + 1, comb);
			comb.pop();
		}
	}
	combine(0, []);
	return result;
}

function arrayMatch(arr1, arr2) {
	let count = 0;
	let seen = {};
	for (let i = 0; i < arr1.length; i++) {
		seen[arr1[i]] = true;
	}
	for (let j = 0; j < arr2.length; j++) {
		if (seen[arr2[j]]) {
			count++;
		}
	}
	return count;
}

function convertToFraction(decimal) {
	const numDecimals = decimal.toFixed(10).split(".")[1].length;
	const denominator = Math.pow(10, numDecimals);
	const numerator = Math.round(decimal * denominator);
	let gcd = function (a, b) {
		return b ? gcd(b, a % b) : a;
	};
	const divisor = gcd(numerator, denominator);
	return `1 / ${denominator / numerator}`;
}

function luckydrawcalc(num, bet, normal, special) {
	const n = Array.from({ length: normal }, (_, i) => i + 1);
	const s = Array.from({ length: special }, (_, i) => num - i);
	const arr = generateCombinations(num, bet);
	const arrLength = arr.length;
	const r = [n, s];
	let pr = [0, 0, 0, 0, 0, 0, 0];
	for (let i = 0; i < arr.length; i++) {
		switch (arrayMatch(arr[i], r[0])) {
			case 6:
				pr[0]++;
				break;
			case 5:
				arrayMatch(arr[i], r[1]) === 1 ? pr[1]++ : pr[2]++;
				break;
			case 4:
				arrayMatch(arr[i], r[1]) === 1 ? pr[3]++ : pr[4]++;
				break;
			case 3:
				arrayMatch(arr[i], r[1]) === 1 ? pr[5]++ : pr[6]++;
				break;
			default:
				break;
		}
	}
	console.log(pr);
	for (let i = 0; i < pr.length; i++) {
		console.log(convertToFraction(pr[i] / arrLength));
	}
}

luckydrawcalc(36, 10, 6, 1);
