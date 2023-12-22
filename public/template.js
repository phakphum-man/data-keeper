window.onload = () => {
    loadTemplates();
}

function loadTemplates() {
    getAjax("/run-report/getTemplates",{}, (dataText) => {
        let result = JSON.parse(dataText);
        if(result.data && Array.isArray(result.data)) {
            document.querySelector('#view-templates').innerHTML = '';

            result.data.forEach((item) => {
                let faFileIcon = '';
                switch(item.extensionFile) {
                    case 'docx':
                        faFileIcon = `fa-file-word`;
                        break;
                    case 'xlsx':
                        faFileIcon = `fa-file-excel`;
                        break;
                    default:
                        faFileIcon = `fa-file-pdf`;
                }
                document.querySelector('#view-templates').innerHTML += `
                    <div class="column">
                        <div class="card" id="${item._id}">
                            <div class="icon-wrapper">
                                <i class="fas ${faFileIcon}"></i>
                            </div>
                            <h3>${item.type} Template</h3>
                            <p>
                                ${item.description}
                            </p>
                        </div>
                    </div>
                `;
            });

            const cardList = document.querySelectorAll('.card');
            for (let i = 0; i < cardList.length; i++) {
                cardList[i].addEventListener("click", () => {
                    window.location.href = `gdrive?tid=${cardList[i].id}`;
                });
            }
        }
    });
}