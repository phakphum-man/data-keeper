String.prototype.cleanAll = function () {
    return this.trim().removeNewLine().cleanSpace();
};

String.prototype.removeNewLine = function () {
    return this.replace(/[\r\n]/gm, '');
};

String.prototype.cleanSpace = function () {
    return this.replace(/\s\s+/g, ' ');
};