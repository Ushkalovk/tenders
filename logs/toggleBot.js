const Tender = require("../models/tender");
const sendMessageToClient = require("../tenders/sendMessageToClient");
const activeTenders = require("../tenders/activeTenders");

const toggleBotOnSelenium = (link, isBotOn) => {
  activeTenders[link] && activeTenders[link].toggleBot(isBotOn);
  console.log(activeTenders, "--activeTenders");
  console.log(activeTenders[link], "--activeTenders[link]");
  console.log(link, "--link");
};

module.exports = async (req, res) => {
  const { link, email, role } = req.body;
  const tender = await Tender.findOne({ link: link });

  if (tender.creator === email || role === "admin") {
    try {
      tender.isBotOn = !tender.isBotOn;
      toggleBotOnSelenium(link, tender.isBotOn);

      tender.save((err) => {
        if (err) throw err;

        sendMessageToClient({ toggleBot: true, isBotOn: tender.isBotOn, link });
        res.json({ status: true, message: "Бот включен" });
      });
    } catch (error) {
      await res.json({ status: false, message: "Не получить включить бота" });
    }
  } else {
    await res.json({
      status: false,
      message: "Включить бота может только создатель или админ",
    });
  }
};
