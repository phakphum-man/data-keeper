window.onload = function () {
    const params = (new URL(document.location)).searchParams;
    const p = params.get("p")??1;
    const g = params.get("g")??"";
    getAjax('/manga/api', {p:p,g:g}, (data) => {
        const jsData = JSON.parse(data);
        renderManga(jsData.data, '.shop-images');
    });

    const home = document.querySelector('.shop-section h2');
    if(home.innerText.startsWith("All")){
        document.querySelector('.hero-section').style.display = "flex";
        getAjax('/manga/api/hits', {p:p,g:g}, (data) => {
            const jsData = JSON.parse(data);
            renderManga(jsData.data, '.shop-hit-images');
        });
    } else {
        document.querySelector('.hero-section').style.display = "none";
    }
    /*
    document.querySelector('.search-icon').addEventListener('click', () =>{
        window.location.href = "/manga/host";
    });*/
    document.querySelector('.search-input').addEventListener('keyup', (e) => {
        const input = e.target.value;
        const searchResult = document.getElementById('search-result');
        searchResult.innerHTML = '';
        if(input){
            getAjax('/manga/api', {s:input}, (data) => {
                const jsData = JSON.parse(data);
                const result = jsData.data.map((item) => {
                    let li = document.createElement('li');

                    let a = document.createElement('a');
                    a.href = item.firstChapter.url;

                    let img = document.createElement('img');
                    img.src = item.imgUrl;
                    img.style.height = "50px";
                    a.appendChild(img);
                    a.appendChild(document.createTextNode(item.title));

                    a.alt = item.title;
                    li.appendChild(a);
                    return li;
                });

                result.forEach((li) => {
                    searchResult.appendChild(li);
                });
            });
        }
    });
}

function renderManga(jsData, htmlSelector) {
    const mangaList = document.querySelector(htmlSelector);
    jsData.forEach((item) => {
        let linkshop = document.createElement('div');
        linkshop.className = 'shop-link';

        let img = document.createElement('img');
        img.src = item.imgUrl;
        img.alt = item.title;
        img.onclick = () => { window.location.href = item.firstChapter.url; }
        linkshop.appendChild(img);

        let h3 = document.createElement('h3');
        h3.innerText = item.title;
        linkshop.appendChild(h3);
        
        let aLast = document.createElement('a');
        aLast.className = 'btn-link';
        aLast.href = item.lastChapter.url;
        aLast.innerHTML = item.lastChapter.title;
        aLast.alt = "New Chapter";

        let spanLast = document.createElement('span');
        spanLast.className = 'date';
        spanLast.innerHTML = item.lastChapter.date;
        aLast.appendChild(spanLast);
        linkshop.appendChild(aLast);

        let aFirst = document.createElement('a');
        aFirst.className = 'btn-link';
        aFirst.href = item.firstChapter.url;
        aFirst.innerHTML = item.firstChapter.title;
        aFirst.alt = "First Chapter";

        let spanFirst = document.createElement('span');
        spanFirst.className = 'date';
        spanFirst.innerHTML = item.firstChapter.date;
        aFirst.appendChild(spanFirst);
        linkshop.appendChild(aFirst);

        mangaList.appendChild(linkshop);
    });
}