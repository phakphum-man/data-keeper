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

if(!alertify.errorAlert){
    //define a new errorAlert base on alert
    alertify.dialog('errorAlert',function factory(){
        return{
            build:function(){
                var errorHeader = '<i class="fa fa-times-circle fa-2x" '
                +    'style="vertical-align:middle;color:#e10000;">'
                + '</i> Validate Error';
                this.setHeader(errorHeader);
            }
        };
    },true,'alert');
}

const pdfFileTemplate = document.getElementById("pdf-file-template");
const pdfFileData = document.getElementById("pdf-file-data");
const xlsxFileTemplate = document.getElementById("xlsx-file-template");
const xlsxFileData = document.getElementById("xlsx-file-data");
const docxFileTemplate = document.getElementById("docx-file-template");
const docxFileData = document.getElementById("docx-file-data");

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

function formBorderReset(select) {
    const fileName = document.getElementById(`${select}-file-type`);
    const fileTemplate = document.getElementById(`${select}-file-template`);
    const fileData = document.getElementById(`${select}-file-data`);

    fileName.style.borderColor = 'black';
    fileTemplate.style.borderColor = 'black';
    fileData.style.borderColor = 'black';
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
        document.getElementById(`${select}-file-template`).style.borderColor = 'red';
        return false;
    } else if(fileData.innerText === "File ID") {
        fileName.style.borderColor = 'black';
        document.getElementById(`${select}-file-data`).style.borderColor = 'red';
        return false;
    }else{
        return true;
    }

}

function setEmtyValue(select) {
    const fileName = document.getElementById(`${select}-file-type`);
    const fileTemplate = document.getElementById(`${select}-file-template-fid`);
    const fileData = document.getElementById(`${select}-file-data-fid`);
    fileName.value = '';
    fileTemplate.innerText = 'File ID';
    fileTemplate.style.color = 'red';
    fileData.innerText = 'File ID';
    fileData.style.color = 'red';
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

const pdfRun = document.getElementById("pdf-run");
const xlsxRun = document.getElementById("xlsx-run");
const docxRun = document.getElementById("docx-run");

pdfRun.addEventListener("click", () => {
    formBorderReset("pdf");
    if(formValidate("pdf")){
        const data = {
            report_type : document.getElementById("pdf-file-type").value,
            file_id_data : document.getElementById("pdf-file-data-fid").innerText,
            file_id_template : document.getElementById("pdf-file-template-fid").innerText,
            input_extension : 'csv',
        };
        
        postAjax("gdrive-pdf", data, (dataText) => {
            alertify.success('Success has running');
            viewLogs();
            //console.log(dataText);
        });

        return true;
    } else {
        alertify.errorAlert("Please enter a value");
        return false;
    }
});
xlsxRun.addEventListener("click", () => {
    formBorderReset("xlsx");
    if(formValidate("xlsx")){
        const data = {
            report_type : document.getElementById("xlsx-file-type").value,
            file_id_data : document.getElementById("xlsx-file-data-fid").innerText,
            file_id_template : document.getElementById("xlsx-file-template-fid").innerText,
            input_extension : document.getElementById("xlsx-file-data-extension").value,
        };
        postAjax("gdrive-xlsx", data, (dataText) => {
            alertify.success('Success has running');
            viewLogs();
            //console.log(dataText);
        });

        return true;
    } else {
        alertify.errorAlert("Please enter a value");
        return false;
    }
});
docxRun.addEventListener("click", () => {
    formBorderReset("docx");
    if(formValidate("docx")){
        const data = {
            report_type : document.getElementById("docx-file-type").value,
            file_id_data : document.getElementById("docx-file-data-fid").innerText,
            file_id_template : document.getElementById("docx-file-template-fid").innerText,
            input_extension : document.getElementById("docx-file-data-extension").value,
        };
        postAjax("gdrive-docx", data, (dataText) => {
            alertify.success('Success has running');
            viewLogs();
            //console.log(dataText);
        });
 
        return true;
    } else {
        alertify.errorAlert("Please enter a value");
        return false;
    }
});

const reload = document.getElementById("reload");
reload.addEventListener("click", () => {
    viewLogs();
});

function displayDate(date) {
    if(date && date.length > 19){
        let s = date.substring(0,19);
        return s.replace("T", " "); 
    }
    return "...";   
}

function viewLogs() {
    const params = {
        type: "",
        by: ""
    };

    getAjax("logs", params, (dataText) => {
        let result = JSON.parse(dataText);
        if(result.data && Array.isArray(result.data)) {
            document.querySelector('#view-logs').innerHTML = '';

            result.data.forEach((item) => {
                const jsParam = JSON.parse(item.parameters);
                let linkDownload = '<div></div>';
                if(item.status === 'completed'){
                    linkDownload = `<div>
                    <a href="${jsParam.referLink}" target="_blank">Download</a>
                </div>`;
                }
                let htmlStatus = ``;
                switch(item.status) {
                    case 'queued':
                        htmlStatus = `<label style="color:gray">${item.status}</label>`;
                        break;
                    case 'active':
                        htmlStatus = `<label style="color:blue">${item.status}</label>`;
                        break;
                    case 'failed':
                        htmlStatus = `<label style="color:red">${item.status}</label>`;
                        break;
                    case 'completed':
                        htmlStatus = `<label style="color:green">${item.status}</label>`;
                        break;
                    default:
                        htmlStatus = `<label>${item.status}</label>`;
                }
                document.querySelector('#view-logs').innerHTML += `
                    <div class="log-item">
                        <div class="log-item-col">
                            <label>Type:</label> ${item.report_type}
                        </div>
                        <div class="log-item-col">
                            ${htmlStatus}&nbsp;&nbsp;
                        </div>
                        <div class="log-item-col">
                            <label>Start:</label> ${displayDate(item.start_datetime)}
                        </div>
                        <div class="log-item-col">
                            <label>Finish:</label> ${displayDate(item.end_datetime)}
                        </div>
                        ${linkDownload}
                    </div>
                `;
            });
        }
    });
}

window.onload = () =>{
    let evtChange = new Event('input', {
        'bubbles': true,
        'cancelable': true
    });

    if(pdfFileTemplate.value !== ""){
        pdfFileTemplate.dispatchEvent(evtChange);
    }
    if(pdfFileData.value !== ""){
        pdfFileData.dispatchEvent(evtChange);
    }

    if(xlsxFileTemplate.value !== ""){
        xlsxFileTemplate.dispatchEvent(evtChange);
    }
    if(xlsxFileData.value !== ""){
        xlsxFileData.dispatchEvent(evtChange);
    }

    if(docxFileTemplate.value !== ""){
        docxFileTemplate.dispatchEvent(evtChange);
    }
    if(docxFileData.value !== ""){
        docxFileData.dispatchEvent(evtChange);
    }

    viewLogs();
}