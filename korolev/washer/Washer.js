export class Washer{
    constructor(selector, modes = {}){
        this.app = document.querySelector(selector);
        this.params = modes;
        this.currentMode = null;
        this.status = "stop";
        this.isPaused = true;
        this.canSwitch = true;
        this.init();
    }

    init(){
        if(!this.app){
            console.error("Selector for initialization not chosen");
            return;
        }
        this.app.classList.add("washer");
        this.createControls();
        this.renderDrum();

        this.addModeListeners();
        this.addStartPauseButtonListener();
        this.addStopButtonListener();
    }

    createControls(){
        this.controls = this.createControlElement("washer-controls", "", this.app);
        this.modes = this.createControlElement("washer-controls__modes", "modes", this.controls, "ul");
        this.temperatures = this.createControlElement("washer-controls__temperatures", "temperatures", this.controls, "ul");
        this.spins = this.createControlElement("washer-controls__spins", "spins", this.controls, "ul");
        this.time = this.createControlElement("washer-controls__time", "time", this.controls);
        this.stopButton = this.createControlElement("washer-controls__stop-button", "stopButton", this.controls);
        this.startPauseButton = this.createControlElement("washer-controls__start-stop-button", "startPauseButton", this.controls);
        this.renderModes();
    }

    createControlElement(className, idElement, parentElement, childElement){
        const controlElement = document.createElement("div");
        controlElement.classList.add(className);
        parentElement.appendChild(controlElement);

        if(idElement){
            controlElement.setAttribute("id", idElement);
        }

        if(childElement){
            controlElement.appendChild(document.createElement(childElement));
        }

        return controlElement;
    }

    addModeListeners(){
        setTimeout(() => {
            const liModes = this.modes.querySelectorAll("li");
            liModes.forEach((li) => {
                li.addEventListener("click", (e) => {
                    if(this.canSwitch){
                        this.setModes(li.getAttribute("data-mode"));
                        this.toggleActiveClass(li, liModes);
                        localStorage.clear();
                        this.temperatures.querySelector("ul").innerHTML = "";
                        this.spins.querySelector("ul").innerHTML = "";
                        this.addTemperatureListeners();
                        this.addSpinListeners();
                    }else{
                        alert("Стиральная машина работает. Поставьте на паузу и измените настройки.");
                    }
                });
            });
        }, 500)
    }

    addStartPauseButtonListener(){
        this.startPauseButton.addEventListener("click", () => {
            if(!this.currentMode){
                alert("Выберите режим стирки!");
                return false;
            }
            this.toggleStartPause();
        });
    }

    addStopButtonListener(){
        this.stopButton.addEventListener("click", () => {
            if(!this.currentMode){
                alert("Выберите режим стирки!");
                return false;
            }
            this.stopWashing();
        });
    }

    toggleStartPause(){
        if(this.status === "start"){
            this.pauseWashing();
        }else if(this.status === "pause" || this.status === "stop"){
            this.startWashing();
        }
    }

    startWashing(){
        this.status = "start";
        this.isPaused = false;
        this.canSwitch = false;
        this.startPauseButton.classList.remove("paused");
        this.isDrumRotate = true;
        this.resumeDrumRotation();
        let time = localStorage.getItem("TIME");
        if(time === null){
            this.renderTime();
        }

        this.intervalIdTime = setInterval(() => {
            if(!this.isPaused){
                time = this.time.dataset.time;
                if(time > 0){
                    this.time.dataset.time = time - 1;
                    this.time.innerHTML = this.time.dataset.time;
                    localStorage.setItem("TIME", this.time.dataset.time);
                }else{
                    this.stopWashing();
                    alert("Стирка завершена!");
                }
            }
        }, 1000);
    }

    pauseWashing(){
        this.status = "pause";
        this.isPaused = true;
        this.canSwitch = true;
        this.startPauseButton.classList.add("paused");
        this.isDrumRotate = false;
        this.pauseDrumRotation();
        localStorage.setItem("TIME", this.time.dataset.time);
        clearInterval(this.intervalIdTime);
    }

    stopWashing(){
        this.status = "stop";
        this.isPaused = true;
        this.canSwitch = true;
        this.isDrumRotate = false;
        this.time.innerHTML = "";
        clearInterval(this.intervalIdTime);
        this.isDrumRotate = false;
        this.startPauseButton.classList.remove("paused");
        this.context.clearRect(0, 0, this.drum.width, this.drum.height);
        clearInterval(this.intervalIdDrumRotation);
        localStorage.clear();
    }

    toggleActiveClass(activeElement, elements){
        elements.forEach((element) => {
            if(element === activeElement){
                element.classList.add("active");
                this.rotationSpeed = element.dataset.mode / 100;
            }else{
                element.classList.remove("active");
            }
        });
    }

    renderModes(){
        const promises = Object.values(this.params.modes).map(this.getMode);
        Promise.allSettled(promises)
            .then(results => results.filter(result => result.status === "fulfilled"))
            .then(results => results.map(result => result.value.mode))
            .then(modes => modes.forEach(this.appendModeElement));
    }

    appendModeElement = (mode) => {
        const li = document.createElement("li");
        li.dataset.mode = mode.code;
        li.textContent = mode.name;
        this.modes.querySelector("ul").appendChild(li);
    }

    getMode(mode){
        return fetch(`korolev/washer/modes/${mode}.json`)
            .then(response => {
                if(!response.ok){
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .catch(console.error);
    }

    renderTemperature(){
        this.currentMode.then(data => {
            data.mode.temperature.forEach(this.appendTemperatureElement);
        });
    }

    appendTemperatureElement = (value, index) => {
        const li = document.createElement("li");
        if(index === 0){
            li.classList.add("active");
        }
        li.dataset.mode = value;
        li.textContent = `${value}°`;
        this.temperatures.querySelector("ul").appendChild(li);
    }

    renderSpin(){
        this.currentMode.then(data => {
            data.mode.spin.forEach(this.appendSpinElement);
        });
    }

    renderTime(){
        this.currentMode.then(data => {
            this.time.innerHTML = data.mode.time;
            this.time.dataset.time = data.mode.time;
        });
    }

    appendSpinElement = (value, index) => {
        const li = document.createElement("li");
        if(index === 0){
            li.classList.add("active");
            this.rotationSpeed = value / 100;
        }
        li.dataset.mode = value;
        li.textContent = value;
        this.spins.querySelector("ul").appendChild(li);
    }

    setModes(mode){
        if(!mode){
            alert("Выберите режим стирки!");
            return;
        }

        this.currentMode = this.getMode(mode);
        this.renderTemperature();
        this.renderSpin();
        this.renderTime();
    }

    addTemperatureListeners(){
        setTimeout(() => {
            const liTemperatures = this.temperatures.querySelectorAll("li");
            liTemperatures.forEach((li) => {
                li.addEventListener("click", (e) => {
                    if(this.canSwitch){
                        this.toggleActiveClass(li, liTemperatures);
                    }else{
                        alert("Стиральная машина работает. Поставьте на паузу и измените настройки.");
                    }
                });
            });
        }, 500)
    }

    addSpinListeners(){
        setTimeout(() => {
            const liSpins = this.spins.querySelectorAll("li");
            liSpins.forEach((li) => {
                li.addEventListener("click", (e) => {
                    if(this.canSwitch){
                        this.toggleActiveClass(li, liSpins);
                    }else{
                        alert("Стиральная машина работает. Поставьте на паузу и измените настройки.");
                    }
                });
            });
        }, 500)
    }

    renderDrum(){
        this.drum = document.createElement("canvas");
        this.drum.classList.add("washer-drum");
        this.drum.setAttribute("id", "drum");
        this.drum.setAttribute("width", "220");
        this.drum.setAttribute("height", "220");
        this.app.appendChild(this.drum);
        this.context = this.drum.getContext("2d");
        this.drumX = this.drum.width / 2;
        this.drumY = this.drum.height / 2;
        this.img = new Image();
        this.img.src = "korolev/washer/images/mendeleev.jpg";
    }

    pauseDrumRotation(){
        this.isDrumRotate = false;
        clearInterval(this.intervalIdDrumRotation);
    }

    resumeDrumRotation(){
        this.intervalIdDrumRotation = setInterval(() => {
            if(this.isDrumRotate){
                this.context.clearRect(0, 0, this.drum.width, this.drum.height);
                this.context.save();
                this.context.translate(this.drumX, this.drumY);
                this.context.scale(0.235, 0.235);
                this.context.rotate(this.rotationSpeed);
                this.context.drawImage(this.img, -this.img.width / 2, -this.img.height / 2);
                this.context.restore();
                this.rotationSpeed += 1;
            }
        }, 100);
    }
}
