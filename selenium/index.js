"use strict";

const puppeteer = require('puppeteer');

class Selenium {
    constructor({link, currentMemberNumber, username, login, password, proxyIP, isParseName}) {
        this.tender = require('../tenders/index');
        this.logs = require('../logs/index');
        this.currentIndex = currentMemberNumber;
        this.login = login;
        this.password = password;
        this.proxy = proxyIP;
        this.link = link;
        // this.link = 'https://2ip.ru/';
        this.alert = false;
        this.username = username;
        this.usersBet = null;
        this.isBotOn = false;
        this.isStop = false;

        this.createPage(isParseName)
    }

    async createPage(isParseName) {
        const proxyUrl = `http://${this.proxy}`;
        const username = 'vladik25666';
        const password = 'C6h9AiX';

        this.browser = await puppeteer.launch({
            args: [`--proxy-server=${proxyUrl}`],
            headless: true,
        });

        this.page = await this.browser.newPage();
        await this.page.authenticate({username, password});

        this.open(isParseName)
    }

    async open(isParseName) {
        try {
            await this.page.goto(this.link, {waitUntil: 'domcontentloaded'});
        } catch (e) {
            // console.log(e)
            this.tender.removeTender.remove({link: this.link, message: 'Битая ссылка'});
            await this.stop();

            return
        }

        isParseName ? this.parseName() : this.search();
    }

    async parseName() {
        await this.page.waitForSelector('.ivu-card-body div.bold', {timeout: 30000});

        const text = await this.page.evaluate(() => {
            const name = document.querySelector('.ivu-card-body div.bold');

            return name ? name.innerText : false;
        });

        text && this.tender.setTenderName({tenderName: text, link: this.link});
        await this.stop(false);
    }

    async parseTime() {
        if (this.isStop) {
            return
        }

        const time = await this.page.evaluate(() => {
            const text = document.querySelector('timer.ng-scope.ng-isolate-scope');

            return text ? text.innerText : false;
        });

        time && this.tender.setTimeForNextStep({timer: time, link: this.link});
        this.parseTime();
    }

    async search() {
        const parents = await this.page.evaluate(() => {
            const parents = document.querySelectorAll('.row.auction-stage.stage-item.stage-bids.ng-scope');

            return Array.from(parents).map(parent => {
                const bet = parent.querySelector('.label-price.ng-binding');
                const participant = parent.querySelector('.stage-info-item.stage-label.ng-scope').innerText;
                const betText = bet.innerText;

                bet.focus();
                const color = window.getComputedStyle(bet).getPropertyValue('color');

                return {
                    color,
                    participant,
                    betText
                }
            });
        });

        if ((this.currentIndex === parents.length && this.currentIndex > 0) || this.isStop) {
            await this.stop(true);

            return
        }

        if (!parents.length) {
            this.search();

            return
        }

        this.findPanelBet(parents.length);

        for (const [index, parent] of parents.entries()) {
            const {color, participant, betText} = parent;

            if ((color === `rgba(51, 51, 51, 1)` || color === 'rgb(51, 51, 51)') && this.currentIndex <= index) {
                await this.setLogs(participant, betText, parents.length);
            }

            index === parents.length - 1 && this.search();
        }
    }

    setLogs(participant, bet, length) {
        return this.logs.setLogs({
            link: this.link,
            numberOfParticipants: length,
            logs: {
                participant,
                bet,
                currentMemberNumber: this.currentIndex++,
                bitTime: new Date()
            }
        });
    }

    async findPanelBet(length) {
        const displayValue = await this.page.evaluate(() => {
            const display = document.querySelector('.panel.panel-default.bg-warning.fixed-bottom.auction-with-one-price');
            display.focus();

            return window.getComputedStyle(display).getPropertyValue('display');
        });

        if (displayValue !== 'none') {
            !this.alert && this.makeABet();
            this.alert = true;
        } else {
            this.alert && this.tender.sendMessageToClient({
                bet: null,
                link: this.link,
                isModalBets: true,
                isOpen: false
            });

            this.alert && this.usersBet && this.setLogs(this.isBotOn ? 'Бот' : this.username, `${this.usersBet} грн`, length);
            this.alert = false;
        }
    }

    async makeABet() {
        const color = await this.page.evaluate(() => {
            const panel = document.querySelector('.panel.panel-default.bg-warning.fixed-bottom.auction-with-one-price');
            const input = panel.querySelector('#bid-amount-input');
            input.focus();

            return window.getComputedStyle(input).getPropertyValue('background-color');
        });

        color !== `rgb(238, 238, 238)` && this.parseMinBet()
    }

    async parseMinBet() {
        const bet = await this.page.evaluate(() => {
            const panel = document.querySelector('.panel.panel-default.bg-warning.fixed-bottom.auction-with-one-price');

            return panel.querySelector('.max_bid_amount.ng-binding.ng-scope').innerText;
        });

        // const maxBetText = +maxBet.split(',')[0].split(' ').join('');

        this.tender.sendMessageToClient({bet, link: this.link, isModalBets: true, isOpen: true});
    }

    async enterBet(bet) {
        this.usersBet = parseInt(bet);

        await this.page.click('#clear-bid-button');
        await this.page.type('#bid-amount-input', bet);
        await this.page.click('#place-bid-button');
    }

    async auth() {
        await this.page.click('#SignIn');
        await this.page.type('[name=login].ivu-input', this.login);
        await this.page.type('[type=password]', this.password);
        await this.page.keyboard.press('Enter');

        this.moveToLot();
    }

    async reEnter() {
        try {
            await this.driver.findElement(this.By.css('a.btn.btn-success.btn-lg.btn-block.ng-scope')).click();
            await this.driver.sleep(4000);
            await this.driver.findElement(this.By.css('.btn.btn-success')).click();

            this.search();
        } catch (e) {
            this.reEnter();
        }
    }

    async switchToSecondWindow() {
        await this.driver.wait(async () => (await this.driver.getAllWindowHandles()).length === 2, 60000);
        const originalWindows = await this.driver.getWindowHandle();
        const windows = await this.driver.getAllWindowHandles();

        for await (const handle of windows) {
            if (handle !== originalWindows) {
                await this.driver.switchTo().window(handle);
            }
        }

        await this.driver.sleep(10000);

        try {
            await this.driver.wait(
                this.until.elementLocated(
                    this.By.css('.btn.btn-success')
                ), 100000
            ).click();
            // await this.driver.findElement(this.By.css('.btn.btn-success')).click();
            this.parseTime();
            this.search();
        } catch (e) {
            console.log('failed')
            this.parseTime();
            this.reEnter();
        }
    }

    async moveToLot() {
        const click = async (span) => {
            try {
                await span.click();
                this.switchToSecondWindow();
            } catch (e) {
                await click(span)
            }
        };

        await this.driver.wait(
            this.until.elementLocated(
                this.By.css('button.font-15.smt-btn.smt-btn-warning.smt-btn-normal.smt-btn-circle.smt-btn-flat')
            ), 60000
        ).click();

        const span = await this.driver.wait(
            this.until.elementLocated(
                this.By.css('a.smt-btn.smt-btn-warning.smt-btn-normal.smt-btn-circle.smt-btn-flat span')
            ), 60000
        );

        await click(span)
    }

    async stop(allow = true) {
        this.isStop = true;
        allow && this.tender.sendMessageToClient({isEnd: true, link: this.link});

        return this.browser.close();
    }

    changeUsername(username) {
        this.username = username;
    }

    toggleBot(isBotOn) {
        this.isBotOn = isBotOn;
    }
}

module.exports = ({link, isParseName = false, currentMemberNumber, username, login, password, proxyIP}) => {
    return new Selenium({link, currentMemberNumber, username, login, password, proxyIP, isParseName});
};


