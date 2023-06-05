const { utils } = require("ethers");

const TITLE = "DAOntown Property";
const TARGET_AMOUNT = utils.parseEther("0.001");
const REFUND_BONUS = utils.parseEther("0.0002");
const CAMPAIGN_LENGTH_IN_DAYS = 20; // Days
const MAX_EARLY_PLEDGERS = 4;
const TITLE2 = "Chocobo Town";
const TARGET_AMOUNT2 = utils.parseEther("0.7");
const REFUND_BONUS2 = utils.parseEther("0.077");
const CAMPAIGN_LENGTH_IN_DAYS2 = 1;
const MAX_EARLY_PLEDGERS2 = 1;
const INITIAL_SUPPLY = 99;

module.exports = {
    TITLE,
    TARGET_AMOUNT,
    REFUND_BONUS,
    CAMPAIGN_LENGTH_IN_DAYS,
    MAX_EARLY_PLEDGERS,
    TITLE2,
    TARGET_AMOUNT2,
    REFUND_BONUS2,
    CAMPAIGN_LENGTH_IN_DAYS2,
    MAX_EARLY_PLEDGERS2,
    INITIAL_SUPPLY,
};
