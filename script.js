// joke teller API benutzen, um jokes ausgeben zu lassen

class JokeTeller {
    constructor() {
        this.btn = document.querySelector(".joke-teller__joke-btn");
        this.pauseBtn = document.querySelector(".joke-teller__pause-btn");
        this.radios = document.querySelector(".joke-teller__radios");
        this.errorMsg = document.querySelector(".joke-teller__error-msg");
        this.jokeWrapper = document.querySelector(".joke-teller__joke-wrapper");

        this.isTalking = false;
        this.isPaused = false;
        this.renderSpeed = 70;

        this.radios.addEventListener("click", function(e) {
            if ((e.target.tagName != "LABEL" && !e.target.closest("label")) || this.isTalking) return;

            this.btn.removeAttribute("disabled");
        }.bind(this));

        this.btn.addEventListener("click", this._generateJoke.bind(this));
        this.pauseBtn.addEventListener("click", this._pauseJoke.bind(this));
    }

    async _generateJoke() {
        if (this.isTalking) return;

        this.isTalking = true;
        this.isPaused = false;
        this.btn.setAttribute("disabled", "disabled"); 
        this.pauseBtn.removeAttribute("disabled"); 
        this.pauseBtn.querySelector("i").classList.add('fa-pause');
        this.pauseBtn.querySelector("i").classList.remove('fa-play');
        this.errorMsg.textContent = "";

        try {
            const type = this._getAttribute("joke_type");
            const format = this._getAttribute("joke_format");
            const lang = this._getAttribute("joke_lang");
            const speed = this._getAttribute("joke_speed");
            
            const jokeRes = await fetch(`https://v2.jokeapi.dev/joke/${type}?lang=${lang}&type=${format}`);
            this.curJoke = await jokeRes.json();
            this.renderSpeed = +speed;

            if (this.curJoke.message) {
                throw new Error(this.curJoke.message);
            }
    
            await this._renderJoke(this.curJoke);
        } catch (error) {
            this.errorMsg.textContent = error.message;
            this.jokeWrapper.textContent = "";
            console.log(error);
        } finally {
            this.isTalking = false;
            this.btn.removeAttribute("disabled");
            this.pauseBtn.setAttribute("disabled", "disabled");
        }
    }

    _getAttribute(name) {
        return document
            .querySelector(`input[name=${name}]:checked`)
            .getAttribute("id");
    }

    async _pauseJoke() {
        this.pauseBtn.querySelector("i").classList.toggle('fa-pause');
        this.pauseBtn.querySelector("i").classList.toggle('fa-play');

        // IF JOKE IS NOT PAUSED, REMOVE ALL TIMEOUTS TO PAUSE IT
        if (!this.isPaused) {
            let timeoutId = window.setTimeout(function() {}, 0);

            while (timeoutId--) {
                window.clearTimeout(timeoutId);
            }

            this.isTalking = false;
            this.isPaused = true;
            this.btn.removeAttribute("disabled");

            return;
        }

        this.isTalking = true;
        this.isPaused = false;
        this.btn.setAttribute("disabled", "disabled"); 

        // TWOPART JOKE: IF JOKE DIDNT REACH DELIVERY PART YET
        // --> CONTINUE RENDERING SETUP PART FIRST
        if (this.curJoke.type == "twopart" && !document.querySelector(".joke-teller__joke-delivery")) {
            const jokeEl = document.querySelector(".joke-teller__joke-setup");
            const curText = jokeEl.textContent;

            const restJoke = this.curJoke.setup.replace(curText, "");

            // IF REST SETUP JOKE IS NOT EMPTY, CONTINUE RENDERING IT
            (restJoke != "") && await this._animateText({
                textEl: jokeEl,
                text: restJoke,
                speed: this.renderSpeed
            });

            // RENDER DELIVERY JOKE
            await new Promise(resolve => {
                setTimeout(async () => {
                    const jokeDelivery = this._createEl({
                        type: "span",
                        className: "joke-teller__joke-delivery",
                        parentEl: this.jokeWrapper
                    });

                    await this._animateText({
                        textEl: jokeDelivery,
                        text: this.curJoke.delivery,
                        speed: this.renderSpeed
                    });
                    
                    resolve();
                }, 1000);
            });
        }
        
        // TWOPART JOKE: IF JOKE REACHED DELIVERY PART ALREADY
        // --> CONTINUE RENDERING DELIVERY PART
        else if (this.curJoke.type == "twopart") {
            const jokeEl = document.querySelector(".joke-teller__joke-delivery");
            const curText = jokeEl.textContent;

            const restJoke = this.curJoke.delivery.replace(curText, "");
            
            await this._animateText({
                textEl: jokeEl,
                text: restJoke,
                speed: this.renderSpeed
            });
        }

        // SINGLE PART JOKE: CONTINUE RENDERING
        if (this.curJoke.type == "single") {
            const jokeEl = document.querySelector(".joke-teller__joke-single");
            const curText = jokeEl.textContent;

            const restJoke = this.curJoke.joke.replace(curText, "");
            
            await this._animateText({
                textEl: jokeEl,
                text: restJoke,
                speed: this.renderSpeed
            });
        }
        
        this.isTalking = false;
        this.btn.removeAttribute("disabled");
        this.pauseBtn.setAttribute("disabled", "disabled");
    }

    async _renderJoke(joke) {
        this.jokeWrapper.innerHTML = "";

        // RENDER TWOPART JOKE
        if (joke.type == "twopart") {
            const jokeSetup = this._createEl({
                type: "span",
                className: "joke-teller__joke-setup",
                parentEl: this.jokeWrapper
            });

            // RENDER SETUP PART FIRST
            await this._animateText({
                textEl: jokeSetup,
                text: joke.setup,
                speed: this.renderSpeed
            });

            // RENDER DELIVERY PART WITH SOME DELAY AFTER SETUP
            await new Promise(resolve => {
                setTimeout(async () => {
                    const jokeDelivery = this._createEl({
                        type: "span",
                        className: "joke-teller__joke-delivery",
                        parentEl: this.jokeWrapper
                    });

                    await this._animateText({
                        textEl: jokeDelivery,
                        text: joke.delivery,
                        speed: this.renderSpeed
                    });
                    
                    resolve();
                }, 1000);
            });
        }

        // RENDER SINGLE PART JOKE
        if (joke.type == "single") {
            const jokeSingle = this._createEl({
                type: "span",
                className: "joke-teller__joke-single",
                parentEl: this.jokeWrapper
            });

            await this._animateText({
                textEl: jokeSingle,
                text: joke.joke,
                speed: this.renderSpeed
            });
        }
    }

    _createEl({ type, className, parentEl }) {
        const el = document.createElement(type);
        el.classList.add(className);

        parentEl.appendChild(el);

        return el;
    }

    _animateText({ textEl, text, speed }) {
        return new Promise(resolve => {
            const words = text.split(" ");
            let timeout = 0;
            let textStr = textEl.textContent || "";
            
            words.forEach((word, wordIndex) => {
                const isLastWord = wordIndex == words.length - 1;
    
                word.split("")
                    .forEach((letter, letterIndex) => {
                        const isLastLetter = letterIndex == word.length - 1;
    
                        timeout++;
    
                        setTimeout(() => {
                            textStr += isLastLetter && !isLastWord
                                ? letter + " "
                                : letter;
    
                            textEl.textContent = textStr;
    
                            if (isLastWord && isLastLetter) resolve();
                        }, timeout * speed);
                    })
            });
        });
    }
}

new JokeTeller();