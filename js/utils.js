/**
 * Function which clear the logs' textarea
 */
function clearLogs() {
	document.getElementById('log').innerText = ""
}

/**
 * Function which clears the table of connections
 */
function clearConnections() {
	let tbody = document.getElementsByTagName('tbody')[0]

	for (let i = tbody.childNodes.length -1 ; i >= 0 ; i--) {
		if (!tbody.childNodes[i].getAttribute('running') ||
				tbody.childNodes[i].getAttribute('running') === "false") {
			tbody.removeChild(tbody.childNodes[i])
		}
	}
}

/**
 * Function which set the text of the div address.
 * @param {text} text to set.
 */
function setAddress(text) {
  	document.getElementById('address').innerText = text
}

/**
 * Function which get the first address of the div address.
 */
function getFirstAddress() {
  	return document.getElementById('address').innerText.split('\n')[0]
}

/**
 * Function which adds an entry in the connection table, with the number of the connection
 * @param {number} number of the connection
 */
function addConnectionNumber(number) {
	let tbody = document.getElementsByTagName('tbody')[0]

	let tr = document.createElement('tr')
	let tdNumber = document.createElement('td')
	let tdClose = document.createElement('td')
	let numberNode = document.createTextNode(number)
	let closeButton = document.createElement('button')
	let closeButtonNode = document.createTextNode('Close')

	tdNumber.appendChild(numberNode)
	closeButton.appendChild(closeButtonNode)
	closeButton.setAttribute('id', 'close-' + number)
	tdClose.appendChild(closeButton)

	tr.appendChild(tdNumber)
	tr.appendChild(document.createElement('td'))
	tr.appendChild(document.createElement('td'))
	tr.appendChild(tdClose)

	tr.setAttribute('id', 'tr-' + number)

	tbody.appendChild(tr)
}

/**
 * Function to set the time of a given connection in the connection table
 * @param {number} number of the connection
 * @param {time} time to set
 */
function setConnectionTime(number, time) {
	let tr = document.getElementById('tr-' + number)
	let td = tr.childNodes[2]

	td.innerHTML = ""

	let timeNode

	if (typeof time === "number") {
		timeNode = document.createTextNode("" + time + " ms")
	} else {
		timeNode = document.createTextNode(time)
	}

	td.appendChild(timeNode)
}

/**
 * Function which sets the type field in an entry of the connection table
 * @param {number} number of the connection
 * @param {type} type to set
 */
function setConnectionType(number, type) {
	let tr = document.getElementById('tr-' + number)
	let td = tr.childNodes[1]

	let typeNode = document.createTextNode(type)

	td.appendChild(typeNode)
}

/**
 * Function which disable the close connection button in an entry of the connection table
 * @param {number} number of the connection
 */
function setConnectionOff(number) {
	let tr = document.getElementById('tr-' + number)
	let closeButton = document.getElementById('close-' + number)

	tr.setAttribute('running', "false")
	closeButton.disabled = true
}

/**
 * Function which adds an entry in the connection table
 * @param {number} number of the connection
 * @param {type} type to set
 * @param {time} time to set
 * @param {socket} the socket that must be closed when the user click on the close button
 */
function addConnection(number, type, time, socket) {
	addConnectionNumber(number)

	setConnectionType(number, type)

	setConnectionTime(number, time)

	document.getElementById('tr-' + number).setAttribute('running', "true")
	document.getElementById('close-' + number).addEventListener('click', () => {socket.close()})
}

/**
 * Logging function.
 * @param {text} text to log.
 */
function log(text) {
	var log = document.getElementById('log')
	
	if (log === "undefined" || log === null) {
	    console.log(text);
	} else {
	    log.innerText = log.innerHTML + text + '\n';
	}
}

/**
 * Function which sets the initial values for the addresses and connections DOM objects.
 */
function init() {
	let count = 0,
		address = "Server is Off"

	chrome.system.network.getNetworkInterfaces((interfaces) => {
        count = interfaces.length
        count++

        for (var i = 0 ; i < count ; i++) {
	    	address += "\n"
	    }
	    setAddress(address)
    })
}

/**
 * Function which starts or stops the server and changes the Connections / Addresses in consequence.
 */
function startAndStopServer() {
	if (switchServer.checked) {
		sigVer.start(8000)
		// setConnections("None")
	} else {
		sigVer.stop()
		init()
	}
}

/**
 * Function to hide the window
 */
function hideWindow() {
	chrome.app.window.get("SigVer_App_Window_1").hide()
}

/**
 * Function which set the text of the connections' textarea.
 * @param {text} text to set.
 */
// function setConnections(text) {
// 	document.getElementById('connections').innerText = text
// }

/**
 * Function which add a text to the connections' textarea.
 * @param {text} text to add.
 */
// function addConnection(text) {
// 	var connections = document.getElementById('connections')
// 	if (connections.innerText != "" && connections.innerText != null && connections.innerText != "undefined") {
// 		connections.innerText += "\n" + text
// 	} else {
// 		setConnections(text)
// 	}
// }

// function isServerOn() {
// 	let res
// 	chrome.storage.local.get(['serverIsOn', 'address'], (infos) => {
// 		console.log(infos)
// 		if (infos) {
// 			if (infos.serverIsOn) {
// 				res = [true, infos.address]
// 				console.log(res)
// 				return res
// 			} else {
// 				res = [false, null]
// 				console.log(res)
// 				return res
// 			}
// 		} 
// 	})

	// let p1 = new Promise((resolve, reject) => {
	// 	try{
	// 		new WebSocket('ws://localhost:8000/111112')}
	// 	catch (event) {
	// 		resolve()
	// 	}

	// 	setTimeout(resolve, 100)
	// })

	// p1.then(() => {console.log("tu t'es fait jeté")})
	// try {
	// 	//let ws = new WebSocket(address + ':' + port)
	// 	ws = new WebSocket('ws://localhost:8000/111112').catch(err)

	// 	// ws.onerror = (err) => {
	// 	// 	throw(err)
	// 	// }
	// } catch (event) {
	// 	//Error : server is not running on this address and port
	// 	console.log("Server is not running here")
	// 	return false
	// }
	// ws.onerror = function(event) {
	// 	console.log('error')
	// }

	// ws.onopen = function(event) {
	// 	ws.onmessage = function(event) {
	// 		let msg = JSON.parse(event.data)
	// 		if (msg.hasOwnProperty('open') && msg.hasOwnProperty('address') && msg.hasOwnProperty('iAmSigVer')) {
	// 			for (let address in msg.address) {
	// 				console.log(address)
	// 			}
	// 			return true
	// 		}
	// 	}

	// 	ws.send(JSON.stringify({open: false}))
	// }
// }

// function getAddressIfOn(address, port) {
// 	let ws = new WebSocket(address + ':' + port)

// 	ws.onopen = function(event) {
// 		ws.onmessage = function(event) {
// 			let msg = JSON.parse(event.data)
// 			if (msg.hasOwnProperty(''))
// 		}
// 	}
// 	ws.send(JSON.stringify({open: false}))
// }



