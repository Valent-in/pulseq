"use strict"

{
	let tabs = document.querySelectorAll(".js-tab");
	tabs.forEach((e) => {
		e.addEventListener("click", (event => {
			let id = event.target.id;
			//console.log(id);
			id = id.replace("-tab", "-view");
			let containers = document.querySelectorAll(".view-container");
			containers.forEach(e => {
				e.classList.add("hidden")
			})

			tabs.forEach(e => {
				e.classList.remove("tab--active")
			})
			event.target.classList.add("tab--active");


			let show = document.getElementById(id);
			show.classList.remove("hidden");
		}))
	})


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