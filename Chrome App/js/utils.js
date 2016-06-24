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

	updateConnections()
}

/**
 * Function which set the text of the div address.
 * @param {string} text to set.
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
 * @param {int} number connection's number
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
 * @param {int} number connection's number
 * @param {int} time can be an int and be the time to set or "Running"
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
 * @param {int} number connection's number
 * @param {string} type connection's type
 */
function setConnectionType(number, type) {
	let tr = document.getElementById('tr-' + number)
	let td = tr.childNodes[1]

	let typeNode = document.createTextNode(type)

	td.appendChild(typeNode)
}

/**
 * Function which disable the close connection button in an entry of the connection table
 * @param {int} number connection's number
 */
function setConnectionOff(number) {
	let tr = document.getElementById('tr-' + number)
	let closeButton = document.getElementById('close-' + number)

	tr.setAttribute('running', "false")
	closeButton.disabled = true
}

/**
 * Function which adds an entry in the connection table
 * @param {int} number connection's number
 * @param {string} type connection's type
 * @param {int} time can be an int and be the time to set or "Running"
 * @param {socket} socket Socket that must be closed when the user click on the close button
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
 * @param {string} text Text to log.
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

    updateConnections()
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
 * Function which changes the state of the switch
 */
function updateSwitch() {
	if (switchServer.checked) {
		switchServer.checked = false
	} else {
		switchServer.checked = true
	}
}

/**
 * Function which updates the number of connections displayed and running when connections are added or deleted
 */
function updateConnections() {
	let runningConnections = document.getElementById('running-connections'),
		tbody = document.getElementsByTagName('tbody')[0],
		runningCount = 0,
		displayedCount = tbody.childNodes.length

	for (let i = 0 ; i < displayedCount ; i++) {
		if (tbody.childNodes[i].getAttribute('running') === "true") {
			runningCount++
		}
	}

	if (displayedCount === 0 || displayedCount === 1) {
		runningConnections.innerText = "" + displayedCount + " connection displayed\n" + runningCount + " connection running"
	} else {
		if (runningCount === 0 || runningCount === 1) {
			runningConnections.innerText = "" + displayedCount + " connections displayed\n" + runningCount + " connection running"
		} else {
			runningConnections.innerText = "" + displayedCount + " connections displayed\n" + runningCount + " connections running"
		}
	}
}

/**
 * Function which changes the connection table when the server is stopped
 */
function closeAllConnections() {
	let tbody = document.getElementsByTagName('tbody')[0]

	for (let i = 0 ; i < tbody.childNodes.length ; i++) {
		let tr = tbody.childNodes[i],
			running = tr.getAttribute('running'),
			id = tr.getAttribute('id').split('-')[1]

		if (running === "true") {
			tr.childNodes[2].innerText = 'Server Off'
			setConnectionOff(id)
		}
	}
}
