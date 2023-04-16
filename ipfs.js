(async function () {
    let ipnsKey = '/ipns/12D3KooWACwFV6WAzonbCLYo3r5JxivL5jbPNx5JpEwaepHykcqR';

    let pin = async () => {
        log(`正在更新...`);
        let inetIP = await findInetIP();
        await allowExternalAccess();
        let savedHash = localStorage.getItem('saved_ipfs_hash');
        if(savedHash){
            log('正在更新，當前的hash是: ' + savedHash);
        }
        document.getElementById('__mobile').innerText = '同網絡的手機可以用 http://' + inetIP + ':8080';
        //public key is not required for 0.7.0
        // let pkKey = '/pk/QmSeJ41iXwebzm3KPTixBc3zoetBD61df76BRjE4RuY4YB';
        // let pkBase64 = await getDHTRecord(pkKey);
        // console.log(pkBase64);
        // let pkBase64 = 'CAASpgIwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCftnVXOr5qF/ahDR5Fm42O6axLJPuQHNN9v6UXyoGmRL6idbhxok9wXt4AYKWcsMszGcwMJnw9bWmFnCJ8zg5PUvfCT2ceqXL6UBn9QB7SfUSSgPcDm1j1VYXnwLeG/ffbRx8i69efUwbyubZ3YcoFq7f6Wfo6VX9gZOPwTwBZWdZOowRVbXhgd379/ZDb5eUEWaI4JDWJdoApaxk79QocAvXdghFPXnGrpuqI7IVE0HiRfoSs3IV9G1lCPTAnLZ6eVuSphAYp1JsmORerdmroM1ZZlxTFKQE/stMZAjJ0xpC87hcDq3baVCqV4mN4WIgUpiLHUc5lQgtpQKzYUf0ZAgMBAAE=';
        // console.log(await putDHTRecord(pkKey, base64ToBlob(pkBase64)));

        let ipnsRecBase64 = await getDHTRecord(ipnsKey);
        console.log(ipnsRecBase64);

        let blobRecord = base64ToBlob(ipnsRecBase64);
        console.log(blobRecord)
        let blobText = await blobRecord.text();
        let ipfsPath = blobText.substr(blobText.indexOf('/ipfs/'), 52);
        console.log('=== ipfs ===' + ipfsPath);

     
        log(`正在固定 ${ipfsPath}...`);
        resp = await fetch(`/api/v0/pin/add?arg=${ipfsPath}`, {
            method: 'post'
        });
        json = await resp.json();
        console.log(json)

        console.log('broadcasting new dht record.');
        let putDHTRes = await putDHTRecord(ipnsKey, base64ToBlob(ipnsRecBase64));
        console.log('put dht result: ', putDHTRes);

        if (json.Code != 0) {
            log(`固定成功`);
            localStorage.setItem('saved_ipfs_hash', ipfsPath);
            log(`固定成功, 最新的ipfs hash是 ${ipfsPath}`);
        } else {
            log(`${json.Message}`);
        }
    }

    window.onload = function () {
        if(location.port != 5001){
            return;
        }
        setTimeout(() => {
            document.body.appendChild(htmlToElement(`
            <div style="position:absolute;top: 14px;right: 100px;width: 550px;height: 50px;z-index: 999;">
                <button id="__delay_btn" style="position: absolute;right: 0px;width: 180px;background:rgb(11, 58, 83);color:white;padding: 14px;">固定最新的多成IPFS</button>
                <div style="position: absolute;right: 0;padding:10px;top: 50px; width: 550px;text-align: right;">
                <div style="color:red">請保持 http://127.0.0.1:5001/webui 打開，否則無法更新網站</div>
                <div id="__log" ></div>
                <div id="__mobile"></div>
                </div>
            </div>
            `));

            document.getElementById('__delay_btn').addEventListener('click', pin);
            pin();
            setInterval(pin, 60 * 1000 * 60);
        }, 0);
    };

    async function findInetIP(){
        let resp = await fetch('/api/v0/id', {method: 'post'});
        let json = await resp.json();
        const octet = '(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]?|0)';
        const regex = new RegExp(`${octet}\\.${octet}\\.${octet}\\.${octet}`);
        if(json.Addresses){
            let addr = json.Addresses.find(addr => {
                return addr.startsWith('/ip4/192');
            });
            let ip = regex.exec(addr)[0];
            console.log(ip);
            return ip;
        }
    }

    async function allowExternalAccess() {
        let resp = await fetch('/api/v0/config?arg=Addresses.Gateway', {method: 'post'})
        let json = await resp.json();
        let addr = json.Value;
        if(!addr){
            return;
        }
        addr = addr.replace('127.0.0.1', '0.0.0.0');
        resp = await fetch(`/api/v0/config?arg=Addresses.Gateway&arg=${addr}`, {method: 'post'});
        json = await resp.text();
        console.log(json);
        
        resp = await fetch(`/api/v0/config?arg=Gateway.RootRedirect&arg=${ipnsKey}`, 
        {method: 'post'});
        json = await resp.text();
        console.log(json);
    }

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

    function log(text) {
        document.getElementById('__log').innerHTML = text;
    }
    
    function setHash(text) {
        document.getElementById('__log_hash').innerHTML = text;
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