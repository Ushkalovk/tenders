"use strict";

const puppeteer = require('puppeteer');
const Algorithm = require('./algorithm');

class Selenium {
    constructor({link, currentMemberNumber, username, login, password, proxyIP, isParseName = false, proxyLogin, proxyPassword, company, isBotOn, minBet}) {
        this.tender = require('../tenders/index');
        this.algorithm = new Algorithm(minBet);
        this.logs = require('../logs/index');
        this.currentIndex = currentMemberNumber;
        this.login = login;
        this.password = password;
        this.proxy = proxyIP;
        this.proxyLogin = proxyLogin;
        this.proxyPassword = proxyPassword;
        this.link = link;
        this.isBotOn = false;
        this.isStop = false;
        this.company = company;
        this.length = 0;
        this.isBotOn = isBotOn;
        this.currentRound = 0;
        this.allowParse = true;

        this.alert = {
            open: false,
            count: 0
        };

        this.bet = {
            username: username,
            value: null
        };

        this.createPage(isParseName)
    }

    async createPage(isParseName) {
        const proxyUrl = `http://${this.proxy}`;

        this.browser = await puppeteer.launch({
            args: [`--proxy-server=${proxyUrl}`, '--no-sandbox', '--disable-setuid-sandbox'],
            headless: false
        });

        this.page = await this.browser.newPage();
        await this.page.setViewport({'width': 1920, 'height': 1080});
        await this.page.authenticate({username: this.proxyLogin, password: this.proxyPassword});

        this.open(isParseName)
    }

    async checkDocument() {
        const doc = await this.page.$('body');

        !doc && await this.stop({message: `Проверьте срок действия прокси компании ${this.company}`, disable: true});
    }

    async open(isParseName) {
        try {
            await this.page.goto(this.link, {waitUntil: 'domcontentloaded'});
            this.checkDocument();

            isParseName ? this.parseName() : this.switchToSecondWindow();
        } catch (e) {
            let message = '';

            if (e.message.includes('invalid URL')) {
                this.tender.removeTender.remove({link: this.link, message: `Некорректная ссылка: ${this.link}`});
            } else {
                message = `Проверьте данные прокси следующей компании: ${this.company}`;
            }

            await this.stop({message, disable: true});
        }
    }

    async parseName() {
        try {
            await this.page.waitForSelector('.ivu-card-body [data-qa=title]', {timeout: 60000});
            const text = await this.page.$eval('.ivu-card-body [data-qa=title]', element => element.textContent);

            this.tender.setTenderName({tenderName: text, link: this.link});
            await this.stop({disable: false});
        } catch (e) {
            e.name === 'TimeoutError' && await this.stop({
                message: `Не получилось найти имя тендера со следующей ссылкой: ${this.link}`,
                disable: false
            })
        }
    }

    async parseTime(time = '') {
        if (this.isStop) {
            return
        }

        try {
            await this.page.waitForSelector('timer.ng-scope.ng-isolate-scope', {timeout: 5000});
            const currentTime = await this.page.$eval('timer.ng-scope.ng-isolate-scope', time => time.innerText);

            currentTime !== time && this.tender.setTimeForNextStep({
                timer: currentTime,
                link: this.link
            });

            this.parseTime(currentTime);
        } catch (e) {
            console.log('упс')
        }
    }

    async search() {
        if (this.isStop) {
            return
        }

        try {
            await this.page.waitForSelector('.row.auction-stage.stage-item.stage-bids.ng-scope', {timeout: 1000 * 60 * 20});

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
                await this.stop({disable: true});

                return
            }

            this.length = parents.length;

            for (const [index, parent] of parents.entries()) {
                const {color, participant, betText} = parent;

                if ((color === `rgba(51, 51, 51, 1)` || color === 'rgb(51, 51, 51)') && this.currentIndex <= index && this.allowParse) {
                    this.currentRound = Math.floor(this.currentIndex / (this.length / 5));
                    this.algorithm.setUser(participant, betText, this.currentRound);
                    await this.setLogs(participant, betText, this.currentRound);
                }

                index === parents.length - 1 && this.search();
            }
        } catch (e) {
            console.log(e.message)
            // if (e.message.includes('Target closed')) {
            await this.stop({message: `Тендер со следующей ссылкой: ${this.link} закрыт`, disable: true});
            // }
        }
    }

    setLogs(participant, bet) {
        return this.logs.setLogs({
            link: this.link,
            numberOfParticipants: this.length,
            logs: {
                participant,
                bet,
                currentMemberNumber: this.currentIndex++,
                bitTime: new Date(),
                round: this.currentRound
            }
        });
    }

    async findPanelBet() {
        if (this.isStop || this.alert.count === 3) {
            return
        }

        try {
            // ждём, пока панель не появится

            await this.page.waitForSelector('.panel.panel-default.bg-warning.fixed-bottom.auction-with-one-price', {
                timeout: 1000 * 60 * 40,
                visible: true
            });

            this.parseMinBet(); // уведомляем, что панель открыта
            this.alert.open = true;
            this.alert.count++;
            this.isBotOn && this.makeABet(); // если бот включен, делаем ставку

            await this.page.waitFor(10000); // дать время на парсинг ставки соперника перед панелью
            this.allowParse = false;

            // ждём пока не закроется

            await this.page.waitForSelector('.panel.panel-default.bg-warning.fixed-bottom.auction-with-one-price', {
                timeout: 1000 * 60 * 20,
                hidden: true
            });

            await this.setLogs(this.bet.username, `${this.bet.value} грн`);
            this.closeFinedPanel(); // уведомляем, что панель закрыта
            this.allowParse = true;

            this.findPanelBet();
        } catch (e) {
            console.log("can't find panel")
        }
    }

    closeFinedPanel() {
        this.alert.open = false;

        this.logs.savePanelBid({
            bet: null,
            link: this.link,
        });
    }

    async parseMinBet() {
        this.logs.savePanelBid({
            bet: await this.page.$eval('.max_bid_amount.ng-binding.ng-scope', element => element.innerText),
            link: this.link,
        });
    }

    toggleBot(isBotOn) {
        this.isBotOn = isBotOn;

        this.isBotOn && this.alert.open && this.makeABet();
    }

    async makeABet() {
        const participants = await this.page.evaluate(() => {
            const currentRound = document.querySelector('.auction-round.ng-scope.current-round');
            const rows = currentRound.querySelectorAll('.row.auction-stage.stage-item');

            return Array.from(rows).map(row => {
                const bet = row.querySelector('.label-price.ng-binding');

                bet.focus();
                const color = window.getComputedStyle(bet).getPropertyValue('color');

                if (color === `rgba(51, 51, 51, 1)` || color === 'rgb(51, 51, 51)') {
                    return {
                        participant: row.querySelector('.stage-info-item.stage-label.ng-scope').innerText,
                        betText: bet.innerText
                    }
                }
            });
        });

        this.enterBet(this.algorithm.getBet(participants, this.alert.count), 'Бот');
    }

    async enterBet(bet, username) {
        await this.page.click('#clear-bid-button');
        await this.page.type('#bid-amount-input', `${bet}`);
        await this.page.click('#place-bid-button');

        this.bet.value = `${bet}`;
        this.bet.username = username;
    }

    async auth() {
        await this.page.click('#SignIn');
        await this.page.type('[name=login].ivu-input', this.login);
        await this.page.type('[type=password]', this.password);
        await this.page.keyboard.press('Enter');

        await this.page.waitForNavigation();

        const isSecondLayout = await this.page.$('.navbar.navbar-default');

        isSecondLayout ? this.secondLayout() : this.firstLayout();
    }

    async firstLayout() {
        const currentURL = await this.page.url();

        this.browser.once('targetcreated', async (target) => {
            if (target.type() === 'page') {
                console.log('new Page');
                const page = await target.page();
                const url = page.url();

                if (url !== currentURL) {
                    await this.page.close();
                    this.page = page;
                    this.switchToSecondWindow();
                }
            }
        });

        await this.page.waitForSelector('[data-qa=budget-min-step] div:last-child', {visible: true});
        const parsePercent = await this.page.$eval('[data-qa=budget-min-step] div:last-child', element => element.textContent);
        const budget = await this.page.$eval('[data-qa=budget-amount]', element => element.innerText);

        this.parseMinStep(parsePercent, budget);

        await this.page.waitForSelector('button.font-15.smt-btn.smt-btn-warning.smt-btn-normal.smt-btn-circle.smt-btn-flat', {visible: true});
        await this.page.click('button.font-15.smt-btn.smt-btn-warning.smt-btn-normal.smt-btn-circle.smt-btn-flat');

        await this.page.waitForSelector('a.smt-btn.smt-btn-warning.smt-btn-normal.smt-btn-circle.smt-btn-flat span', {timeout: 5000});

        const spanClick = async () => {
            const span = await this.page.$('a.smt-btn.smt-btn-warning.smt-btn-normal.smt-btn-circle.smt-btn-flat span');

            if (span) {
                try {
                    const notice = await this.page.$('.ivu-notice-notice.ivu-notice-notice-closable.ivu-notice-notice-with-desc.move-notice-leave-active.move-notice-leave-to', {timeout: 10000});

                    if (notice) {
                        await this.stop({
                            message: `Невозможно запустить тендер "${this.link}" под именем компании "${this.company}"`,
                            disable: true
                        });

                        return;
                    }

                    await span.click();
                    await spanClick();
                } catch (e) {
                    console.log('span click')
                }
            }
        };

        await spanClick();
    }

    async secondLayout() {
        const getIframe = (resolve) => {
            this.page.once('frameattached', async () => {
                let isFind = false;

                for (const frame of this.page.frames()) {
                    try {
                        const parseText = await frame.$eval('div.price.text-lot', element => element.textContent);
                        this.parseMinStep(parseText);

                        isFind = true;
                        resolve(frame);
                    } catch (e) {
                    }
                }

                !isFind && getIframe(resolve);
            });
        };

        const getFrame = () => new Promise(resolve => getIframe(resolve));

        const frame = await getFrame();

        // await frame.click('button.show-control.button-lot.yellow');

        // try {
        //     await this.page.waitForSelector('.ivu-notice-notice.ivu-notice-notice-closable.ivu-notice-notice-with-desc.move-notice-leave-active.move-notice-leave-to', {timeout: 10000});
        //
        //     this.tender.sendMessageToClient({message: `Невозможно запустить тендер "${this.link}" под именем компании "${this.company}"`});
        //     await this.tender.disableTender({link: this.link});
        //     await this.stop();
        // } catch (e) {
        //     const currentURL = await this.page.url();
        //
        //     this.browser.once('targetcreated', async (target) => {
        //         if (target.type() === 'page') {
        //             console.log('new Page');
        //             const page = await target.page();
        //             const url = page.url();
        //
        //             if (url !== currentURL) {
        //                 await this.page.close();
        //                 this.page = page;
        //                 this.switchToSecondWindow();
        //             }
        //         }
        //     });
        //
        //     await frame.waitForSelector('a.link-button', {timeout: 20000});
        //     await frame.page.click('a.link-button');
        // }
    }

    parseMinStep(percent, budget) {
        const spaceIndex = percent.split('').findIndex(item => item === '%');
        const budgetParse = parseInt(budget.split(' ').join(''));
        const step = +(budgetParse * (+percent.slice(0, spaceIndex) / 100)).toFixed(1);

        this.algorithm.setStep(step);

        console.log(step, 'bet step')
    }

    async switchToSecondWindow() {
        try {
            await this.page.waitForSelector('.btn.btn-success', {timeout: 20000});
            await this.page.click('.btn.btn-success');

            this.parseTime();
            this.search();
            this.findPanelBet();
        } catch (e) {
            this.parseTime();
            await this.page.waitForSelector('a.btn.btn-success.btn-lg.btn-block.ng-scope span', {timeout: 1000 * 60 * 60 * 6});
            this.reStart();
        }
    }

    async reStart() {
        await this.stop({disable: false});

        await this.tender.setNewTender.run({
            link: this.link,
            login: this.login,
            password: this.password,
            proxyIP: this.proxy,
            proxyLogin: this.proxyLogin,
            proxyPassword: this.proxyPassword,
            email: this.bet.username,
            companyName: this.company,
            isBotOn: this.isBotOn,
            minBet: this.algorithm.minBet
        });
    }

    async stop({message, disable = true}) {
        this.isStop = true;
        this.closeFinedPanel();

        disable && await this.tender.disableTender({link: this.link});
        message && this.tender.sendMessageToClient({message});

        return await this.browser.close();
    }
}

module.exports = (data) => new Selenium(data);



