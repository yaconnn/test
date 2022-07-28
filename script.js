class QuoteGen {
    constructor() {
        this.errorMsg = document.querySelector(".quote-generator__error-message");
        this.contentBox = document.querySelector(".quote-generator__content-box");
        this.quoteEl = document.querySelector(".quote-generator__quote");
        this.authorEl = document.querySelector(".quote-generator__author");
        this.btnQuote = document.querySelector(".quote-generator__btn-quote");
        this.btnTwitter = document.querySelector(".quote-generator__btn-twitter");

        this._replaceQuote();

        this.btnQuote.addEventListener("click", this._replaceQuote.bind(this));
        this.btnTwitter.addEventListener("click", this._tweetQuote.bind(this));
    }

    _getAPI(url) {
        return Promise.race([
            new Promise((_, reject) => {
                setTimeout(() => {
                    return reject("Server seems to be unavailable. Please try again later.");
                }, 2000);
            }),
            fetch(url)
        ]);
    }

    async _getQuote() {
        this.contentBox.classList.add("loading");

        try {
            const quoteRes = await this._getAPI("https://type.fit/api/quotes");
            const quoteData = await quoteRes.json();

            if (!quoteRes.ok) {
                throw new Error("There was a server error. Please try again later.")
            }

            const quoteNum = Math.round((Math.random() * quoteData.length));

            this.quoteData = {
                quote: quoteData[quoteNum].text,
                author: quoteData[quoteNum].author,
            }
        } catch (err) {
            throw new Error(err);
        } finally {
            this.contentBox.classList.remove("loading");
        }
    }

    async _replaceQuote(evt) {
        evt?.preventDefault();

        try {
            await this._getQuote();
            const {quote, author} = this.quoteData;
    
            this.quoteEl.textContent = quote;
            this.authorEl.textContent = author;

            this.errorMsg.classList.add("hidden");
        } catch (error) {
            this.errorMsg.textContent = error.message;
            this.errorMsg.classList.remove("hidden");
        }
    }

    _tweetQuote(evt) {
        evt.preventDefault();

        window.open(`https://twitter.com/intent/tweet?text=${this.quoteData.quote}`);
    }
}

new QuoteGen();