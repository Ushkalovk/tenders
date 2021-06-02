"use strict";

const puppeteer = require('puppeteer');
const Algorithm = require('./algorithm');
const timeToMs = require('./timeToMs');

class Selenium {
    constructor({link, currentMemberNumber, username, login, password, proxyIP, proxyLogin, proxyPassword, company, isBotOn, minBet, firstLaunch}) {
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
        this.newPage = false;
        this.firstLaunch = firstLaunch;
        this.parseTimeCount = 0;
        this.tenderName = '';

        this.alert = {
            open: false,
            count: 0
        };

        this.bet = {
            username: username,
            value: null
        };

        this.createPage()
    }

    async createPage() {
        const proxyUrl = `http://${this.proxy}`;

        this.browser = await puppeteer.launch({
            args: [`--proxy-server=${proxyUrl}`, '--no-sandbox', '--disable-setuid-sandbox'],
            headless: true
        });
        this.tender.sendMessageToClient({message: `${this.proxy}`})

        this.page = await this.browser.newPage();
        await this.page.setViewport({'width': 1920, 'height': 1080});
        await this.page.authenticate({username: this.proxyLogin, password: this.proxyPassword});

        this.open()
    }

    async checkDocument() {
        const doc = await this.page.$('body');

        !doc && await this.stop({message: `Проверьте срок действия прокси компании ${this.company}`, disable: true});
    }

    async open() {
        try {
            await this.page.goto(this.link, {waitUntil: 'domcontentloaded'});
            await this.checkDocument();
            console.log("Parse name")
            await this.parseName();
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
            await this.page.waitForSelector('.ivu-card-body [data-qa=title]');
            const text = await this.page.$eval('.ivu-card-body [data-qa=title]', element => element.textContent);
            this.tender.sendMessageToClient({message: `Name == ${text}`})
            this.tenderName = text;
            this.tender.setTenderName({tenderName: text, link: this.link});
            this.auth();
        } catch (e) {
            e.name === 'TimeoutError' && await this.stop({
                message: `Не получилось найти имя тендера со следующей ссылкой: ${this.link}`,
                disable: false
            })
        }
    }

    async search() {
        if (this.isStop) {
            return
        }

        try {
            await this.page.waitForSelector('.row.auction-stage.stage-item.stage-bids.ng-scope.past-stage', {timeout: 60000});
            await this.page.waitForSelector('span.label-price', {timeout: 60000});
            await this.page.waitForSelector('span.stage-info-item.stage-label.ng-scope', {timeout: 60000});
            await this.page.waitForSelector('.stage-info-lining', {timeout: 60000});

            const parents = await this.page.evaluate(() => {
                const parents = document.querySelectorAll('.row.auction-stage.stage-item.stage-bids.ng-scope.past-stage');
                return Array.from(parents).map(parent => {
                    const parent2 = parent.querySelector('.stage-info-lining');
                    const bet = parent.querySelector('.label-price');
                    

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
                this.tender.setTimeForNextStep({
                    timer: 'Закончен',
                    link: this.link,
                });

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
            console.log(e.message, 'search')
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
            console.log("panel opened ");
            this.alert.open = true;
            this.alert.count++;
            await this.page.waitForTimeout(62000);  
            this.isBotOn && this.makeABet(); // если бот включен, делаем ставку

            // await this.page.waitFor(10000); // дать время на парсинг ставки соперника перед панелью
            await this.page.waitForTimeout(10000);  
            this.allowParse = false;

            // ждём пока не закроется

            await this.page.waitForSelector('.panel.panel-default.bg-warning.fixed-bottom.auction-with-one-price', {
                timeout: 1000 * 60 * 20,
                hidden: true
            });

            await this.setLogs(this.bet.username, `${this.bet.value ? this.bet.value : this.algorithm.bet} грн`);
            this.closeFinedPanel(); // уведомляем, что панель закрыта
            this.allowParse = true;

            this.findPanelBet();
        } catch (e) {
            console.log("can't find panel", e.message)
        }
    }

    closeFinedPanel() {
        this.alert.open = false;

        this.logs.savePanelBid({
            bet: null,
            link: this.link,
        });

        this.logs.saveBotSuggest({
            botSuggest: ' ',
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
            const pastRound = document.querySelectorAll('.auction-round.ng-scope.past-round');
            const pastRoundArray = Array.from(pastRound);
            let pastRoundRows = [];
            
            pastRoundArray.forEach((item, index) =>{
                pastRoundRows = pastRoundRows.concat(Array.from(item.querySelectorAll('.row.auction-stage.stage-item')))
            })
            
            let currentRoundRows = currentRound.querySelectorAll('.row.auction-stage.stage-item');
            // let pastRoundRows = pastRound.querySelectorAll('.row.auction-stage.stage-item');

            let rows = pastRoundRows.concat(Array.from(currentRoundRows));

            return rows.map(row => {
                const bet = row.querySelector('.label-price.ng-binding');
                console.log("Making bet...")
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

    async enterBet(bets, username) {
        const {bet, allow} = bets;

        if (allow) {
            const stringBet = bet.toString();
            await this.page.waitForSelector('#clear-bid-button');
            await this.page.waitForSelector('#bid-amount-input');
            await this.page.waitForSelector('#place-bid-button');
            await this.page.click('#clear-bid-button');
            await this.page.waitForTimeout(1000);        /// check buttons
            console.log(bet, " Place bet")
            await this.page.type('#bid-amount-input', stringBet, {delay: 100}); ///
            await this.page.waitForTimeout(1000);  
            await this.page.click('#place-bid-button');          ///
            console.log("Ставка сделана")
            username === 'Бот' && this.logs.saveBotSuggest({
                botSuggest: `${bet} грн.`,
                link: this.link,
            });
        }

        if (!allow) {
            this.logs.saveBotSuggest({
                botSuggest: 'Ничего не ставит',
                link: this.link,
            });
        }

        this.bet.value = `${bet}`;
        this.bet.username = username;
    }

    async auth() {
        await this.page.click('#SignIn');
        await this.page.waitForSelector('[name=login].ivu-input', {visible: true});
        await this.page.type('[name=login].ivu-input', this.login);
        await this.page.type('[type=password]', this.password);
        await this.page.keyboard.press('Enter');

        try {
            await this.page.waitForNavigation();
            const isSecondLayout = await this.page.$('.navbar.navbar-default');

            isSecondLayout ? this.secondLayout() : this.firstLayout();
        } catch (e) {
            this.firstLayout();
        }
    }

    async firstLayout() {
        const currentURL = await this.page.url();

        this.browser.once('targetcreated', async (target) => {
            if (target.type() === 'page') {
                const page = await target.page();
                const url = page.url();

                if (url !== currentURL && !this.newPage) {
                    await this.page.close();

                    this.newPage = true;
                    console.log('new Page open', this.link);
                    this.page = page;
                    this.switchToSecondWindow();
                }
            }
        });

        const spanClick = async () => {
            const span = await this.page.$('a.smt-btn.smt-btn-warning.smt-btn-normal.smt-btn-circle.smt-btn-flat span');

            if (span) {
                try {
                    const notice = await this.page.$('.ivu-notice-notice.ivu-notice-notice-closable.ivu-notice-notice-with-desc.move-notice-leave-active.move-notice-leave-to');

                    if (notice) {
                        await this.stop({
                            message: `Невозможно запустить тендер "${this.link}" под именем компании "${this.company}"  ${notice}`,
                            disable: true
                        });

                        return;
                    }

                    await span.click();
                    await spanClick();
                } catch (e) {
                    // console.log('span click')
                }
            }
        };

        try {
            await this.page.waitForSelector('[data-qa=budget-min-step] div:last-child', {visible: true});
            const parsePercent = await this.page.$eval('[data-qa=budget-min-step] div:last-child', element => element.textContent);
            const budget = await this.page.$eval('[data-qa=budget-amount]', element => element.innerText);

            this.parseMinStep(parsePercent, budget);

            await this.page.waitForSelector('button.font-15.smt-btn.smt-btn-warning.smt-btn-normal.smt-btn-circle.smt-btn-flat', {visible: true});
            await this.page.click('button.font-15.smt-btn.smt-btn-warning.smt-btn-normal.smt-btn-circle.smt-btn-flat');

            await this.page.waitForSelector('a.smt-btn.smt-btn-warning.smt-btn-normal.smt-btn-circle.smt-btn-flat span');
            await spanClick();
        } catch (e) {
            console.log('На этой странице нет перехода к тендеру (скорее всего она общая и имеет несколько лотов)', e.message);
            await this.stop({message: `На этой странице нет перехода к тендеру (скорее всего она общая и имеет несколько лотов): ${this.link}`})
        }
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
        // this.parseTime({time: '', stop: true})
        console.log(step, 'bet step')
    }

    async parseTime({time = '', stop}) {
        if (this.isStop) {
            return
        }

        try {
            await this.page.waitForSelector('timer.ng-scope.ng-isolate-scope',{waitUntil: 'domcontentloaded'});
            const currentTime = await this.page.$eval('timer.ng-scope.ng-isolate-scope', time => time.innerText);
            if (stop) {
                if (currentTime.trim() === '0сек') {
                    this.parseTime({time: currentTime, stop});
                } else {
                    console.log(currentTime)
                    this.tender.timers.createTimer({
                        ms: timeToMs(currentTime),
                        link: this.link,
                        data: {
                            link: this.link,
                            login: this.login,
                            password: this.password,
                            proxyIP: this.proxy,
                            proxyLogin: this.proxyLogin,
                            proxyPassword: this.proxyPassword,
                            username: this.bet.username,
                            companyName: this.company,
                            minBet: this.algorithm.minBet,
                            currentMemberNumber: 0,
                            firstLaunch: this.firstLaunch
                        }
                    });

                    await this.stop({});
                }
            } else {

                currentTime !== time && this.tender.setTimeForNextStep({
                    timer: currentTime,
                    ms: !this.length ? timeToMs(currentTime) : 0,
                    link: this.link,
                });

                this.parseTime({time: currentTime, stop});
            }
        } catch (e) {
            console.log('упс parseMinStep', e.message)
            this.parseTimeCount++;
            if(this.parseTimeCount == 3){
                this.tender.sendMessageToClient({status: "Ошибка! Удалите и добавьте снова"});
            } else{
                this.parseTime({stop: false});
            }
        }
    }

    async switchToSecondWindow() {
        if (this.firstLaunch) {
            this.firstLaunch = false;
            console.log("switch parse time")
            try{
                await this.page.waitForSelector('.btn.btn-success');
                await this.page.click('.btn.btn-success');

                console.log('.btn.btn-success нажата');

                await this.parseTime({stop: true});
            } catch(e){
                await this.parseTime({stop: true});
            }
        } else {
            try {
                await this.page.waitForSelector('.btn.btn-success');
                await this.page.click('.btn.btn-success');

                console.log('.btn.btn-success нажата');

                this.parseTime({stop: false});
                this.search();
                this.findPanelBet();
            } catch (e) {
                console.log('.btn.btn-success не нажата', e.message);
            }
        }
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



