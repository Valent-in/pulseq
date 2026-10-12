"use strict";

function WamUi(songObj) {
	let selectedSlot = 0;
	let pluginMounts = document.querySelectorAll(".js-plugin-mount");
	let pluginSelectors = document.querySelectorAll(".js-button-effect-select");

	document.getElementById("menu-plugin-list-container").onclick = (event) => {
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

		hideModal("plugin-select-modal-menu");
	}

	document.getElementById("menu-iplugin-list-container").onclick = (event) => {
		if (!event.target.classList.contains("js-select-list-entry"))
			return;

		//songObj.unloadFxPlugin(selectedSlot);
		//let mount = pluginMounts[selectedSlot];

		if (event.target.dataset.name) {
			//pluginSelectors[selectedSlot].disabled = true;
			//mount.innerHTML = "Loading...";
			//songObj.loadFxPlugin(event.target.dataset.name, selectedSlot);
			songObj.loadSynthPlugin(event.target.dataset.name)
		} else {
			songObj.resetCurrentSynth();
		}

		hideModal("iplugin-select-modal-menu");
	}

	for (let i = 0; i < 4; i++) {
		pluginSelectors[i].onclick = () => {
			selectedSlot = i;
			showModal("plugin-select-modal-menu");
		}
	}

	document.getElementById("button-plugin-select-close").onclick = () => {
		hideModal("plugin-select-modal-menu");
	};

	document.getElementById("button-set-plugin").onclick = () => {
		showModal("iplugin-select-modal-menu");
	};

	document.getElementById("button-iplugin-select-close").onclick = () => {
		hideModal("iplugin-select-modal-menu");
	};

	fetch("wam-plugins/plugins.json").then(response => response.json()).then(data => {
		buildPluginList(data);
	}).catch(() => {
		console.log("[WAM] Can not fetch plugin list");
	});

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

	function buildPluginList(list) {
		let listContainer = document.getElementById("menu-plugin-list-container");
		listContainer.innerHTML = "";
		let ilistContainer = document.getElementById("menu-iplugin-list-container");
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

			if (i < list.length - 4)
				listContainer.appendChild(entry);
			else
				ilistContainer.appendChild(entry);
		}
	}
}