function getAjax(url, data, callback){
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            if(typeof callback === "function") {
                callback(this.responseText);
            }
        }
    };

    let queryParams = [];
    for (const [key, value] of Object.entries(data)) {
        queryParams.push(`${key}=${value}`);
    }

    if(queryParams.length > 0){
        url = `${url}?${queryParams.join("&")}`;
    }
    xhttp.open("GET", url, true);
    xhttp.setRequestHeader("Content-type", "application/json;charset=UTF-8");
    xhttp.send();
}

function postAjax(url, data, callback){
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            if(typeof callback === "function") {
                callback(this.responseText);
            }
        }
    };
    xhttp.open("POST", url, true);
    xhttp.setRequestHeader("Content-type", "application/json;charset=UTF-8");
    xhttp.send(JSON.stringify(data));
}