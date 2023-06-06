const { deployments, ethers, network } = require("hardhat");
const { assert, expect } = require("chai");
const { utils } = require("ethers");
const {
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
} = require("../helper-hardhat-config");
const chainId = network.config.chainId;
//const usdcAddress = networkConfig[chainId]["usdcAddress"];
//const ERC20ABI = require("../utils/ERC20ABI.json");
var accounts,
    deployer,
    pledger,
    rando,
    pledgerCalling,
    randoCalling,
    daontownToken,
    domCrowdfund;

// Hardhat localhost chain ID for development is "31337"
if (chainId == 31337) {
    describe("DAOntown Token Unit Tests", function () {
        beforeEach(async function () {
            accounts = await ethers.getSigners();
            deployer = accounts[0];
            pledger = accounts[1];
            rando = accounts[2];

            await deployments.fixture(["deploy"]);
            daontownToken = await ethers.getContract("DAOntownToken");
            domCrowdfund = await ethers.getContract("DomCrowdfund");
            pledgerCalling = daontownToken.connect(pledger);
            randoCalling = daontownToken.connect(rando);
        });

        describe("Constructor", function () {
            it("initializes Dom Crowdfund contract address correctly", async function () {
                const domCrowdfundAddress = await domCrowdfund.getAddress();
                assert.equal(domCrowdfundAddress, domCrowdfund.address);
            });
            describe("mint()", function () {
                it("reverts if called by non-owner", async function () {
                    await expect(
                        pledgerCalling.mint(pledger.address, 10000)
                    ).to.be.revertedWith("Ownable: caller is not the owner");
                });
            });
            describe("claimDAOntownTokens()", function () {
                beforeEach(async function () {
                    await domCrowdfund.createCampaign(
                        TITLE,
                        TARGET_AMOUNT,
                        REFUND_BONUS,
                        CAMPAIGN_LENGTH_IN_DAYS,
                        MAX_EARLY_PLEDGERS,
                        { value: REFUND_BONUS }
                    );
                    // DAOntown Campaign ID is 0 in crowdfund contract.
                    await domCrowdfund.connect(pledger).pledge(0, {
                        value: utils.parseEther("0.0001"),
                    });
                });

                it("reverts if called by non-pledger", async function () {
                    // Rando has not pledged to campaign.
                    await expect(
                        randoCalling.claimDAOntownTokens(0)
                    ).to.be.revertedWith(
                        "Must be crowdfunding campaign pledger."
                    );
                });
                it("reverts if campaign goal has not been met", async function () {
                    // Pledger has pledged to Campaign but it has not met goal.
                    const [, , , , expiryDate] =
                        await domCrowdfund.getCampaignInfo(0);
                    await expect(
                        pledgerCalling.claimDAOntownTokens(0)
                    ).to.be.revertedWith("Campaign did not meet funding goal.");
                });
                it("allows pledger to mint and withdraw tokens 1-for-1 with pledge amount", async function () {
                    await domCrowdfund.connect(pledger).pledge(0, {
                        value: utils.parseEther("0.0009"),
                    });
                    const amount = await domCrowdfund.getAmountPledged(
                        0,
                        pledger.address
                    );
                    // Campaign has met goal and pledger has pledged.
                    await pledgerCalling.claimDAOntownTokens(0);
                    const tokenBalance = await daontownToken.balanceOf(
                        pledger.address
                    );
                    assert.equal(tokenBalance.toString(), amount.toString());
                });
                it("only allows pledger to mint/withdraw once", async function () {
                    await domCrowdfund.connect(pledger).pledge(0, {
                        value: utils.parseEther("0.0009"),
                    });
                    const amount = await domCrowdfund.getAmountPledged(
                        0,
                        pledger.address
                    );
                    // Campaign has met goal and pledger has pledged.
                    await pledgerCalling.claimDAOntownTokens(0);
                    await expect(
                        pledgerCalling.claimDAOntownTokens(0)
                    ).to.be.revertedWith("Already minted your allotment.");
                });
                it("allows pledger to mint/withdraw from multiple campaigns", async function () {
                    await domCrowdfund.createCampaign(
                        TITLE2,
                        TARGET_AMOUNT2,
                        REFUND_BONUS2,
                        CAMPAIGN_LENGTH_IN_DAYS2,
                        MAX_EARLY_PLEDGERS2,
                        { value: REFUND_BONUS2 }
                    );
                    await domCrowdfund.connect(pledger).pledge(0, {
                        value: utils.parseEther("0.0009"),
                    });
                    await domCrowdfund.connect(pledger).pledge(1, {
                        value: TARGET_AMOUNT2,
                    });

                    await pledgerCalling.claimDAOntownTokens(0);
                    await expect(pledgerCalling.claimDAOntownTokens(1)).to.not
                        .be.reverted;
                });
            });
            describe("Modifiers", function () {
                it("allows ownership transfer", async function () {
                    await expect(daontownToken.transferOwnership(rando.address))
                        .to.not.be.reverted;
                    const owner = await daontownToken.owner();
                    assert.equal(owner, rando.address);
                });
                it("reentrancy guard tests?", async function () {});
            });
        });
    });
}
