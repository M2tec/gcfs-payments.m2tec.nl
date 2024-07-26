let handleSetEncoder;

localStorage.clear()

// Get page elements
let qrCodeElement = document.getElementById("qrcode")

let amountInput = document.getElementById('amountInput');
let amountAlert = document.getElementById('amountAlert');
let txInfoInput = document.getElementById('txInfo');
let walletAddressInput = document.getElementById('walletInput');

let connectForm = document.getElementById("dappConnectorBox");
let actionBtn = document.getElementById("connectBtn");
let resultsBox = document.getElementById("resultBox");
let encodersBox = document.getElementById("encodersBox");

let txAlertText = document.getElementById("txAlertText");
let txSuccessAlert = document.getElementById("txSuccessAlert");

let radioButton = document.getElementById("network_preprod");
radioButton.checked = true;

let dAppLink = document.getElementById('dappLink');



const qrWidth = parseInt(getComputedStyle(qrCodeElement).width.slice(0,-2)) - 50 ;
console.log(qrWidth)
const qrHeight = qrWidth

var qrcode = new QRCode(document.getElementById("qrcode"), {
    text: "http://www.gamechanger.finance",
    width: qrWidth ,
    height: qrHeight
});




////////////////
////    Dapp Logic    /////
///////////////////////////
async function main() {
    //Dapp <--> GameChanger Wallet connections can use URL redirections
    let actionUrl = "";
    let resultObj = undefined;
    let error = "";
    let useCodec = 'gzip';


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
            txAlertText.innerHTML = 'Transaction successfull. Check you transaction on <a href="https://' + network_type + '.cardanoscan.io/transaction/' + txHash + '" class="alert-link">cardanoscan</a>'
            txSuccessAlert.style.display = "block"
        }


      }
      


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

    //GameChanger Wallet is pure Web3, zero backend procesing of user data. 
    //Dapp connector links are fully processed on end-user browsers.

    if (network_type == "mainnet") {
        var gcApiUrl = "https://beta-wallet.gamechanger.finance/api/2/run/";
    } else {
        var gcApiUrl = "https://beta-preprod-wallet.gamechanger.finance/api/2/run/";
    }

    let currentUrl = window.location.href;


    //UI components:
    async function updateUI() {
        error = "";
        actionUrl = "";


        //GameChanger Wallet support arbitrary data returning from script execution, encoded in a redirect URL
        //Head to https://beta-preprod-wallet.gamechanger.finance/doc/api/v2/api.html#returnURLPattern to learn ways how to customize this URL

        //lets try to capture the execution results by decoding/decompressing the return URL
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
            // openAction = "window.open('" + actionUrl + "'), '_blank'"
            // actionBtn.setAttribute("onclick", openAction)

            actionBtn.setAttribute("href", actionUrl)
            
            // actionBtn.setAttribute("onclick", "location.href='" + actionUrl +"'");
            //actionBtn.onclick = "location.href=" + actionUrl;
            // actionBtn.innerHTML = `Payment link`;


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

            let qrWidth = parseInt(getComputedStyle(qrCodeElement).width.slice(0,-2)) - 50 ;
            console.log(qrWidth)
            let qrHeight = qrWidth

            var options = {
                text: actionUrl,
                width: qrWidth ,
                height: qrHeight
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

        // // console.log("buildActionUrl: " + args)
        // let gcscript = 
        // {
        //     "title": "Payment request",
        //     "description": "Review and sign the transaction",
        //     "type": "script",
        //     "run": {
        //         "importedScript": {
        //             "type": "importAsScript",
        //             "args": {
        //                 "address": walletAddress,
        //                 "amount": amount.toString(),
        //                 "msg":txInfo,                        
        //             },
        //             "from": [
        //                 "0x7b0a202020202274797065223a2022736372697074222c0a20202020226465736372697074696f6e223a202270726f63657373696e672075736572207472616e73616374696f6e2e2e2e222c0a20202020226578706f72744173223a202264617461222c0a202020202272657475726e223a207b0a2020202020202020226d6f6465223a20226c617374220a202020207d2c0a202020202261726773223a20227b67657428276172677327297d222c0a202020202272756e223a207b0a202020202020202022636f6e666967223a207b0a2020202020202020202020202274797065223a20226d6163726f222c0a2020202020202020202020202272756e223a207b0a2020202020202020202020202020202022646576656c6f70657241646472657373223a2022616464725f746573743171706671353276396b3630726d797472706479337a777674646137386168336b6a6e67366c756a3237337a726b61616471776a327533646a726167306d656e6532636d39656c75356d64716d637a397a6332727a677137633567367130726c38386d222c0a2020202020202020202020202020202022646576656c6f706572466565223a202231303030303030220a2020202020202020202020207d0a20202020202020207d2c0a2020202020202020226275696c64223a207b0a2020202020202020202020202274797065223a20226275696c645478222c0a202020202020202020202020227469746c65223a20227b6765742827617267732e7469746c6527297d222c0a202020202020202020202020226465736372697074696f6e223a20227b6765742827617267732e6465736372697074696f6e27297d222c0a202020202020202020202020226964223a20227b6765742827617267732e696427297d222c0a2020202020202020202020202274616773223a20227b6765742827617267732e7461677327297d222c0a2020202020202020202020202267726f7570223a20227b6765742827617267732e67727027297d222c0a20202020202020202020202022696e6465784f66223a20227b6765742827617267732e69647827297d222c0a20202020202020202020202022706172656e74547848617368223a20227b6765742827617267732e706172656e7427297d222c0a2020202020202020202020202272657475726e55524c5061747465726e223a20227b6765742827617267732e75726c27297d222c0a202020202020202020202020227478223a207b0a20202020202020202020202020202020226f757470757473223a207b0a202020202020202020202020202020202020202022646576656c6f706572466565223a207b0a2020202020202020202020202020202020202020202020202261646472657373223a20227b676574282763616368652e636f6e6669672e646576656c6f7065724164647265737327297d222c0a20202020202020202020202020202020202020202020202022617373657473223a205b0a202020202020202020202020202020202020202020202020202020207b0a202020202020202020202020202020202020202020202020202020202020202022706f6c6963794964223a2022616461222c0a20202020202020202020202020202020202020202020202020202020202020202261737365744e616d65223a2022616461222c0a2020202020202020202020202020202020202020202020202020202020202020227175616e74697479223a20227b676574282763616368652e636f6e6669672e646576656c6f70657246656527297d220a202020202020202020202020202020202020202020202020202020207d0a2020202020202020202020202020202020202020202020205d0a20202020202020202020202020202020202020207d2c0a202020202020202020202020202020202020202022757365725061796d656e74223a207b0a2020202020202020202020202020202020202020202020202261646472657373223a20227b6765742827617267732e6164647265737327297d222c0a20202020202020202020202020202020202020202020202022617373657473223a205b0a202020202020202020202020202020202020202020202020202020207b0a202020202020202020202020202020202020202020202020202020202020202022706f6c6963794964223a2022616461222c0a20202020202020202020202020202020202020202020202020202020202020202261737365744e616d65223a2022616461222c0a2020202020202020202020202020202020202020202020202020202020202020227175616e74697479223a20227b6765742827617267732e616d6f756e7427297d220a202020202020202020202020202020202020202020202020202020207d0a2020202020202020202020202020202020202020202020205d0a20202020202020202020202020202020202020207d0a202020202020202020202020202020207d2c0a2020202020202020202020202020202022617578696c6961727944617461223a207b0a202020202020202020202020202020202020202022363734223a207b0a202020202020202020202020202020202020202020202020226d7367223a20227b737472546f4d65746164617461537472286765742827617267732e6d73672729297d220a20202020202020202020202020202020202020207d0a202020202020202020202020202020207d2c0a20202020202020202020202020202020226f7074696f6e73223a207b0a2020202020202020202020202020202020202020226175746f50726f766973696f6e223a207b0a20202020202020202020202020202020202020202020202022776f726b73706163654e6174697665536372697074223a20747275650a20202020202020202020202020202020202020207d2c0a2020202020202020202020202020202020202020226175746f4f7074696f6e616c5369676e657273223a207b0a202020202020202020202020202020202020202020202020226e6174697665536372697074223a20747275650a20202020202020202020202020202020202020207d0a202020202020202020202020202020207d0a2020202020202020202020207d0a20202020202020207d2c0a2020202020202020227369676e223a207b0a2020202020202020202020202264657461696c65645065726d697373696f6e73223a2066616c73652c0a2020202020202020202020202274797065223a20227369676e547873222c0a20202020202020202020202022747873223a205b0a20202020202020202020202020202020227b676574282763616368652e6275696c642e747848657827297d220a2020202020202020202020205d0a20202020202020207d2c0a2020202020202020227375626d6974223a207b0a2020202020202020202020202274797065223a20227375626d6974547873222c0a20202020202020202020202022747873223a20227b676574282763616368652e7369676e27297d220a20202020202020207d2c0a20202020202020202266696e616c6c79223a207b0a2020202020202020202020202274797065223a20226d6163726f222c0a2020202020202020202020202272756e223a207b0a2020202020202020202020202020202022747848617368223a20227b676574282763616368652e6275696c642e74784861736827297d222c0a2020202020202020202020202020202022696e6465784d6170223a20227b676574282763616368652e6275696c642e696e6465784d617027297d222c0a202020202020202020202020202020202274616773223a20227b6765742827617267732e7461677327297d222c0a202020202020202020202020202020202267726f7570223a20227b6765742827617267732e67727027297d222c0a2020202020202020202020202020202022696e6465784f66223a20227b6765742827617267732e69647827297d222c0a2020202020202020202020202020202022706172656e74547848617368223a20227b6765742827617267732e706172656e7427297d222c0a20202020202020202020202020202020226964223a20227b6765742827617267732e696427297d220a2020202020202020202020207d0a20202020202020207d0a202020207d0a7d"
        //             ]
        //         }
        //     }
        // }

        let gcscript = 
        {
            "title": "Payment",
            "description": "Review and sign",
            "type": "script",
            "run": {
                "importedScript": {
                    "type": "importAsScript",
                    "args": {
                        "title":"M2Tec Payment",
                        "address": walletAddress ,
                        "amount": amount.toString(),
                        "url": "https://payments.m2tec.nl/?txHash={txHash}",
                        "msg": txInfo                  
                    },
                    "from": [
                        "gcfs://386bec6c6199a40890abd7604b60bf43089d9fb1120a3d42198946b9.Pay@latest://pay.gcscript"
                    ]
                }
            }
        }

        //This is a patch to adapt the return URL of the script to the origin that is hosting this html file.
        //so this way executed scripts data exports can be captured back on dapp side
        gcscript.returnURLPattern = window.location.origin + window.location.pathname;
        let encoded = await gcEncoder(gcscript, useCodec);
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

window.addEventListener('resize', function(event) {
    clearTimeout(window.resizedFinished);
    window.resizedFinished = setTimeout(function(){
        console.log('Resized finished.');
        main()
    }, 250);

}, true);
