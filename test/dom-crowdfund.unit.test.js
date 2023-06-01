const { deployments, ethers, network, deployer } = require("hardhat");
const { assert, expect } = require("chai");
const { utils, provider } = require("ethers");
const { time } = require("@nomicfoundation/hardhat-network-helpers");
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
    networkConfig,
} = require("../helper-hardhat-config");
const chainId = network.config.chainId;
var accounts,
    creator1,
    creator2,
    pledger,
    earlyPledger,
    rando,
    pledgerCalling,
    earlyPledgerCalling,
    randoCalling,
    creator1Calling,
    creator2Calling,
    domCrowdfund;

//async function

// Hardhat localhost chain ID for development is "31337"
if (chainId == 1337) {
    describe("Dominant Crowdfund Unit Tests", function () {
        beforeEach(async function () {
            accounts = await ethers.getSigners();
            creator1 = accounts[1];
            creator2 = accounts[2];
            pledger = accounts[3];
            earlyPledger = accounts[4];
            rando = accounts[5];

            await deployments.fixture(["deploy"]);
            domCrowdfund = await ethers.getContract("DomCrowdfund");
            creator1Calling = domCrowdfund.connect(creator1);
            creator2Calling = domCrowdfund.connect(creator2);
            pledgerCalling = domCrowdfund.connect(pledger);
            earlyPledgerCalling = domCrowdfund.connect(earlyPledger);
            randoCalling = domCrowdfund.connect(rando);
        });
        it("allows ownership transfer", async function () {
            await expect(domCrowdfund.transferOwnership(rando.address)).to.not
                .be.reverted;
            const owner = await domCrowdfund.owner();
            assert.equal(owner, rando.address);
        });
        describe("createCampaign()", function () {
            it("reverts if refund bonus is greater than target amount", async function () {
                const smallTarget = utils.parseEther("1");
                const bigRefundBonus = utils.parseEther("10");
                await expect(
                    creator1Calling.createCampaign(
                        TITLE,
                        smallTarget,
                        bigRefundBonus,
                        CAMPAIGN_LENGTH_IN_DAYS,
                        MAX_EARLY_PLEDGERS,
                        { value: bigRefundBonus }
                    )
                ).to.be.revertedWith(
                    "Campaign goal must be greater than bonus."
                );
            });
            it("reverts if min Ether is not sent at contract creation", async function () {
                await expect(
                    creator1Calling.createCampaign(
                        TITLE,
                        TARGET_AMOUNT,
                        REFUND_BONUS,
                        CAMPAIGN_LENGTH_IN_DAYS,
                        MAX_EARLY_PLEDGERS,
                        { value: utils.parseEther("0.000000001") } // Much less than refund bonus
                    )
                ).to.be.revertedWith(
                    "Funds sent to contract must equal refund bonus amount."
                );
            });
            it("populates campaign variables correctly", async function () {
                await creator1Calling.createCampaign(
                    TITLE,
                    TARGET_AMOUNT,
                    REFUND_BONUS,
                    CAMPAIGN_LENGTH_IN_DAYS,
                    MAX_EARLY_PLEDGERS,
                    { value: utils.parseEther("0.0002") }
                );
                const balance = await domCrowdfund.getBalance();
                assert.equal(balance.toString(), REFUND_BONUS.toString());
                const [, , target, , ,] = await domCrowdfund.getCampaignInfo(0);
                assert.equal(target.toString(), TARGET_AMOUNT.toString());
                const [, , , , endDate] = await domCrowdfund.getCampaignInfo(0);
                const campaignEnd =
                    (await time.latest()) +
                    CAMPAIGN_LENGTH_IN_DAYS * 24 * 60 * 60;
                assert.equal(endDate.toString(), campaignEnd.toString());
            });
            it("pushes to campaign array and creator mapping correctly", async function () {
                await creator1Calling.createCampaign(
                    TITLE,
                    TARGET_AMOUNT,
                    REFUND_BONUS,
                    CAMPAIGN_LENGTH_IN_DAYS,
                    MAX_EARLY_PLEDGERS,
                    { value: REFUND_BONUS }
                );

                const campaignCount = await domCrowdfund.getCampaignCount();
                assert.equal(campaignCount, 1);

                const [, , , , , earlyPledgerMax, , , , , ,] =
                    await domCrowdfund.creatorToCampaign(creator1.address);
                assert.equal(earlyPledgerMax, MAX_EARLY_PLEDGERS);
            });
            it("adds a second campaign correctly", async function () {
                // const campaignCount = await domCrowdfund.getCampaignCount();
                // assert.equal(campaignCount, 2);
                //await expect(domCrowdfund.allCampaigns()).to.be.an('array').that.includes()
            });
            it("emits CampaignCreated event", async function () {
                await expect(
                    creator1Calling.createCampaign(
                        TITLE,
                        TARGET_AMOUNT,
                        REFUND_BONUS,
                        CAMPAIGN_LENGTH_IN_DAYS,
                        MAX_EARLY_PLEDGERS,
                        { value: REFUND_BONUS }
                    )
                ).to.emit(domCrowdfund, "CampaignCreated");
            });
        });
        describe("pledge()", function () {
            var creator2Target = utils.parseEther("0.7");
            var creator2Bonus = utils.parseEther("0.077");
            beforeEach(async function () {
                await creator1Calling.createCampaign(
                    TITLE,
                    TARGET_AMOUNT,
                    REFUND_BONUS,
                    CAMPAIGN_LENGTH_IN_DAYS,
                    MAX_EARLY_PLEDGERS,
                    { value: REFUND_BONUS }
                );

                await creator2Calling.createCampaign(
                    TITLE2,
                    TARGET_AMOUNT2,
                    REFUND_BONUS2,
                    CAMPAIGN_LENGTH_IN_DAYS2,
                    MAX_EARLY_PLEDGERS2,
                    { value: REFUND_BONUS2 }
                );
            });
            it("reverts if campaign does not exist", async function () {
                await expect(
                    pledgerCalling.pledge(4, {
                        value: utils.parseEther("0.0001"),
                    })
                ).to.be.revertedWithCustomError(
                    domCrowdfund,
                    "CampaignIDDoesNotExist"
                );
            });
            it("reverts if campaign has expired", async function () {
                await time.increase(86460); // 1 day and 1 minute in future.
                await expect(
                    pledgerCalling.pledge(1, {
                        value: utils.parseEther("0.0001"),
                    })
                ).to.be.revertedWithCustomError(
                    domCrowdfund,
                    "CampaignHasExpired"
                );
            });
            it("reverts if campaign goal has been met", async function () {
                await earlyPledgerCalling.pledge(0, { value: TARGET_AMOUNT });
                await expect(
                    randoCalling.pledge(0, { value: TARGET_AMOUNT })
                ).to.be.revertedWithCustomError(
                    domCrowdfund,
                    "SuccessfulCampaign_FunctionClosed"
                );
            });
            it("reverts if sender has sent 0 funds with call", async function () {
                await expect(
                    pledgerCalling.pledge(0)
                ).to.be.revertedWithCustomError(
                    domCrowdfund,
                    "MustSendPledgeFunds"
                );
            });
            it("calculates early pledgers correctly", async function () {
                await earlyPledgerCalling.pledge(1, {
                    value: utils.parseEther("0.0001"),
                });
                const earlyPledgers =
                    await domCrowdfund.getCampaignEarlyPledgers(1);
                await expect(earlyPledgers)
                    .to.be.an("array")
                    .that.includes(earlyPledger.address);
                await pledgerCalling.pledge(1, {
                    value: utils.parseEther("0.0001"),
                });
                const earlyPledgers2 =
                    await domCrowdfund.getCampaignEarlyPledgers(1);
                // Array will only have 1 address, since maxEarlyPledgers=1 for campaign ID #1.
                assert.equal(earlyPledgers2.length, 1);
            });
            it("updates pledgers and early pledgers variables", async function () {
                await earlyPledgerCalling.pledge(0, {
                    value: utils.parseEther("0.0001"),
                });

                const pledgers = await domCrowdfund.getCampaignPledgers(0);
                await expect(pledgers)
                    .to.be.an("array")
                    .that.includes(earlyPledger.address);

                const earlyPledgerBool =
                    await domCrowdfund.campaignEarlyPledgers(
                        0,
                        earlyPledger.address
                    );
                assert.equal(earlyPledgerBool, true);

                const pledgerAmount = await domCrowdfund.getAmountPledged(
                    0,
                    pledger.address
                );
                assert(pledgerAmount.toString(), utils.parseEther("0.0002"));
            });
            it("deposits correct amount of funds", async function () {
                await earlyPledgerCalling.pledge(1, {
                    value: utils.parseEther("0.0001"),
                });
                const balance =
                    (await domCrowdfund.getBalance()) -
                    REFUND_BONUS -
                    creator2Bonus;
                assert(balance.toString(), utils.parseEther("0.0001"));
            });
            it("emits pledge event", async function () {
                await expect(
                    pledgerCalling.pledge(0, {
                        value: utils.parseEther("0.0001"),
                    })
                ).to.emit(domCrowdfund, "CampaignPledge");
            });
            it("updates funded amount", async function () {
                await pledgerCalling.pledge(0, {
                    value: utils.parseEther("0.0001"),
                });
                const [totalCampaignPledgedAmount, , ,] =
                    await domCrowdfund.getCampaignFundingStatus(0);
                assert(
                    totalCampaignPledgedAmount.toString(),
                    utils.parseEther("0.0002")
                );
            });
            it("if above goal, closes campaign and emits campaign success event", async function () {
                await expect(
                    pledgerCalling.pledge(0, {
                        value: utils.parseEther("0.001"),
                    })
                ).to.emit(domCrowdfund, "CampaignGoalMet_RAWK");
            });
            describe("withdrawRefund()", function () {
                beforeEach(async function () {
                    await earlyPledgerCalling.pledge(1, {
                        value: utils.parseEther("0.0001"),
                    });
                    await pledgerCalling.pledge(1, {
                        value: utils.parseEther("0.0001"),
                    });
                });
                it("NonReentrant test?", async function () {});
                it("reverts if campaign is active", async function () {
                    await expect(
                        earlyPledgerCalling.withdrawRefund(1)
                    ).to.be.revertedWithCustomError(
                        domCrowdfund,
                        "CampaignIsStillActive"
                    );
                });
                it("reverts if caller is not pledger", async function () {
                    await time.increase(86_460); // 1 day and 1 minute
                    await expect(
                        randoCalling.withdrawRefund(1)
                    ).to.be.revertedWithCustomError(
                        domCrowdfund,
                        "CallerIsNotAPledger"
                    );
                });
                it("reverts if campaign has met goal", async function () {
                    await pledgerCalling.pledge(1, {
                        value: utils.parseEther("0.7"),
                    });
                    // withdrawRefund()'s temporal require is executed first, so increase time
                    // to bypass.
                    await time.increase(86_460);
                    await expect(
                        pledgerCalling.withdrawRefund(1)
                    ).to.be.revertedWithCustomError(
                        domCrowdfund,
                        "SuccessfulCampaign_FunctionClosed"
                    );
                });
                it("processes refund withdrawal and reverts if address has already withdrawn their refund", async function () {
                    await time.increase(86_460);
                    // Should only refund pledged amount since pledger was second to pledge
                    // and Campaign ID #1 only has one early pledger slot.
                    await expect(
                        pledgerCalling.withdrawRefund(1)
                    ).to.changeEtherBalance(
                        pledger.address,
                        utils.parseEther("0.0001")
                    );
                    await expect(
                        pledgerCalling.withdrawRefund(1)
                    ).to.be.revertedWithCustomError(
                        domCrowdfund,
                        "AlreadyWithdrawn"
                    );
                });
                it("emits a refund withdrawn event", async function () {
                    await time.increase(86_460);
                    await expect(pledgerCalling.withdrawRefund(1))
                        .to.emit(domCrowdfund, "CampaignRefundWithdrawal")
                        .withArgs(
                            1,
                            pledger.address,
                            utils.parseEther("0.0001")
                        );
                });
            });
            describe("creatorWithdrawal()", function () {
                it("reverts if called by non-creator account", async function () {
                    await pledgerCalling.pledge(0, {
                        value: utils.parseEther("0.001"),
                    });
                    await expect(
                        randoCalling.creatorWithdrawal(0, rando.address)
                    ).to.be.revertedWithCustomError(
                        domCrowdfund,
                        "CallerIsNotCampaignCreator"
                    );
                });
                it("reverts if campaign goal has not been met", async function () {
                    await expect(
                        creator1Calling.creatorWithdrawal(0, creator1.address)
                    ).to.be.revertedWithCustomError(
                        domCrowdfund,
                        "CampaignGoalIsNotMet"
                    );
                });
                it("processes creator withdrawal and reverts if creator has already withdrawn", async function () {
                    await pledgerCalling.pledge(0, {
                        value: utils.parseEther("0.001"),
                    });
                    await expect(
                        creator1Calling.creatorWithdrawal(0, creator1.address)
                    ).to.changeEtherBalance(
                        creator1.address,
                        utils.parseEther("0.001")
                    );
                    await expect(
                        creator1Calling.creatorWithdrawal(0, creator1.address)
                    ).to.be.revertedWithCustomError(
                        domCrowdfund,
                        "AlreadyWithdrawn"
                    );
                });
                it("emits sent event", async function () {
                    await pledgerCalling.pledge(0, {
                        value: utils.parseEther("0.001"),
                    });
                    await expect(
                        creator1Calling.creatorWithdrawal(0, creator1.address)
                    )
                        .to.emit(domCrowdfund, "CampaignFundsSent")
                        .withArgs(creator1.address);
                });
            });
            describe("Getters not already tested", function () {
                // getCampaignInfo(), getCampaignCount(), getCampaignPledgers(), getCampaignEarlyPledgers(),
                // and getAmountPledged() are tested in other tests above.
                it("getCampaignFundingStatus() returns % goal and goal met bool", async function () {
                    await earlyPledgerCalling.pledge(0, {
                        value: utils.parseEther("0.00054"),
                    });
                    const actualPercentGoal =
                        (utils.parseEther("0.00054") / TARGET_AMOUNT) * 100;
                    const [, percentGoal, goalMetBool] =
                        await domCrowdfund.getCampaignFundingStatus(0);
                    assert.equal(percentGoal.toString(), actualPercentGoal);
                    assert.equal(goalMetBool, false);
                });
                it("getCampaignRefundStatus() gets some good stuff", async function () {
                    await earlyPledgerCalling.pledge(1, {
                        value: utils.parseEther("0.004"),
                    });
                    await pledgerCalling.pledge(1, {
                        value: utils.parseEther("0.001"),
                    });
                    await time.increase(86_460);
                    await pledgerCalling.withdrawRefund(1);
                    const [amountRefunded] =
                        await domCrowdfund.getCampaignRefundStatus(1);
                    assert.equal(amountRefunded.toString(), "0.001");
                    //assert.equal(percentRefunded, 20);
                    //assert.equal(notRefunded[0], earlyPledger.address);
                    //assert.equal(refundsCompletedBool, false);
                });
            });
        });
    });
}
