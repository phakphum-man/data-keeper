let tabs = document.querySelectorAll(".tabs h3");
let tabContents = document.querySelectorAll(".tab-content div");

tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => {
    tabContents.forEach((content) => {
      content.classList.remove("active");
    });
    tabs.forEach((tab) => {
      tab.classList.remove("active");
    });
    tabContents[index].classList.add("active");
    tabs[index].classList.add("active");
  });
});

function getFileIdFromLinkGdrive(data) {
    let fileId = "File ID";
    if(data.indexOf("/document/d/") > -1) {
        const s = data.slice(0, data.indexOf("/document/d/"));
        fileId = data.replace(`${s}/document/d/`, "");
        return fileId.slice(0, fileId.indexOf("/"));

    } else if(data.indexOf("/spreadsheets/d/") > -1){
        const s = data.slice(0, data.indexOf("/spreadsheets/d/"));
        fileId = data.replace(`${s}/spreadsheets/d/`, "");
        return fileId.slice(0, fileId.indexOf("/"));

    } else if(data.indexOf("/file/d/") > -1){
        const s = data.slice(0, data.indexOf("/file/d/"));
        fileId = data.replace(`${s}/file/d/`, "");
        return fileId.slice(0, fileId.indexOf("/"));
    }
    return fileId;
}

function formValidate(select){
    const fileName = document.getElementById(`${select}-file-type`);
    const fileTemplate = document.getElementById(`${select}-file-template-fid`);
    const fileData = document.getElementById(`${select}-file-data-fid`);
    if(fileName.value === ""){
        fileName.style.borderColor = 'red';
        return false;
    } else if(fileTemplate.innerText === "File ID") {
        fileName.style.borderColor = 'black';
        return false;
    } else if(fileData.innerText === "File ID") {
        fileName.style.borderColor = 'black';
        return false;
    }else{
        fileName.style.borderColor = 'black';
        return true;
    }

}

const pdfFileTemplate = document.getElementById("pdf-file-template");
const pdfFileData = document.getElementById("pdf-file-data");
const xlsxFileTemplate = document.getElementById("xlsx-file-template");
const xlsxFileData = document.getElementById("xlsx-file-data");
const docxFileTemplate = document.getElementById("docx-file-template");
const docxFileData = document.getElementById("docx-file-data");

function setEmtyValue(select) {
    const fileName = document.getElementById(`${select}-file-type`);
    const fileTemplate = document.getElementById(`${select}-file-template-fid`);
    const fileData = document.getElementById(`${select}-file-data-fid`);
    fileName.value = '';
    fileTemplate.innerText = 'File ID';
    fileData.innerText = 'File ID';
}

function formReset(){
    setEmtyValue("pdf");
    pdfFileTemplate.value = '';
    pdfFileData.value = '';

    setEmtyValue("xlsx");
    xlsxFileTemplate.value  = '';
    xlsxFileData.value = '';

    setEmtyValue("docx");
    docxFileTemplate.value = '';
    docxFileData.value = '';
}
// PDF file
pdfFileTemplate.addEventListener("input", () => {
    const spanFileId = document.getElementById(`${pdfFileTemplate.id}-fid`);
    spanFileId.innerText = getFileIdFromLinkGdrive(pdfFileTemplate.value);
    if(spanFileId.innerText !== "File ID"){
        spanFileId.style.color = 'green';
    } else {
        spanFileId.style.color = 'red';
    }
});
pdfFileData.addEventListener("input", () => {
    const spanFileId = document.getElementById(`${pdfFileData.id}-fid`);
    spanFileId.innerText = getFileIdFromLinkGdrive(pdfFileData.value);
    if(spanFileId.innerText !== "File ID"){
        spanFileId.style.color = 'green';
    } else {
        spanFileId.style.color = 'red';
    }
});

// Excel file
xlsxFileTemplate.addEventListener("input", () => {
    const spanFileId = document.getElementById(`${xlsxFileTemplate.id}-fid`);
    spanFileId.innerText = getFileIdFromLinkGdrive(xlsxFileTemplate.value);
    if(spanFileId.innerText !== "File ID"){
        spanFileId.style.color = 'green';
    } else {
        spanFileId.style.color = 'red';
    }
});
xlsxFileData.addEventListener("input", () => {
    const spanFileId = document.getElementById(`${xlsxFileData.id}-fid`);
    spanFileId.innerText = getFileIdFromLinkGdrive(xlsxFileData.value);
    if(spanFileId.innerText !== "File ID"){
        spanFileId.style.color = 'green';
    } else {
        spanFileId.style.color = 'red';
    }
});

// Word file
docxFileTemplate.addEventListener("input", () => {
    const spanFileId = document.getElementById(`${docxFileTemplate.id}-fid`);
    spanFileId.innerText = getFileIdFromLinkGdrive(docxFileTemplate.value);
    if(spanFileId.innerText !== "File ID"){
        spanFileId.style.color = 'green';
    } else {
        spanFileId.style.color = 'red';
    }
});
docxFileData.addEventListener("input", () => {
    const spanFileId = document.getElementById(`${docxFileData.id}-fid`);
    spanFileId.innerText = getFileIdFromLinkGdrive(docxFileData.value);
    if(spanFileId.innerText !== "File ID"){
        spanFileId.style.color = 'green';
    } else {
        spanFileId.style.color = 'red';
    }
});

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

const pdfRun = document.getElementById("pdf-run");
const xlsxRun = document.getElementById("xlsx-run");
const docxRun = document.getElementById("docx-run");

pdfRun.addEventListener("click", () => {
    if(formValidate("pdf")){
        const data = {
            report_type : document.getElementById("pdf-file-type").value,
            file_id_data : document.getElementById("pdf-file-data-fid").innerText,
            file_id_template : document.getElementById("pdf-file-template-fid").innerText,
            input_extension : 'csv',
        };
        
        postAjax("gdrive-pdf", data, (dataText) => {
            Swal.fire({
                position: "top-end",
                icon: "success",
                title: "Your work has been saved",
                html: dataText
            });
            //console.log(dataText);
        });

        formReset();
    } else {
        alert("Please enter a value");
    }
});
xlsxRun.addEventListener("click", () => {
    if(formValidate("xlsx")){
        const data = {
            report_type : document.getElementById("xlsx-file-type").value,
            file_id_data : document.getElementById("xlsx-file-data-fid").innerText,
            file_id_template : document.getElementById("xlsx-file-template-fid").innerText,
            input_extension : document.getElementById("xlsx-file-data-extension").value,
        };
        postAjax("gdrive-xlsx", data, (dataText) => {
            Swal.fire({
                position: "top-end",
                icon: "success",
                title: "Your work has been saved",
                html: dataText
            });
            //console.log(dataText);
        });
        formReset();
    } else {
        alert("Please enter a value");
    }
});
docxRun.addEventListener("click", () => {
    if(formValidate("docx")){
        const data = {
            report_type : document.getElementById("docx-file-type").value,
            file_id_data : document.getElementById("docx-file-data-fid").innerText,
            file_id_template : document.getElementById("docx-file-template-fid").innerText,
            input_extension : document.getElementById("docx-file-data-extension").value,
        };
        postAjax("gdrive-docx", data, (dataText) => {
            Swal.fire({
                position: "top-end",
                icon: "success",
                title: "Your work has been saved",
                html: dataText
            });
            //console.log(dataText);
        });
        formReset();
    } else {
        alert("Please enter a value");
    }
});