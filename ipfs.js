(async function () {
    let pin = async () => {

        alert(`正尋找最新的ipfs Hash`);


        let pkKey = '/pk/QmSeJ41iXwebzm3KPTixBc3zoetBD61df76BRjE4RuY4YB';
        // let pkBase64 = await getDHTRecord(pkKey);
        // console.log(pkBase64);
        let pkBase64 = 'CAASpgIwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCftnVXOr5qF/ahDR5Fm42O6axLJPuQHNN9v6UXyoGmRL6idbhxok9wXt4AYKWcsMszGcwMJnw9bWmFnCJ8zg5PUvfCT2ceqXL6UBn9QB7SfUSSgPcDm1j1VYXnwLeG/ffbRx8i69efUwbyubZ3YcoFq7f6Wfo6VX9gZOPwTwBZWdZOowRVbXhgd379/ZDb5eUEWaI4JDWJdoApaxk79QocAvXdghFPXnGrpuqI7IVE0HiRfoSs3IV9G1lCPTAnLZ6eVuSphAYp1JsmORerdmroM1ZZlxTFKQE/stMZAjJ0xpC87hcDq3baVCqV4mN4WIgUpiLHUc5lQgtpQKzYUf0ZAgMBAAE=';
        console.log(await putDHTRecord(pkKey, base64ToBlob(pkBase64)));

        let ipnsKey = '/ipns/QmSeJ41iXwebzm3KPTixBc3zoetBD61df76BRjE4RuY4YB';
        let ipnsRecBase64 = await getDHTRecord(ipnsKey);
        console.log(ipnsRecBase64);
        console.log(await putDHTRecord(ipnsKey, base64ToBlob(ipnsRecBase64)));


        resp = await fetch('/api/v0/name/resolve?arg=QmSeJ41iXwebzm3KPTixBc3zoetBD61df76BRjE4RuY4YB', {
            method: 'post'
        });
        let json = await resp.json();
        let ipfsPath = json.Path;
        alert(`正在pin${ipfsPath}`);
        resp = await fetch(`/api/v0/pin/add?arg=${ipfsPath}`, {
            method: 'post'
        });
        json = await resp.json();
        console.log(json)
        if (json.Code != 0) {
            alert(`成功`);
        } else {
            alert(`${json.Message}`);
        }
    }
    window.onload = function () {
        if(location.port != 5001){
            return;
        }
        setTimeout(() => {
            document.body.appendChild(htmlToElement(`
            <div style="position:absolute;top: 14px;right: 100px;width: 180px;height: 50px;z-index: 999;"><button id="__delay_btn" style="background:rgb(11, 58, 83);color:white;padding: 14px;">固定最新的多成IPFS</button></div>
            `));
            document.getElementById('__delay_btn').addEventListener('click', pin);
        }, 0);

    };

    async function putDHTRecord(key, blob) {
        let formData = new FormData();
        formData.append('file', blob);
        let resp = await fetch(`/api/v0/dht/put?arg=${key}`, {'method': 'post', body: formData})
        let res = await resp.text();
        return res;
    }

    async function getDHTRecord(key) {
        let resp = await fetch(`/api/v0/dht/get?arg=${key}`, {'method': 'post' })
        let ipnsRes = await resp.text();
        ipnsRes = ipnsRes.split('\n').filter(i => i!='');
        let lastEl = ipnsRes[ipnsRes.length - 1];
        lastEl = JSON.parse(lastEl);
        let ipnsRecBase64 = lastEl['Extra'];
        return ipnsRecBase64;
    }


    /**
     * @param {String} HTML representing a single element
     * @return {Element}
     */
    function htmlToElement(html) {
        let template = document.createElement('template');
        html = html.trim(); // Never return a text node of whitespace as the result
        template.innerHTML = html;
        return template.content.firstChild;
    }

    function base64ToBlob(strBase64) {
        strBase64 = atob(strBase64);
        let byteNumbers = new Array(strBase64.length);
        for (let i = 0; i < strBase64.length; i++) {
            byteNumbers[i] = strBase64.charCodeAt(i);
        }
        let byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray]);
    }
    



}());