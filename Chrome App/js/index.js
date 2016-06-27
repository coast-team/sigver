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
