"use strict";

function WamUi(songObj) {
	let selectedSlot = 0;
	let pluginMounts = document.querySelectorAll(".js-plugin-mount");
	let pluginSelectors = document.querySelectorAll(".js-button-effect-select");

	fetch("wam-plugins/plugins.json").then(response => response.json()).then(data => {
		buildPluginList(data);
	}).catch(() => {
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
			songObj.loadFxPlugin(event.target.dataset.name, selectedSlot);
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
				this.showIPluginName(event.target.dataset.name)
				songObj.loadSynthPlugin(event.target.dataset.name);
			} else {
				songObj.resetCurrentSynth();
			}

			hideModal("synth-modal-menu");
		});

		hideModal("i-plugin-select-modal-menu");
	}

	for (let i = 0; i < 4; i++) {
		pluginSelectors[i].onclick = () => {
			selectedSlot = i;
			showModal("fx-plugin-select-modal-menu");
		}
	}

	document.getElementById("button-fx-plugin-select-close").onclick = () => {
		hideModal("fx-plugin-select-modal-menu");
	};

	document.getElementById("button-fx-plugin-menu-open").onclick = () => {
		showModal("fx-plugin-modal-menu");
	};

	document.getElementById("button-fx-plugin-menu-close").onclick = () => {
		console.log("Storing plugin states...");
		songObj.storePluginStates();
		hideModal("fx-plugin-modal-menu");
	};

	document.getElementById("button-i-plugin-select").addEventListener("click", () => {
		// Expect another listener (switch to selected synth from list)
		showModal("i-plugin-select-modal-menu");
	});

	document.getElementById("button-i-plugin-select-close").onclick = () => {
		hideModal("i-plugin-select-modal-menu");
	};

	document.getElementById("button-i-plugin-menu-open").onclick = () => {
		showModal("i-plugin-modal-menu");
		let name = songObj.synthParams[songObj.currentSynthIndex].pluginState.name;
		this.showIPluginName(name);
		let ui = getCurrentIPluginUi();
		if (ui)
			ui.parentElement.classList.remove("nodisplay");
		else
			this.showIPluginError(true);
	};

	document.getElementById("button-i-plugin-menu-close").onclick = () => {
		hideModal("i-plugin-modal-menu");
		let ui = getCurrentIPluginUi();
		if (ui)
			ui.parentElement.classList.add("nodisplay");
		songObj.storeCurrentInstrumentState();
		this.showIPluginError(false);
		this.showIPluginLoading(false);
	};

	function getCurrentIPluginUi() {
		let plugin = songObj.getCurrentSynth().plugin;
		return plugin ? plugin.wamGui : null;
	}

	this.appendFxGui = function (wamGui, index, name) {
		let mount = pluginMounts[index];
		mount.innerHTML = "";
		mount.appendChild(wamGui);
		updateFxPluginSelector(index, name);
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
		if (!wamGui)
			return;

		let container = document.getElementById("i-plugin-outer-container");
		let inner = document.createElement("DIV");
		inner.appendChild(wamGui);

		if (isHide)
			inner.classList.add("nodisplay");

		container.appendChild(inner);
	}

	this.showIPluginName = function (name) {
		let nameDiv = document.getElementById("i-plugin-name");
		nameDiv.textContent = "Plugin - " + name;
	}

	this.showIPluginError = function (isShow) {
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
		let listContainer = document.getElementById("fx-plugin-list-container");
		listContainer.innerHTML = "";
		let ilistContainer = document.getElementById("i-plugin-list-container");
		ilistContainer.innerHTML = "";

		function makeNoneEntry() {
			let noneEntry = document.createElement("DIV");
			noneEntry.classList.add("js-select-list-entry");
			noneEntry.classList.add("select-list-entry");
			noneEntry.classList.add("select-list-entry--none");
			noneEntry.appendChild(document.createTextNode("[none]"));
			return noneEntry;
		}

		listContainer.appendChild(makeNoneEntry());
		ilistContainer.appendChild(makeNoneEntry());

		for (let i = 0; i < list.length; i++) {
			let entry = document.createElement("DIV");
			entry.classList.add("js-select-list-entry");
			entry.classList.add("select-list-entry");

			entry.dataset.name = list[i].name;
			entry.appendChild(document.createTextNode(list[i].name));

			if (i < list.length - 7)
				listContainer.appendChild(entry);
			else
				ilistContainer.appendChild(entry);
		}
	}
}