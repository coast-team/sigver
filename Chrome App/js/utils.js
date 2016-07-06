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
 * Function which set the text of the collection address.
 * @param {string} text to set.
 */
function setAddress(text) {
  	document.getElementById('address').innerText = text
}

/**
 * Function which get the first address of the addresses collection.
 */
function getFirstAddress() {
  	return document.getElementById('address').childNodes[0].childNodes[0].innerText
}

/**
 * Function which adds an entry in the connection table, with the number of the connection
 * @param {int} number connection's number
 */
function addConnectionNumber(number) {
	let tbody = document.getElementsByTagName('tbody')[0]

	let tr = document.createElement('tr')
	let tdClose = document.createElement('td')
	let closeButtonMaterialize = document.createElement('a')
	let closeButtonNode = document.createTextNode('Close')

	closeButtonMaterialize.setAttribute('class', 'waves-effect waves-light btn-small')
	closeButtonMaterialize.setAttribute('id', 'close-' + number)
	closeButtonMaterialize.appendChild(closeButtonNode)
	tdClose.appendChild(closeButtonMaterialize)

	tr.appendChild(document.createElement('td'))
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
	if (tr) {
		let tdTime = tr.childNodes[2],
			timeNode

		tdTime.innerHTML = ""

		if (typeof time === "number") {
			timeNode = document.createTextNode("" + time + " ms")
		} else {
			timeNode = document.createTextNode(time)
		}

		tdTime.appendChild(timeNode)
	}
}

/**
 * Function to set the time at which a given connection started
 * @param {int} number connection's number
 * @param {int} time time in milliseconds
 */
function setConnectionStartedAt(number, time) {
	let tr = document.getElementById('tr-' + number)
	if (tr) {
		let tdStarted = tr.childNodes[1],
			startedNode,
			date = new Date(time)

		let hours = date.getHours(),
			minutes = date.getMinutes(),
			seconds = date.getSeconds(),
			milliseconds = date.getMilliseconds()

		if (hours < 10) {
			hours = '0' + hours
		}

		if (minutes < 10) {
			minutes = '0' + minutes
		}

		if (seconds < 10) {
			seconds = '0' + seconds
		}

		if (milliseconds < 10) {
			milliseconds = '00' + milliseconds
		} else if (milliseconds < 100) {
			milliseconds = '0' + milliseconds
		}
		
		startedNode = document.createTextNode(hours + "h " + minutes + "m " + seconds + "." + milliseconds + "s")
		
		tdStarted.innerHTML = ""
		tdStarted.appendChild(startedNode)
	}
}

/**
 * Function which sets the type field in an entry of the connection table
 * @param {int} number connection's number
 * @param {string} type connection's type
 */
function setConnectionType(number, type) {
	let tr = document.getElementById('tr-' + number)
	if (tr) {
		let td = tr.childNodes[0]

		let typeNode = document.createTextNode(type)

		td.appendChild(typeNode)
	}
}

/**
 * Function which disable the close connection button in an entry of the connection table
 * @param {int} number connection's number
 */
function setConnectionOff(number) {
	let tr = document.getElementById('tr-' + number)
	let closeButton = document.getElementById('close-' + number)

	if (tr) {
		tr.setAttribute('running', "false")
		closeButton.setAttribute('class', closeButton.className + " disabled")
	}
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

	setConnectionStartedAt(number, socket.createdAt)

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
	    console.log(text)
	} else {
	    log.innerText = log.innerHTML + text + '\n'
	}
}

/**
 * Function which sets the initial values for the addresses and connections DOM objects.
 */
function init() {
	let count = 0,
		address = ["Server is Off"]

	// chrome.system.network.getNetworkInterfaces((interfaces) => {
 //        count = interfaces.length
 //        count++

 //        for (var i = 0 ; i < count ; i++) {
	//     	address += "\n"
	//     }
	//     setAddress(address)
 //    })

 	setAddress(address)

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
