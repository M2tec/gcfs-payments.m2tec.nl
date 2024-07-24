let handleSetEncoder;

localStorage.clear()

var qrcode = new QRCode(document.getElementById("qrcode"), {
    text: "http://www.gamechanger.finance",
    width: 550,
    height: 550
});

let amountInput = document.getElementById('amountInput');
//let txInfo = document.getElementById('txInfo').value;
let gcfsAddressInput = document.getElementById('walletInput');

radioButton = document.getElementById("network_preprod");
radioButton.checked = true;

dAppLink = document.getElementById('dappLink');

////////////////
////    Dapp Logic    /////
///////////////////////////
async function main() {
    //Dapp <--> GameChanger Wallet connections can use URL redirections
    let actionUrl = "";
    let resultObj = undefined;
    let error = "";
    let useCodec = 'gzip';


    amount = parseInt(amountInput.value) * 1000000;

    gcfsAddress = gcfsAddressInput.value;

    //GameChanger Wallet is pure Web3, zero backend procesing of user data. 
    //Dapp connector links are fully processed on end-user browsers.

    let network_type = document.querySelector("input[type='radio'][name=network_type]:checked").value;

    if (network_type == "mainnet") {
        var gcApiUrl = "https://beta-wallet.gamechanger.finance/api/2/run/";
    } else {
        var gcApiUrl = "https://beta-preprod-wallet.gamechanger.finance/api/2/run/";
    }

    const currentUrl = window.location.href;

    //UI components:
    const connectForm = document.getElementById("dappConnectorBox");
    const actionBtn = document.getElementById("connectBtn");
    // const errorsBox = document.getElementById("errorBox");
    const resultsBox = document.getElementById("resultBox");
    const encodersBox = document.getElementById("encodersBox");


    async function updateUI() {
        error = "";
        actionUrl = "";


        //GameChanger Wallet support arbitrary data returning from script execution, encoded in a redirect URL
        //Head to https://beta-preprod-wallet.gamechanger.finance/doc/api/v2/api.html#returnURLPattern to learn ways how to customize this URL

        //lets try to capture the execution results by decoding/decompressing the return URL
        try {
            const resultRaw = (new URL(currentUrl)).searchParams.get("result");
            if (resultRaw) {
                resultObj = await gcDecoder(resultRaw);
                //avoids current url carrying latest results all the time 
                history.pushState({}, '', window.location.pathname);
            }
        } catch (err) {
            error += `Failed to decode results.${err?.message || "unknown error"}`;
            console.error(err);
        }


        //This is the GCScript code, packed into a URL, that GameChanger Wallet will execute
        //lets try to generate this connection URL by encoding/compressing the gcscript code
        try {
            //GCScript (dapp connector code) will be packed inside this URL    
            actionUrl = await buildActionUrl(amount);
        } catch (err) {
            error += `Failed to build URL.${err?.message || "unknown error"}`
            console.error(err);
        }

        //Now lets render the current application state
        // if (error) {
        //     errorBox.innerHTML = "Error: " + error;
        // }
        if (actionUrl) {
            // errorBox.innerHTML = "";
            openAction = "window.open('" + actionUrl + "'), '_blank'"
            actionBtn.setAttribute("onclick", openAction)
            // actionBtn.setAttribute("onclick", "location.href='" + actionUrl +"'");
            //actionBtn.onclick = "location.href=" + actionUrl;
            actionBtn.innerHTML = `Payment link`;


            document.getElementById("qrcode").innerHTML = "";

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

            var options = {
                text: actionUrl,
                width: 550,
                height: 550
            };
            new QRCode(document.getElementById("qrcode"), options);

        } else {
            actionBtn.href = '#';
            actionBtn.innerHTML = "Loading...";
        }

        if (resultObj) {
            resultsBox.innerHTML = JSON.stringify(resultObj, null, 2);
        }
        // encodersBox.innerHTML = "Encoding: "
        // encodersBox.innerHTML += Object.keys(codecs)
        //     .map(codec => `<a href="#" class="a-unstyled" ${codec === useCodec ? 'style="font-weight:bold;""' : ''} onclick="return handleSetEncoder('${codec}')">${codec}</a>`)
        //     .join(" | ");

    }

    async function buildActionUrl(args) {
        //This is the GCScript code that GameChanger Wallet will execute
        //JSON code that will be encoded/compressed inside 'actionUrl'

        // console.log("buildActionUrl: " + args)

        gcfsAddress = "gcfs://672825680c69dc1c6018200f219e87e0ac04896b343d07fd74b44145.Paypad@latest://pay.gcscript"

        let gcscript = {
            "title": "Payment",
            "description": "payments.m2tec.nl",
            "type": "script",
            "run": [{
                "type": "importAsScript",
                "args": {
                    "ada": amount.toString()
                },
                "from": [ gcfsAddress ]
            }]
        }


        // GCFS setup code 
        // {
        //     "type": "script",
        //     "title": "Build Transaction",
        //     "description": "Code that generates a transaction",
        //     "exportAs": "data",
        //     "args": "{get('args')}",
        //     "run": {
        //         "build": {
        //             "type": "buildTx",
        //             "title": "Payment",
        //             "tx": {
        //                 "outputs": {
        //                     "merchant": {
        //                         "address": "addr_test1qz55eyt5v523xkz8pvjnjdf67ht435hv8mzyueuujaadhc9k6c2pncxfcd80uraszphd5p3x5wj627q8yt74ytfrpafsm902s0",
        //                         "assets": [
        //                             {
        //                                 "policyId": "ada",
        //                                 "assetName": "ada",
        //                                 "quantity": "{get('args.ada')}"
        //                             }
        //                         ]
        //                     }
        //                 }
        //             }
        //         },
        //         "sign": {
        //             "detailedPermissions": false,
        //             "type": "signTxs",
        //             "txs": [
        //                 "{get('cache.build.txHex')}"
        //             ]
        //         },
        //         "submit": {
        //             "type": "submitTxs",
        //             "txs": "{get('cache.sign')}"
        //         }
        //     }
        // }


        // let gcscript_1 = {
        //     "type": "script",
        //     "title": "M2tec payment",
        //     "description": "M2 tx",
        //     "run": {
        //         "s1": {
        //             "type": "buildTx",
        //             "tx": {
        //                 "outputs": [
        //                     {
        //                         "address": walletAddress,
        //                         "assets": [
        //                             {
        //                                 "policyId": "ada",
        //                                 "assetName": "ada",
        //                                 "quantity": amount.toString()
        //                             }
        //                         ]
        //                     }
        //                 ],
        //                 "auxiliaryData": {
        //                     "674":
        //                         { "msg": [txInfo] }
        //                 },
        //             }
        //         },
        //         "s2": {
        //             "type": "signTxs",
        //             "detailedPermissions": false,
        //             "txs": [
        //                 "{get('cache.s1.txHex')}"
        //             ]
        //         },
        //         "s3": {
        //             "type": "submitTxs",
        //             "txs": "{get('cache.s2')}"
        //         }
        //     }
        // }

        //This is a patch to adapt the return URL of the script to the origin that is hosting this html file.
        //so this way executed scripts data exports can be captured back on dapp side
        gcscript.returnURLPattern = window.location.origin + window.location.pathname;
        const encoded = await gcEncoder(gcscript, useCodec);
        return `${gcApiUrl}${encoded}`;
    }

    updateUI();
}



///////////////////////////
//// Encoding Helpers /////
///////////////////////////

//https://github.com/blakeembrey/universal-base64/blob/master/src/browser.ts
function base64Encode(str) {
    const percentToByte = (p) => String.fromCharCode(parseInt(p.slice(1), 16));
    return btoa(encodeURIComponent(str).replace(/%[0-9A-F]{2}/g, percentToByte));
}
function base64Decode(str) {
    const byteToPercent = (b) => `%${`00${b.charCodeAt(0).toString(16)}`.slice(-2)}`;
    return decodeURIComponent(Array.from(atob(str), byteToPercent).join(""));
}
//https://github.com/blakeembrey/universal-base64url/blob/master/src/index.ts
function base64urlDecode(str) {
    return base64Decode(str.replace(/\-/g, "+").replace(/_/g, "/"));
}
function base64urlEncode(str) {
    return base64Encode(str)
        .replace(/\//g, "_")
        .replace(/\+/g, "-")
        .replace(/=+$/, "");
}

async function base64ToBytes(base64) {
    const res = await fetch("data:application/octet-stream;base64," + base64);
    return new Uint8Array(await res.arrayBuffer());
}
function urlSafeBase64Encode(safeBase64) {
    return safeBase64
        .replace(/\+/g, '-') // Convert '+' to '-'
        .replace(/\//g, '_') // Convert '/' to '_'
        .replace(/=+$/, ''); // Remove ending '='
};
function urlSafeBase64Decode(safeBase64, padding = true) {
    // Add removed at end '='
    let unsafeBase64 = safeBase64
    if (padding)
        unsafeBase64 += Array(5 - unsafeBase64.length % 4).join('=');
    unsafeBase64 = unsafeBase64
        .replace(/\-/g, '+') // Convert '-' to '+'
        .replace(/\_/g, '/'); // Convert '_' to '/'
    //return new Buffer(unsafeBase64, 'base64');
    return unsafeBase64;
};
function compress(string, encoding) {
    const byteArray = new TextEncoder().encode(string);
    const cs = new CompressionStream(encoding);
    const writer = cs.writable.getWriter();
    writer.write(byteArray);
    writer.close();
    return new Response(cs.readable).arrayBuffer();
}
function decompress(byteArray, encoding) {
    const cs = new DecompressionStream(encoding);
    const writer = cs.writable.getWriter();
    writer.write(byteArray);
    writer.close();
    return new Response(cs.readable).arrayBuffer().then(function (arrayBuffer) {
        return new TextDecoder().decode(arrayBuffer);
    });
}
async function encodeByteArray(array) {
    return new Promise((resolve) => {
        const blob = new Blob([array]);
        const reader = new FileReader();

        reader.onload = (event) => {
            const dataUrl = event.target.result;
            const [_, base64] = dataUrl.split(',');

            resolve(base64);
        };

        reader.readAsDataURL(blob);
    });
}

const codecs = {
    'gzip': {
        header: '1-',
        encoder: async function (code) {
            var header = '1-';
            // Compact JSON
            var json = JSON.stringify(code);
            // Compress JSON with gzip
            var encoded_data = await compress(json, "gzip")
            // Base64url encode data
            var buffer = await encodeByteArray(encoded_data);
            var base64String = urlSafeBase64Encode(buffer.toString())
            var msg = `${header}${base64String}`;
            return msg;
        },
        decoder: async function (msg) {
            var header = '1-';
            var base64url = msg.replace(header, '');
            // base64ToBytes() requires base64 without padding, so we pass padding=false
            var base64 = urlSafeBase64Decode(base64url, false);
            var encoded_data = await base64ToBytes(base64)
            var json = await decompress(encoded_data, "gzip");
            var obj = JSON.parse(json);
            return obj;
        }
    }
}

function gcEncoder(obj, codec = 'gzip') {
    return codecs[codec].encoder(obj);
}
function gcDecoder(msg, codec) {
    let _useCodec = codec;
    if (!_useCodec)
        Object.keys(codecs).forEach(_codec => {
            const header = codecs[_codec].header;
            if (msg.startsWith(header))
                _useCodec = _codec;
        });
    return codecs[_useCodec].decoder(msg);
}


window.onload = function () {
    main();
}
