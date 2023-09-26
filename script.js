import {Washer} from "./korolev/washer/Washer.js";

document.addEventListener("DOMContentLoaded", () => {
    const machine = new Washer(
        "#app",
        {modes: ["cotton", "wool", "synthetics", "delicate", "quick-wash"]}
    );
});