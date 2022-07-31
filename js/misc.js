"use strict"

{
	let tabs = document.querySelectorAll(".js-tab");
	let containers = document.querySelectorAll(".js-view-container");

	window.g_switchTab = function (tabName) {
		let tabId = tabName + "-tab";
		let viewId = tabName + "-view";

		containers.forEach(e => {
			e.classList.add("view--hidden")
		})

		tabs.forEach(e => {
			e.classList.remove("tab--active")
		})

		let cTab = document.getElementById(tabId);
		cTab.classList.add("tab--active");

		let cView = document.getElementById(viewId);
		cView.classList.remove("view--hidden");
	}

	tabs.forEach((elem) => {
		elem.addEventListener("click", (event) => {
			let tabName = event.target.id.replace("-tab", "");
			g_switchTab(tabName);
		});
	});
}

{
	document.getElementById("button-fullscreen").addEventListener("click", () => {
		if (document.fullscreenElement ||
			document.webkitFullscreenElement ||
			document.msFullscreenElement) {

			if (document.exitFullscreen)
				document.exitFullscreen();
			else if (document.webkitExitFullscreen)
				document.webkitExitFullscreen();
			else if (document.msExitFullscreen)
				document.msExitFullscreen();

		} else {
			let elem = document.documentElement;

			if (elem.requestFullscreen)
				elem.requestFullscreen();
			else if (elem.webkitRequestFullscreen)
				elem.webkitRequestFullscreen();
			else if (elem.msRequestFullscreen)
				elem.msRequestFullscreen();
		}
	});
}

{
	// showAlert/showConfirm/showPrompt to replace alert/confirm/prompt with custom dialogs

	let alertDialog = document.getElementById("modal-alert");
	let alertMessageSpan = document.getElementById("modal-alert-message");
	let okButton = document.getElementById("button-alert-ok");
	let cancelButton = document.getElementById("button-alert-cancel");
	let textField = document.getElementById("input-modal-alert");
	let textFieldArea = document.getElementById("input-area-modal-alert");

	let dialogTypes = [];
	let messages = [];
	let defaults = [];
	let callbacks = [];

	let dialogType = "alert";
	let callbackFunc = null;

	let isShow = false;

	okButton.onclick = () => {
		if (dialogType == "confirm" && typeof callbackFunc == "function")
			callbackFunc(true);

		if (dialogType == "prompt" && typeof callbackFunc == "function")
			callbackFunc(textField.value);

		hideDialog();
	};

	cancelButton.onclick = () => {
		if (dialogType == "confirm" && typeof callbackFunc == "function")
			callbackFunc(false);

		if (dialogType == "prompt" && typeof callbackFunc == "function")
			callbackFunc(null);

		hideDialog();
	};

	window.g_showAlert = function (messageText) {
		showDialog("alert", messageText, null, null);
	}

	window.g_showConfirm = function (messageText, callback) {
		showDialog("confirm", messageText, callback, null);
	}

	window.g_showPrompt = function (messageText, callback, inputText) {
		showDialog("prompt", messageText, callback, inputText);
	}

	function showDialog(type, alertText, callback, inputText) {
		if (isShow) {
			messages.push(alertText);
			callbacks.push(callback);
			defaults.push(inputText);
			dialogTypes.push(type);
		} else {
			showFieldsByType(type);
			setDialogText(alertText || "", inputText || "");
			callbackFunc = callback;
			dialogType = type;
			alertDialog.classList.remove("nodisplay");
			isShow = true;
		}
	}

	function showFieldsByType(type) {
		switch (type) {
			case "alert":
				cancelButton.classList.add("nodisplay");
				textFieldArea.classList.add("nodisplay");
				break;

			case "confirm":
				cancelButton.classList.remove("nodisplay");
				textFieldArea.classList.add("nodisplay");
				break;

			case "prompt":
				cancelButton.classList.remove("nodisplay");
				textFieldArea.classList.remove("nodisplay");
				break;
		}
	}

	function setDialogText(messageText, inputText) {
		alertMessageSpan.innerHTML = "";
		alertMessageSpan.appendChild(document.createTextNode(messageText));
		textField.value = inputText;
	}

	function hideDialog() {
		alertDialog.classList.add("nodisplay");
		isShow = false;

		if (messages.length > 0) {
			showDialog(dialogTypes.shift(), messages.shift(), callbacks.shift(), defaults.shift());
		}
	}
}