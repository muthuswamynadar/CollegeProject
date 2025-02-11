document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".card").forEach(card => {
        let img = card.querySelector("img");
        let cardBody = card.querySelector(".card-body");

        if (img && cardBody) {
            let image = new Image();
            image.src = img.src;
            image.crossOrigin = "Anonymous"; // Prevent CORS issues

            image.onload = function () {
                let canvas = document.createElement("canvas");
                let ctx = canvas.getContext("2d");

                canvas.width = 1;
                canvas.height = 1;

                // Extract dominant color
                ctx.drawImage(image, 0, 0, 1, 1);
                let pixel = ctx.getImageData(0, 0, 1, 1).data;
                
                // Convert to HSL for better color adjustment
                let [h, s, l] = rgbToHsl(pixel[0], pixel[1], pixel[2]);

                // Adjust brightness dynamically
                l = l < 0.5 ? l + 0.3 : l - 0.3;

                // Convert back to RGB
                let [r, g, b] = hslToRgb(h, s, l);
                let adjustedColor = `rgb(${r}, ${g}, ${b})`;

                // Apply background with vibrancy effect
                cardBody.style.background = `linear-gradient(to bottom, ${adjustedColor}, rgba(0, 0, 0, 0.8))`;
            };
        }
    });

    // Helper function to convert RGB to HSL
    function rgbToHsl(r, g, b) {
        r /= 255, g /= 255, b /= 255;
        let max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            let d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return [h, s, l];
    }

    // Helper function to convert HSL to RGB
    function hslToRgb(h, s, l) {
        let r, g, b;
        if (s === 0) {
            r = g = b = l;
        } else {
            function hueToRgb(p, q, t) {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1 / 6) return p + (q - p) * 6 * t;
                if (t < 1 / 2) return q;
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                return p;
            }

            let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            let p = 2 * l - q;

            r = hueToRgb(p, q, h);
            g = hueToRgb(p, q, h + 1 / 3);
            b = hueToRgb(p, q, h - 1 / 3);
        }
        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    }
});


document.addEventListener("DOMContentLoaded", function () {
    const previewButtons = document.querySelectorAll(".preview-btn");
    const iframe = document.getElementById("previewIframe");

    previewButtons.forEach(button => {
        button.addEventListener("click", function () {
            const url = this.getAttribute("data-url");
            iframe.src = url; // Set iframe source
        });
    });
});