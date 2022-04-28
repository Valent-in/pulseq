"use strict"

function Arrange(songObj, showSequenceCallback, onPatternSelectCallback) {
	let arrange = document.getElementById("arrange-main");
	let table = document.createElement("TABLE");
	let sideCells = [];


	let th = document.createElement("TR");
	for (let j = 0; j < 64; j++) {
		let td = document.createElement("TD");

		if (j == 0) {
			td.id = "arr_corner";
		} else {
			if ((j - 1) % 4 == 0)
				td.appendChild(document.createTextNode(j));

			td.id = "arr_col-" + (j - 1) + "_header";
			td.classList.add("arrange-header");
			sideCells.push(td);
		}

		th.appendChild(td);
	}
	table.appendChild(th);


	for (let i = 0; i < 16; i++) {
		let tr = document.createElement("TR");
		for (let j = 0; j < 64; j++) {
			let td = document.createElement("TD");

			if (j > 0) {
				td.id = "arr_col-" + (j - 1) + "_row-" + i;
			} else {
				td.id = "arr_side_row-" + i;
				td.classList.add("arrange-sidebar");
				td.appendChild(document.createTextNode("ptrn" + (i + 1)));
				sideCells.push(td);
			}

			tr.appendChild(td);
		}
		table.appendChild(tr);
	}

	arrange.appendChild(table);


	for (let i = 0; i < 64; i++)
		songObj.song[i] = [];

	table.addEventListener("click", function (event) {
		let tgt = event.target;
		if (tgt.nodeName != "TD")
			return;

		if (tgt.id == "arr_corner")
			return;


		let idParts = tgt.id.split("_");
		let col = Number(idParts[1].split("-")[1]);
		let row = Number(idParts[2].split("-")[1]);

		if (tgt.id.indexOf("header") != -1) {
			console.log("selected start point: " + col);
			let prev = document.getElementById("arr_col-" + songObj.arrangeStartPoint + "_header");
			prev.classList.remove("play-start-point");
			songObj.arrangeStartPoint = col;
			let next = document.getElementById("arr_col-" + col + "_header");
			next.classList.add("play-start-point");
			return;
		}

		if (tgt.id.indexOf("side") != -1) {
			console.log("arrange pattern " + row);
			sideCells.forEach(e => e.classList.remove("select-fill"));
			tgt.classList.add("select-fill");

			if (!songObj.patterns[row]) {
				songObj.patterns[row] = new Pattern();
				tgt.classList.add("fill");
			}

			//songObj.currentPattern.activeIndex = 0;

			songObj.currentPattern = songObj.patterns[row];
			onPatternSelectCallback(songObj.currentPattern);

			if (songObj.currentPattern.patternData[0]) {
				showSequenceCallback(songObj.currentPattern);
			}

			return;
		}

		if (songObj.song[col][row]) {
			songObj.song[col][row] = false;
			tgt.classList.remove("fill");
			addTail(col, row, false);
		} else {
			songObj.song[col][row] = true;
			tgt.classList.add("fill");
			addTail(col, row, true);
		}

		console.log(col, row);
	});

	function addTail(col, row, isTail) {
		let len = Math.ceil(songObj.patterns[row].length / 16);
		for (let i = 0; i < len; i++) {
			let cell = document.getElementById("arr_col-" + (col + i) + "_row-" + row);

			if (!cell)
				continue;

			if (isTail)
				cell.classList.add("fill-tail");
			else
				cell.classList.remove("fill-tail");
		}
	}

	function clearSongView() {
		let elems = document.querySelectorAll("#arrange-main .fill, #arrange-main .fill-tail");
		elems.forEach(e => {
			e.classList.remove("fill");
			e.classList.remove("fill-tail");
		});
	}

	this.fillSongView = function () {
		clearSongView();
		for (let i = 0; i < songObj.song.length; i++) {
			//let a = songObj.song[i];
			for (let j = 0; j < songObj.song[i].length; j++) {
				if (songObj.song[i][j]) {
					let e = document.getElementById("arr_col-" + i + "_row-" + j);
					e.classList.add("fill");
					addTail(i, j, true)
				}
			}
		}
	}
}