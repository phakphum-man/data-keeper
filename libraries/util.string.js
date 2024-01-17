String.prototype.cleanAll = function () {
    return this.trim().removeNewLine().cleanSpace();
};

String.prototype.removeNewLine = function () {
    return this.replace(/[\r\n]/gm, '');
};

String.prototype.cleanSpace = function () {
    return this.replace(/\s\s+/g, ' ');
};

String.prototype.replaceArray = function(find, replace) {
    let replaceString = this;
    let regex; 
    for (let i = 0; i < find.length; i++) {
        regex = new RegExp(find[i], "g");
        replaceString = replaceString.replace(regex, replace[i]);
    }
    return replaceString;
};

String.prototype.formatCommas = function() {
    let x = this;
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

String.prototype.toUnicode = function() {
    let str = this;
	return str.split('').map(function (value, index, array) {
		var temp = value.charCodeAt(0).toString(16).toUpperCase();
		if (temp.length > 2) {
			return '\\u' + temp;
		}
		return value;
	}).join('');
}

String.prototype.cleanText = function() {
    let str = this;
	return str.replace(/(\t|\n)/g,"").trim();
}

String.prototype.getDomain = function() {
    let str = this;
	return str.replace(/(http\:\/\/|https\:\/\/|\/)/g,"");
}

String.prototype.removeProtocolUrl = function() {
    let str = this;
	return str.replace(/(http\:\/\/|https\:\/\/)/g,"");
}

String.prototype.isNumber = function() {
    let str = this;
    return isFinite(str) && !isNaN(parseFloat(str));
}

String.prototype.getOnlyNumber = function() {
    let str = this;
	const matches = str.match(/(\d+)/);
    if (matches && matches.length > 0) {
        return matches[0];
    }
    return null;
}

String.prototype.getOnlyFloatNumber = function() {
    let str = this;
	const matches = str.match(/(\d+\.\d+|\d+)/);
    if (matches && matches.length > 0) {
        return matches[0];
    }
    return null;
}