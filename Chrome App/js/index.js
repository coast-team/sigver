"use strict"

var switchServer = document.getElementById('switch-server'),
	buttonClearConnections = document.getElementById('clear-connections'),
	buttonClearLogs = document.getElementById('clear-logs'),
	buttonTest = document.getElementById('test'),
	hideWindowButton = document.getElementById('hide-window')

var sigVer

chrome.runtime.getBackgroundPage((win) => {
	// Get a reference to the sigver which is running in background
	sigVer = win.sigVerBG
})

// Initialize the application's DOM fields when launched
init()

// Add listeners for the different buttons and switch on the app's page
switchServer.addEventListener('click', startAndStopServer)
buttonClearConnections.addEventListener('click', clearConnections)
buttonClearLogs.addEventListener('click', clearLogs)
buttonTest.addEventListener('click', runTest)
hideWindowButton.addEventListener('click', hideWindow)

// Add listeners for the different messages sent by background pages
chrome.runtime.onMessage.addListener((message) => {
	let mes

	try {
		mes = JSON.parse(message)
	} catch(e) {
		console.log('Error parsing own message')
	}

	if (mes.hasOwnProperty('address')) {
		setAddress(mes.address)
	} else if (mes.hasOwnProperty('log')) {
		log(mes.log)
	} else if (mes.hasOwnProperty('connectionTime')) {
		setConnectionTime(mes.connectionTime.number, mes.connectionTime.time)
	} else if (mes.hasOwnProperty('connectionOff')) {
		setConnectionOff(mes.connectionOff)
	} else if (mes.hasOwnProperty('updateConnections')) {
		if (mes.updateConnections) {
			updateConnections()
		}
	} else if (mes.hasOwnProperty('closeAllConnections')) {
		if (mes.closeAllConnections) {
			closeAllConnections()
		}
	}
})