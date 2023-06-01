const { deployments, ethers, network } = require("hardhat");
const { assert, expect } = require("chai");
const { utils, provider } = require("ethers");
const { time } = require("@nomicfoundation/hardhat-network-helpers");
const {
    TITLE,
    TARGET_AMOUNT,
    REFUND_BONUS,
    CAMPAIGN_LENGTH_IN_DAYS,
    MAX_EARLY_PLEDGERS,
    networkConfig,
} = require("../helper-hardhat-config");
const chainId = network.config.chainId;
//const usdcAddress = networkConfig[chainId]["usdcAddress"];
const ERC20ABI = require("../utils/ERC20ABI.json");
var accounts,
    deployer,
    pledger,
    rando,
    pledgerCalling,
    randoCalling,
    daontownToken,
    domCrowdfund;

// Hardhat localhost chain ID for development is "31337"
if (chainId == 1337) {
    describe("DAOntown Token Unit Tests", function () {
        beforeEach(async function () {
            accounts = await ethers.getSigners();
            deployer = accounts[0];
            pledger = accounts[1];
            rando = accounts[2];

            await deployments.fixture(["deploy"]);
            //t0wnToken = new ethers.Contract(usdcAddress, ERC20ABI, provider);
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
                it("mints and sends tokens correctly", async function () {
                    await daontownToken.mint(deployer.address, 10000);
                    const balance = await daontownToken.balanceOf(
                        deployer.address
                    );
                    assert.equal(balance.toString(), 10000);
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
                    // Campaign has met goal and pledger has pledged.
                    const [, , , , expiryDate] =
                        await domCrowdfund.getCampaignInfo(0);
                    await domCrowdfund.connect(pledger).pledge(0, {
                        value: utils.parseEther("0.0009"),
                    });
                    const amount = await domCrowdfund.getAmountPledged(
                        0,
                        pledger.address
                    );
                    await pledgerCalling.claimDAOntownTokens(0);
                    const tokenBalance = await daontownToken.balanceOf(
                        pledger.address
                    );
                    assert.equal(tokenBalance.toString(), amount.toString());
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
