"use strict"

{
	// Switch tabs
	let tabs = document.querySelectorAll(".js-tab");
	let containers = document.querySelectorAll(".js-view-container");
	window.g_activeTab = "arrange";

	window.g_switchTab = function (tabName) {
		let tabId = tabName + "-tab";
		let viewId = tabName + "-view";

		let cTab = document.getElementById(tabId);
		let cView = document.getElementById(viewId);

		if (!cTab || !cView)
			return;

		window.g_activeTab = tabName;

		containers.forEach(e => {
			e.classList.add("view--hidden")
		});

		tabs.forEach(e => {
			e.classList.remove("tab--active")
		});

		cTab.classList.add("tab--active");
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
	// Fullscreen mode
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
	// Fit footer height
	let patternFooter = document.getElementById("pattern-footer");
	let patternContainer = document.getElementById("pattern-container");
	createHeightObserver(patternFooter, (h) => {
		patternContainer.style.marginBottom = h + "px";
	});

	let arrangeFooter = document.getElementById("arrange-footer");
	let arrangeContainer = document.getElementById("arrange-container");
	createHeightObserver(arrangeFooter, (h) => {
		arrangeContainer.style.marginBottom = h + "px";
	});

	let synthFooter = document.getElementById("synth-footer");
	let synthContainer = document.getElementById("synth-main");
	createHeightObserver(synthFooter, (h) => {
		synthContainer.style.marginBottom = h + "px";
	});

	function createHeightObserver(target, callback) {
		if (!window.ResizeObserver) {
			console.log("ResizeObserver not supported");
			return;
		}

		let observer = new ResizeObserver((list) => {
			for (let item of list) {
				callback(item.target.offsetHeight);
			}
		});

		observer.observe(target);
	}
}

{
	// Tab-trap
	let areas = document.querySelectorAll(".focus-lock-area, .modal-container");

	areas.forEach((area) => {
		let elements = area.querySelectorAll("input, button, a, textarea");

		if (elements.length <= 0)
			return;

		let first = elements[0];
		let last = elements[elements.length - 1];

		let trap = document.createElement("DIV");
		trap.setAttribute("tabindex", 0);
		trap.classList.add("tab-trap");
		area.before(trap);

		trap.addEventListener("keydown", (event) => {
			if (event.key == "Tab") {
				event.preventDefault();
			}
		});

		first.addEventListener("keydown", (event) => {
			if (event.key == "Tab" && event.shiftKey) {
				last.focus();
				event.preventDefault();
			}
		});

		last.addEventListener("keydown", (event) => {
			if (event.key == "Tab" && !event.shiftKey) {
				first.focus();
				event.preventDefault();
			}
		});
	});
}