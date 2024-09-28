localStorage.clear()

let amountInput = document.getElementById('amountInput');
let txInfoInput = document.getElementById('txInfo');
let walletAddressInput = document.getElementById('walletInput');

let radioButton = document.getElementById("network_preprod");
radioButton.checked = true;

let actionBtn = document.getElementById("connectBtn");

let amountAlert = document.getElementById('amountAlert');
let txAlertText = document.getElementById("txAlertText");
let txSuccessAlert = document.getElementById("txSuccessAlert");

let qrCodeImage = document.getElementById("qrcode-image")
let dAppLink = document.getElementById('dappLink');

async function main() {
    const gc = window.gc

    let resultObj = undefined;
    let error = "";
    let txInfo = "";

    amount = parseFloat(amountInput.value) * 1000000;

    if (isNaN(amount)) {
        amountAlert.style.display = "block"
        actionBtn.classList.add("disabled");
        return
    } else {
        amountAlert.style.display = "none"
        actionBtn.classList.remove("disabled");
    }

    txInfo = txInfoInput.value;
    walletAddress = walletAddressInput.value;

    let network_type = document.querySelector("input[type='radio'][name=network_type]:checked").value;
    console.log("Net:" + network_type)

    const searchParams = new URLSearchParams(window.location.search);

    for (const param of searchParams) {
        console.log(param);

        if (param[0] == "result") {
            console.log(param[1])
            let decoded = await gcDecoder(param[1], useCodec);
            let txHash = decoded.exports.data.txHash
            console.log(decoded.exports.data.txHash)
            txAlertText.innerHTML = 'Transaction successfull.   TxHash: ' + txHash
            txSuccessAlert.style.display = "block"
        }

        if (param[0] == "txHash") {
            console.log(param[1])
            let txHash = param[1]
            txAlertText.innerHTML = 'Transaction successfull.   TxHash: ' + txHash
            txSuccessAlert.style.display = "block"
        }

    }

    //UI components:
    async function updateUI() {
        error = "";

        //GameChanger Wallet support arbitrary data returning from script execution, encoded in a redirect URL
        //Head to https://beta-preprod-wallet.gamechanger.finance/doc/api/v2/api.html#returnURLPattern to learn ways how to customize this URL

        //lets try to capture the execution results by decoding/decompressing the return URL
        let currentUrl = window.location.href;
        try {
            let resultRaw = (new URL(currentUrl)).searchParams.get("result");
            if (resultRaw) {
                resultObj = await gcDecoder(resultRaw);
                //avoids current url carrying latest results all the time 
                history.pushState({}, '', window.location.pathname);
            }
        } catch (err) {
            error += `Failed to decode results.${err?.message || "unknown error"}`;
            console.error(err);
        }

        let gcscript =
        {
            "title": "Payment",
            "description": "Review and sign",
            "type": "script",
            "run": {
                "importedScript": {
                    "type": "importAsScript",
                    "args": {
                        "title": "M2Tec Payment",
                        "address": walletAddress,
                        "amount": amount.toString(),
                        "url": "https://payments.m2tec.nl/?txHash={txHash}",
                        "msg": txInfo
                    },
                    "from": [
                        "gcfs://386bec6c6199a40890abd7604b60bf43089d9fb1120a3d42198946b9.Lib@latest://pay.gcscript"
                    ]
                }
            }
        }

        gcscript.returnURLPattern = window.location.origin + window.location.pathname;

        const actionUrl = await gc.encode.url({
            input: JSON.stringify(gcscript),
            apiVersion: '2',
            network: network_type
        })

        console.log(actionUrl)

        let none_style = `{
            "logo": "",
            "title": "",
            "subTitle": "",
            "colorDark": "#000000",
            "colorLight": "#ffffff",
            "quietZone": 0        
            }`

        const qr = await gc.encode.qr({
            input: JSON.stringify(gcscript),
            apiVersion: '2',
            network: network_type,
            qrResultType: 'png',
            styles: none_style,
            template: 'printable'
        })

        console.log(qr);
        qrCodeImage.src = qr;

        if (actionUrl) {

            actionBtn.setAttribute("href", actionUrl)
            // document.getElementById("qrcode").innerHTML = "";

            dAppLink.style.visibility = "visible";
            dAppLink.href = actionUrl;

            tweetButton = document.getElementById('tweetButton');
            tweetButton.innerHTML = ''

            twttr.widgets.createShareButton(
                '#GamechangerOk',
                document.getElementById('tweetButton'),
                {
                    size: "large",
                    text: actionUrl
                }
            );

        } else {
            actionBtn.href = '#';
            actionBtn.innerHTML = "Loading...";
        }

        if (resultObj) {
            resultsBox.innerHTML = JSON.stringify(resultObj, null, 2);
        }

    }

    updateUI();
}

window.onload = function () {
    main();
}
