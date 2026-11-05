"use strict";

function WamUi(songObj) {
	let selectedSlot = 0;
	let pluginMounts = document.querySelectorAll(".js-plugin-mount");
	let pluginSelectors = document.querySelectorAll(".js-button-effect-select");
	let fxDialogIsShown = false;
	let iDialogIsShown = false;

	window.addEventListener("keyup", (event) => {
		if (event.key != "Escape")
			return;

		if (fxDialogIsShown)
			closeFxPluginDialog();

		if (iDialogIsShown)
			closeIPluginDialog();
	});

	fetch("wam-plugins/plugins.json").then(response => response.json()).then(data => {
		buildPluginList(data);
	}).catch(() => {
		buildPluginList([]);
		console.log("[WAM] Can not fetch plugin list");
	});

	document.getElementById("fx-plugin-list-container").onclick = (event) => {
		if (!event.target.classList.contains("js-select-list-entry"))
			return;

		songObj.unloadFxPlugin(selectedSlot);
		let mount = pluginMounts[selectedSlot];

		if (event.target.dataset.name) {
			pluginSelectors[selectedSlot].disabled = true;
			mount.innerHTML = "Loading...";
			songObj.loadFxPlugin(event.target.dataset.name, event.target.dataset.title, selectedSlot);
		} else {
			songObj.removeFxPluginState(selectedSlot);
			updateFxPluginSelector(selectedSlot, null);
			pluginSelectors[selectedSlot].disabled = false;
			mount.innerHTML = "";
		}

		hideModal("fx-plugin-select-modal-menu");
	}

	document.getElementById("i-plugin-list-container").onclick = (event) => {
		if (!event.target.classList.contains("js-select-list-entry"))
			return;

		showConfirm("Overwrite selected synth?", (isOk) => {
			if (!isOk)
				return;

			if (event.target.dataset.name) {
				showModal("i-plugin-modal-menu");
				iDialogIsShown = true;
				this.showIPluginLoading(true);
				this.showIPluginTitle(event.target.dataset.title)
				songObj.loadSynthPlugin(event.target.dataset.name, event.target.dataset.title);
			} else {
				songObj.resetCurrentSynth();
			}

			hideModal("synth-modal-menu");
		});

		hideModal("i-plugin-select-modal-menu");
	}

	for (let i = 0; i < pluginSelectors.length; i++) {
		pluginSelectors[i].onclick = () => {
			selectedSlot = i;
			showModal("fx-plugin-select-modal-menu");
		}
	}

	document.getElementById("button-fx-plugin-select-close").onclick = () => {
		hideModal("fx-plugin-select-modal-menu");
	}

	document.getElementById("button-fx-plugin-menu-open").onclick = () => {
		showModal("fx-plugin-modal-menu");
		fxDialogIsShown = true;
	}

	document.getElementById("button-fx-plugin-menu-close").onclick = () => {
		closeFxPluginDialog();
	}

	const closeFxPluginDialog = () => {
		songObj.storePluginStates();
		hideModal("fx-plugin-modal-menu");
		fxDialogIsShown = false;
	}

	document.getElementById("button-i-plugin-select").addEventListener("click", () => {
		// Expect another listener (switch to selected synth from list)
		showModal("i-plugin-select-modal-menu");
	});

	document.getElementById("button-i-plugin-select-close").onclick = () => {
		hideModal("i-plugin-select-modal-menu");
	}

	document.getElementById("button-i-plugin-menu-open").onclick = () => {
		showModal("i-plugin-modal-menu");
		iDialogIsShown = true;
		this.showIPluginTitle(songObj.synthParams[songObj.currentSynthIndex].pluginState.title);
		let ui = getCurrentIPluginUi();
		if (ui)
			ui.parentElement.classList.remove("nodisplay");
		else
			this.showIPluginError(true);
	}

	document.getElementById("button-i-plugin-menu-close").onclick = () => {
		closeIPluginDialog();
	}

	const closeIPluginDialog = () => {
		hideModal("i-plugin-modal-menu");
		iDialogIsShown = false;
		let ui = getCurrentIPluginUi();
		if (ui)
			ui.parentElement.classList.add("nodisplay");
		songObj.storeCurrentInstrumentState();
		this.showIPluginError(false);
		this.showIPluginLoading(false);
	}

	function getCurrentIPluginUi() {
		let plugin = songObj.getCurrentSynth().plugin;
		return plugin ? plugin.wamGui : null;
	}

	this.appendFxGui = function (wamGui, index, name) {
		let mount = pluginMounts[index];
		mount.innerHTML = "";
		mount.appendChild(wamGui);
		pluginSelectors[index].disabled = false;
		updateFxPluginSelector(index, name)
	}

	this.showFxSlotError = function (index, name) {
		updateFxPluginSelector(index, name);
		let mount = pluginMounts[index];
		mount.textContent = "Error";
		pluginSelectors[index].disabled = false;
	}

	this.resetFxSlotState = function (index) {
		let mount = pluginMounts[index];
		mount.innerHTML = "";
		updateFxPluginSelector(selectedSlot, null);
		pluginSelectors[index].disabled = false;
	}

	function updateFxPluginSelector(index, name) {
		if (name) {
			pluginSelectors[index].textContent = name;
			pluginSelectors[index].classList.add("button-select");
		} else {
			pluginSelectors[index].textContent = "+";
			pluginSelectors[index].classList.remove("button-select");
		}
	}

	this.appendIPluginGui = function (wamGui, isHide) {
		this.showIPluginLoading(false);
		if (!wamGui)
			return;

		let container = document.getElementById("i-plugin-outer-container");
		let inner = document.createElement("DIV");
		inner.appendChild(wamGui);

		if (isHide)
			inner.classList.add("nodisplay");

		container.appendChild(inner);
	}

	this.showIPluginTitle = function (title) {
		let nameDiv = document.getElementById("i-plugin-name");
		nameDiv.textContent = "Plugin - " + title;
	}

	this.showIPluginError = function (isShow) {
		this.showIPluginLoading(false);
		let msg = document.getElementById("i-plugin-error");
		if (isShow)
			msg.classList.remove("nodisplay");
		else
			msg.classList.add("nodisplay");
	}

	this.showIPluginLoading = function (isShow) {
		let msg = document.getElementById("i-plugin-loading");
		if (isShow)
			msg.classList.remove("nodisplay");
		else
			msg.classList.add("nodisplay");
	}

	this.showLoadingIndicator = function (isLoading) {
		let loading = document.getElementById("loading-plugins-indicator");
		if (isLoading)
			loading.classList.add("loading-ongoing");
		else
			loading.classList.remove("loading-ongoing");
	}

	function buildPluginList(list) {
		let fxListContainer = document.getElementById("fx-plugin-list-container");
		fxListContainer.innerHTML = "";
		let iListContainer = document.getElementById("i-plugin-list-container");
		iListContainer.innerHTML = "";

		function makeNoneEntry() {
			let noneEntry = document.createElement("DIV");
			noneEntry.classList.add("js-select-list-entry");
			noneEntry.classList.add("select-list-entry");
			noneEntry.classList.add("select-list-entry--none");
			noneEntry.appendChild(document.createTextNode("[none]"));
			return noneEntry;
		}

		fxListContainer.appendChild(makeNoneEntry());
		iListContainer.appendChild(makeNoneEntry());

		for (let i = 0; i < list.length; i++) {
			let entry = document.createElement("DIV");
			entry.classList.add("js-select-list-entry");
			entry.classList.add("select-list-entry");

			entry.dataset.name = list[i].name;
			let title = list[i].title || list[i].name;
			entry.dataset.title = title;
			entry.appendChild(document.createTextNode(title));

			if (list[i].type == "instrument")
				iListContainer.appendChild(entry);
			else
				fxListContainer.appendChild(entry);
		}
	}
}