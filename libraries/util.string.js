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