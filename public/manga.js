window.onload = function () {
    const mangaList = document.querySelector('.shop-images');
    const params = (new URL(document.location)).searchParams;
    const p = params.get("p")??1;
    getAjax('/manga/api', {p:p}, (data) => {
        const jsData = JSON.parse(data);
        jsData.data.forEach((item) => {
            let linkshop = document.createElement('div');
            linkshop.className = 'shop-link';

            let img = document.createElement('img');
            img.src = item.imgUrl;
            img.alt = item.title;
            linkshop.appendChild(img);

            let h3 = document.createElement('h3');
            h3.innerText = item.title;
            linkshop.appendChild(h3);
            
            let aLast = document.createElement('a');
            aLast.className = 'btn-link';
            aLast.href = item.lastChapter.url;
            aLast.innerHTML = item.lastChapter.title;
            aLast.alt = "New Chapter";
            linkshop.appendChild(aLast);

            let aFirst = document.createElement('a');
            aFirst.className = 'btn-link';
            aFirst.href = item.firstChapter.url;
            aFirst.innerHTML = item.firstChapter.title;
            aLast.alt = "First Chapter";
            linkshop.appendChild(aFirst);

            mangaList.appendChild(linkshop);
        });
    });

    document.querySelector('.search-icon').addEventListener('click', () =>{
        window.location.href = "/manga/host";
    });
}