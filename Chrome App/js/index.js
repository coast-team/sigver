"use strict";

var switchServer = document.getElementById('switch-server'),
	buttonClearConnections = document.getElementById('clear-connections2'),
	buttonClearLogs = document.getElementById('clear-logs2'),
	buttonTest = document.getElementById('test2'),
	hideWindowButton = document.getElementById('hide-window2')

var sigVer

chrome.runtime.getBackgroundPage((win) => {
	// Get a reference to the sigver which is running in background
	sigVer = win.sigVerBG
})

// Initialize the application's DOM fields when launched
init()

// Add listeners for the differents buttons and switch on the app's page
switchServer.addEventListener('click', startAndStopServer)
buttonClearConnections.addEventListener('click', clearConnections)
buttonClearLogs.addEventListener('click', clearLogs)
buttonTest.addEventListener('click', runTest)
hideWindowButton.addEventListener('click', hideWindow)
