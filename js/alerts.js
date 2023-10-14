"use strict";

{
	// Close dialogs on Escape key
	window.addEventListener("keyup", (event) => {
		if (event.key != "Escape")
			return;

		if (discardAlert())
			return;

		let dialogs = document.querySelectorAll(".modal-container:not(.nodisplay)");
		if (dialogs.length <= 0 || dialogs[dialogs.length - 1].classList.contains("js-noskip"))
			return;

		hideModal(dialogs[dialogs.length - 1].id);
	});
}

{
	// Dialog helper
	window.showModal = function (elementId) {
		let element = document.getElementById(elementId);
		if (!element)
			return;

		element.classList.remove("nodisplay");
		requestFocus(element);
	}

	window.hideModal = function (elementId) {
		let element = document.getElementById(elementId);
		if (!element)
			return;

		element.classList.add("nodisplay");

		let prev = document.querySelectorAll(".modal-container:not(.nodisplay)");

		if (prev.length > 0)
			requestFocus(prev[0]);
		else
			document.getElementById("button-settings-open").focus();
	}

	function requestFocus(element) {
		let focus = element.querySelectorAll(".js-request-focus:not(:disabled)");

		if (focus.length > 0) {
			focus[0].focus();
		} else {
			let focusAlt = element.querySelectorAll("button");
			if (focusAlt.length > 0)
				focusAlt[focusAlt.length - 1].focus();
		}
	}
}

{
	// showAlert/showConfirm/showPrompt to replace alert/confirm/prompt with custom dialogs
	let alertMessage = document.getElementById("modal-alert-message");
	let okButton = document.getElementById("button-alert-ok");
	let cancelButton = document.getElementById("button-alert-cancel");
	let inputField = document.getElementById("input-modal-alert");
	let inputFieldArea = document.getElementById("input-area-modal-alert");

	let dialogTypes = [];
	let messages = [];
	let defaults = [];
	let callbacks = [];

	let dialogType = "alert";
	let callbackFunc = null;

	let isShow = false;

	cancelButton.onclick = () => {
		discardAlert();
	};

	okButton.onclick = () => {
		confirmAlert();
	};

	inputFieldArea.addEventListener("keyup", (event) => {
		if (event.key == "Enter") {
			confirmAlert();
		}
	});

	window.discardAlert = function () {
		if (!isShow)
			return false;

		if (dialogType == "confirm" && typeof callbackFunc == "function")
			callbackFunc(false);

		if (dialogType.indexOf("prompt") == 0 && typeof callbackFunc == "function")
			callbackFunc(null);

		hideDialog();
		return true;
	}

	window.showAlert = function (messageText) {
		showDialog("alert", messageText, null, null);
	}

	window.showConfirm = function (messageText, callback) {
		showDialog("confirm", messageText, callback, null);
	}

	window.showPrompt = function (messageText, callback, inputText, type) {
		if (type == "number")
			showDialog("promptNumber", messageText, callback, inputText);
		else
			showDialog("prompt", messageText, callback, inputText);
	}

	function confirmAlert() {
		if (dialogType == "confirm" && typeof callbackFunc == "function")
			callbackFunc(true);

		if (dialogType.indexOf("prompt") == 0 && typeof callbackFunc == "function")
			callbackFunc(inputField.value);

		hideDialog();
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
			showModal("modal-alert");
			isShow = true;
		}
	}

	function showFieldsByType(type) {
		switch (type) {
			case "alert":
				cancelButton.classList.add("nodisplay");
				inputFieldArea.classList.add("nodisplay");
				inputField.disabled = true;
				break;

			case "confirm":
				cancelButton.classList.remove("nodisplay");
				inputFieldArea.classList.add("nodisplay");
				inputField.disabled = true;
				break;

			case "prompt":
				cancelButton.classList.remove("nodisplay");
				inputFieldArea.classList.remove("nodisplay");
				inputField.disabled = false;
				inputField.type = "text";
				break;

			case "promptNumber":
				cancelButton.classList.remove("nodisplay");
				inputFieldArea.classList.remove("nodisplay");
				inputField.disabled = false;
				inputField.type = "number";
				break;
		}
	}

	function setDialogText(messageText, inputText) {
		alertMessage.innerHTML = "";

		let lines = String(messageText).split("\n");
		for (let i = 0; i < lines.length; i++) {
			alertMessage.appendChild(document.createTextNode(lines[i]));
			if (i < lines.length - 1)
				alertMessage.appendChild(document.createElement("BR"));
		}

		inputField.value = inputText;
	}

	function hideDialog() {
		hideModal("modal-alert");
		isShow = false;

		if (messages.length > 0) {
			showDialog(dialogTypes.shift(), messages.shift(), callbacks.shift(), defaults.shift());
		}
	}
}

{
	let toastAlert = document.getElementById("toast-alert");
	let toastBox = document.getElementById("toast-box");
	let timeout = null

	window.showToast = function (text) {
		toastBox.innerHTML = "";
		toastBox.appendChild(document.createTextNode(text));
		toastAlert.classList.remove("nodisplay");

		clearTimeout(timeout);
		timeout = setTimeout(() => {
			toastAlert.classList.add("nodisplay");
			timeout = null;
		}, 2000);
	}
}