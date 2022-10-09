"use strict"

{
	// showAlert/showConfirm/showPrompt to replace alert/confirm/prompt with custom dialogs

	let alertDialog = document.getElementById("modal-alert");
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

	okButton.onclick = () => {
		if (dialogType == "confirm" && typeof callbackFunc == "function")
			callbackFunc(true);

		if (dialogType.indexOf("prompt") == 0 && typeof callbackFunc == "function")
			callbackFunc(inputField.value);

		hideDialog();
	};

	cancelButton.onclick = () => {
		if (dialogType == "confirm" && typeof callbackFunc == "function")
			callbackFunc(false);

		if (dialogType.indexOf("prompt") == 0 && typeof callbackFunc == "function")
			callbackFunc(null);

		hideDialog();
	};

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
				inputFieldArea.classList.add("nodisplay");
				break;

			case "confirm":
				cancelButton.classList.remove("nodisplay");
				inputFieldArea.classList.add("nodisplay");
				break;

			case "prompt":
				cancelButton.classList.remove("nodisplay");
				inputFieldArea.classList.remove("nodisplay");
				inputField.type = "text";
				break;

			case "promptNumber":
				cancelButton.classList.remove("nodisplay");
				inputFieldArea.classList.remove("nodisplay");
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
		alertDialog.classList.add("nodisplay");
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

	toastBox.addEventListener("click", () => {
		toastAlert.classList.add("nodisplay");
	});

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