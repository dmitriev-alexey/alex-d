"use strict";

// Lightweight lazy image loader (ES5, no dependencies).
// Swaps data-src -> src when an image nears the viewport using
// IntersectionObserver. Falls back to loading everything at once when the
// browser has no IntersectionObserver support.
(function () {
    var SELECTOR = "img.lazy";

    function notifyLoaded(img) {
        // Let the layout (Isotope) know a new image now has real dimensions.
        try {
            document.dispatchEvent(new CustomEvent("lazyImageLoaded", { detail: img }));
        } catch (e) {
            var ev = document.createEvent("Event");
            ev.initEvent("lazyImageLoaded", true, true);
            document.dispatchEvent(ev);
        }
    }

    function loadImage(img) {
        var src = img.getAttribute("data-src");
        if (!src) {
            return;
        }
        img.onload = function () {
            if (img.className.indexOf("loaded") === -1) {
                img.className += " loaded";
            }
            notifyLoaded(img);
        };
        img.onerror = function () {
            notifyLoaded(img);
        };
        img.src = src;
        img.removeAttribute("data-src");
    }

    function init() {
        var images = document.querySelectorAll(SELECTOR);
        if (!images.length) {
            return;
        }

        if (!("IntersectionObserver" in window)) {
            // No observer support -> just load them all.
            for (var i = 0; i < images.length; i++) {
                loadImage(images[i]);
            }
            return;
        }

        var observer = new IntersectionObserver(function (entries, obs) {
            for (var i = 0; i < entries.length; i++) {
                if (entries[i].isIntersecting) {
                    loadImage(entries[i].target);
                    obs.unobserve(entries[i].target);
                }
            }
        }, { rootMargin: "200px 0px" });

        for (var j = 0; j < images.length; j++) {
            observer.observe(images[j]);
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
