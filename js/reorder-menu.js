"use strict";

function ReorderMenu(songObj, onSongChangeCallback) {
	let patternListContainer = document.getElementById("pattern-list-container");
	let sortMenuIsShown = false;
	let patternEntries = [];
	let dragPatternFrom;

	this.showMenu = () => {
		if (songObj.patterns.length > 1) {
			rebuildPatternList();
			hideModal("column-modal-menu");
			showModal("pattern-reorder-modal-menu");
			sortMenuIsShown = true;
		} else {
			showToast("Can not order single pattern");
		}
	}

	patternListContainer.ondragstart = () => {
		patternEntries.forEach((e) => e.classList.add("drop-hint"));
	}

	patternListContainer.ondragend = dragend;
	patternListContainer.ontouchend = dragend;
	patternListContainer.ontouchcancel = dragend;

	function dragend() {
		patternEntries.forEach((e) => e.classList.remove("drop-hint"));
		patternEntries.forEach((e) => e.classList.remove("drop-target"));
		patternEntries.forEach((e) => e.classList.remove("dragged"));
	}

	document.getElementById("button-sort-patterns-asc").onclick = () => {
		showConfirm("Sort patterns by name in ascending order?", (isOk) => {
			if (!isOk)
				return;
			songObj.sortPatternsByName(false);
			rebuildPatternList();
		});
	}

	document.getElementById("button-sort-patterns-desc").onclick = () => {
		showConfirm("Sort patterns by name in descending order?", (isOk) => {
			if (!isOk)
				return;
			songObj.sortPatternsByName(true);
			rebuildPatternList();
		});
	}

	document.getElementById("button-reorder-menu-close").onclick = () => {
		hideModal("pattern-reorder-modal-menu");
		document.getElementById("pattern-list-container").innerHTML = "";
		sortMenuIsShown = false;

		setTimeout(() => {
			onSongChangeCallback(false);
		}, 0);
	}

	let reorderMenu = document.getElementById("pattern-reorder-modal-menu");
	window.addEventListener("keyup", (event) => {
		if (event.key != "Escape")
			return;

		if (sortMenuIsShown) {
			setTimeout(() => {
				onSongChangeCallback(false);

				if (reorderMenu.classList.contains("nodisplay"))
					sortMenuIsShown = false;
			}, 0);
		}
	});

	function rebuildPatternList() {
		patternListContainer.innerHTML = "";
		patternEntries.length = 0;

		for (let i = 0; i < songObj.patterns.length; i++) {
			let entry = document.createElement("DIV");
			entry.classList.add("pattern-list-entry");
			entry.draggable = true;
			entry.dataset.index = i;

			entry.ondragstart = () => {
				entry.classList.add("dragged");
				dragPatternFrom = entry.dataset.index;
			}

			entry.ondragenter = () => {
				patternEntries.forEach(e => e.classList.remove("drop-target"));
				entry.classList.add("drop-target");
			}

			// not working if mouse moves fast
			entry.ondragleave = (event) => {
				entry.classList.remove("drop-target");
			}

			entry.ondragover = (event) => {
				event.preventDefault();
			}

			entry.ondrop = (event) => {
				event.preventDefault();
				songObj.movePattern(Number(dragPatternFrom), Number(entry.dataset.index));
				rebuildPatternList();
			}

			let name = document.createElement("SPAN");
			name.appendChild(document.createTextNode(songObj.patterns[i].name));
			entry.appendChild(name);
			name.style.color = DEFAULT_PARAMS.colorSet[songObj.patterns[i].colorIndex];

			let downBtn = document.createElement("BUTTON");
			downBtn.classList.add("button--arrow-down")
			downBtn.onclick = () => {
				songObj.movePattern(i, i + 1);
				rebuildPatternList();
			}

			let upBtn = document.createElement("BUTTON");
			upBtn.classList.add("button--arrow-up");
			upBtn.onclick = () => {
				songObj.movePattern(i, i - 1);
				rebuildPatternList();
			}

			entry.appendChild(downBtn);
			entry.appendChild(upBtn);
			patternListContainer.appendChild(entry);
			patternEntries.push(entry);
		}
	}
}