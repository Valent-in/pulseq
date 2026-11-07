"use strict";

function WamInit() {
	let hostGroupId;
	let errorIsShown = false;

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

	class SourceNode extends Tone.ToneAudioNode {
		constructor(nativeNode) {
			super();
			this._nativeNode = nativeNode;
			this._outGain = new Tone.getContext().rawContext.createGain();
			this._source = Tone.getContext().rawContext.createConstantSource();
			this._source.offset.value = 0;
			this._source.start();

			this._source.connect(this._outGain);
			nativeNode.connect(this._outGain._nativeAudioNode);

			this.input = null;
			this.output = this._outGain;
		}

		destroy() {
			this._nativeNode.disconnect();
			this._source.disconnect();
			this._outGain.disconnect();
		}
	}

	const wamObjectProto = {
		destroy: function () {
			console.log("[WAM] Plugin destroy");

			if (this.node) {
				this.node.destroy();
			}

			if (this.wamGui) {
				this.wamGui.remove();
				this.wamInstance.destroyGui(this.wamGui);
			}

			if (this.wamInstance) {
				this.wamInstance.audioNode.destroy();
			}
		}
	}

	this.loadModule = async function (name, suppressErrors, isAudioSource) {
		let wamInstance;
		let wamGui;

		const pathToWam = "../wam-plugins/" + name + "/index.js";
		let audioContext = Tone.getContext().rawContext._nativeAudioContext;
		if (!audioContext)
			audioContext = Tone.getContext().rawContext._nativeContext;

		if (!hostGroupId) {
			try {
				let initializeWamHost = await import("../wam-plugins/utils/sdk/src/initializeWamHost.js");
				[hostGroupId] = await initializeWamHost.default(audioContext);
				console.log("[WAM] Host initialized");
			} catch (error) {
				if (!errorIsShown || !suppressErrors)
					showAlert("Can not load plugins - WAM host initialization error\n" + error.message);

				errorIsShown = true;
				console.error(error.message);
				return null;
			}
		}

		try {
			const { default: WAM } = await import(pathToWam);
			wamInstance = await WAM.createInstance(hostGroupId, audioContext);
			wamGui = await wamInstance.createGui();
		} catch (error) {
			showAlert("Can not load plugin " + name + "\n" + error.message);
			console.error(error.message);
			return null;
		}

		let module = Object.create(wamObjectProto)
		module.wamInstance = wamInstance;
		module.wamGui = wamGui;
		if (isAudioSource)
			module.node = new SourceNode(wamInstance.audioNode);
		else
			module.node = new BridgeNode(wamInstance.audioNode);

		console.log("[WAM] Plugin loaded", name);
		return module;
	}
}