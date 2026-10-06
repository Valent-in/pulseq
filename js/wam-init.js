"use strict";

function WamInit(songObj) {
	this.plugins = [];

	let hostGroupId;
	let selectedSlot = 0;
	let errorIsShown = false;

	let pluginMounts = document.querySelectorAll(".js-plugin-mount");
	let pluginSelectors = document.querySelectorAll(".js-button-effect-select");

	class BridgeNode extends Tone.ToneAudioNode {
		constructor(nativeNode) {
			super();
			this._nativeNode = nativeNode;
			this._inGain = new Tone.getContext().rawContext.createGain();
			this._outGain = new Tone.getContext().rawContext.createGain();
			this._bridgeGain = Tone.getContext().rawContext.createGain();
			this._bridgeGain.gain.value = 0;

			this._inGain.connect(this._bridgeGain);
			this._bridgeGain.connect(this._outGain);
			this._inGain._nativeAudioNode.connect(nativeNode);
			nativeNode.connect(this._outGain._nativeAudioNode);

			this.input = this._inGain;
			this.output = this._outGain;
		}

		destroy() {
			this._nativeNode.disconnect();
			this._inGain.disconnect();
			this._bridgeGain.disconnect();
			this._outGain.disconnect();
		}
	}

	document.getElementById("menu-plugin-list-container").onclick = (event) => {
		if (!event.target.classList.contains("js-select-list-entry"))
			return;

		// delegated to external object which handles audionode graph
		songObj.unloadPlugin(selectedSlot);

		if (event.target.dataset.name)
			songObj.addPlugin(event.target.dataset.name, selectedSlot);
		else
			songObj.removePluginState(selectedSlot);

		hideModal("plugin-select-modal-menu");
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

	fetch("wam-plugins/plugins.json").then(response => response.json()).then(data => {
		buildPluginList(data);
	}).catch(() => {
		console.log("[WAM] Can not fetch plugin list");
	});

	this.loadModule = async function (name, index = 0, showNameOnError) {
		let wamInstance;
		let wamGui;
		let mount = pluginMounts[index];
		mount.textContent = "Loading...";
		pluginSelectors[index].disabled = true;

		const pathToWam = "../wam-plugins/" + name + "/index.js";
		const audioContext = Tone.getContext().rawContext._nativeAudioContext;

		if (!hostGroupId) {
			try {
				let initializeWamHost = await import("../wam-plugins/utils/sdk/src/initializeWamHost.js");
				[hostGroupId] = await initializeWamHost.default(audioContext);
				console.log("[WAM] Host initialized");
			} catch (error) {
				if (!errorIsShown || !showNameOnError)
					showAlert("Can not load plugins - WAM host initialization error\n" + error.message);

				errorIsShown = true;
				setUiErrState();
				console.error(error.message);
				return;
			}
		}

		try {
			const { default: WAM } = await import(pathToWam);
			wamInstance = await WAM.createInstance(hostGroupId, audioContext);
			wamGui = await wamInstance.createGui();
		} catch (error) {
			showAlert("Can not load plugin " + name + "\n" + error.message);
			setUiErrState();
			console.error(error.message);
			return;
		}

		mount.innerHTML = "";
		mount.appendChild(wamGui);
		updatePluginSelector(index, name);
		pluginSelectors[index].disabled = false;

		this.plugins[index] = { wamInstance: wamInstance, wamGui: wamGui };
		this.plugins[index].node = new BridgeNode(wamInstance.audioNode);

		console.log("[WAM] Plugin loaded", name);

		function setUiErrState() {
			if (showNameOnError) {
				updatePluginSelector(index, name);
				mount.textContent = "Error";
			} else {
				mount.innerHTML = "";
			}
			pluginSelectors[index].disabled = false;
		}
	}

	this.destroyModule = function (index = 0) {
		updatePluginSelector(selectedSlot);

		if (!this.plugins[index]) {
			pluginMounts[index].innerHTML = ""; // remove "Error" message
			console.log("[WAM] (Destroy) skipped index", index);
			return;
		}

		if (this.plugins[index].node) {
			this.plugins[index].node.destroy();
		}

		if (this.plugins[index].wamGui) {
			this.plugins[index].wamGui.remove();
			this.plugins[index].wamInstance.destroyGui(this.plugins[index].wamGui);
		}

		if (this.plugins[index].wamInstance) {
			this.plugins[index].wamInstance.audioNode.destroy();
		}

		this.plugins[index] = null;
	}

	function updatePluginSelector(index, name) {
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

		let noneEntry = document.createElement("DIV");
		noneEntry.classList.add("js-select-list-entry");
		noneEntry.classList.add("select-list-entry");
		noneEntry.classList.add("select-list-entry--none");

		noneEntry.appendChild(document.createTextNode("[none]"));
		listContainer.appendChild(noneEntry);

		for (let i = 0; i < list.length; i++) {
			let entry = document.createElement("DIV");
			entry.classList.add("js-select-list-entry");
			entry.classList.add("select-list-entry");

			entry.dataset.name = list[i].name;
			entry.appendChild(document.createTextNode(list[i].name));
			listContainer.appendChild(entry);
		}
	}
}