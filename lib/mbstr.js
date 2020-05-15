/**
 * Functions supported multibyte string
 */
// https://qiita.com/ka215/items/d059a78e29adef3978b5
$.isSurrogatePear = function(upper, lower) {
	return 0xd800 <= upper && upper <= 0xdbff && 0xdc00 <= lower && lower <= 0xdfff;
};
$.mb_strlen = function(str) {
	var ret = 0;
	for (var i = 0; i < str.length; i++, ret++) {
		var upper = str.charCodeAt(i);
		var lower = str.length > i + 1 ? str.charCodeAt(i + 1) : 0;
		if ($.isSurrogatePear(upper, lower)) {
			i++;
		}
	}
	return ret;
};
$.mb_substr = function(str, begin, end) {
	var ret = '';
	for (var i = 0, len = 0; i < str.length; i++, len++) {
		var upper = str.charCodeAt(i);
		var lower = str.length > i + 1 ? str.charCodeAt(i + 1) : 0;
		var s = '';
		if ($.isSurrogatePear(upper, lower)) {
			i++;
			s = String.fromCharCode(upper, lower);
		} else {
			s = String.fromCharCode(upper);
		}
		if (begin <= len && len < end) {
			ret += s;
		}
	}
	return ret;
};
