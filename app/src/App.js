import { ethers } from "ethers";
import { useEffect, useState } from "react";
import detectEthereumProvider from "@metamask/detect-provider";
import NewCampaign from "./NewCampaign";
import ExistingCampaign from "./ExistingCampaign";
import crowdfundContract from "./artifacts/contracts/DomCrowdfund.sol/DomCrowdfund.json";
import daontownTokenContract from "./artifacts/contracts/DAOntownToken.sol/DAOntownToken.json";

function App() {
    const [account, setAccount] = useState();
    const [signer, setSigner] = useState();
    const [domCrowdfund, setDomCrowdfund] = useState();
    const [daontownToken, setDAOntownToken] = useState();
    const [campaigns, setCampaigns] = useState([]);
    const [existingCampaigns, setExistingCampaigns] = useState([]);
    var existingCampaign;

    useEffect(() => {
        async function getAccountsAndContracts() {
            const provider = await detectEthereumProvider();
            if (provider) {
                const ethersProvider = new ethers.providers.Web3Provider(
                    provider
                );
                const signer = ethersProvider.getSigner();
                const accounts = await provider.request({
                    method: "eth_requestAccounts",
                });
                setAccount(accounts[0]);
                setSigner(signer);
            } else {
                throw new Error("MetaMask not found");
            }

            const crowdfundAddress =
                "0xCdB16867FF1f63b2F976B486d4ec3b4CD028fCDf";
            const domCrowdfundInstance = new ethers.Contract(
                crowdfundAddress,
                crowdfundContract.abi,
                signer
            );
            setDomCrowdfund(domCrowdfundInstance);

            const daontownTokenAddress =
                "0xFa258af3f838193Db1D6143f4693025a40A628b8";
            const daontownTokenInstance = new ethers.Contract(
                daontownTokenAddress,
                daontownTokenContract.abi,
                signer
            );
            setDAOntownToken(daontownTokenInstance);
        }

        getAccountsAndContracts();
    }, [account, signer]);

    async function createCampaign() {
        try {
            const title = document.getElementById("title").value;
            const creator = await signer.getAddress();
            const target = ethers.utils.parseUnits(
                document.getElementById("target").value.toString(),
                18
            );
            const refund = ethers.utils.parseUnits(
                document.getElementById("refund").value.toString(),
                18
            );
            const campaignLengthInDays =
                document.getElementById("campaign-length").value;

            const maxEarlyPledgers =
                document.getElementById("early-pledgers").value;

            // Calling function on Crowdfund contract
            const createTx = await domCrowdfund
                .connect(signer)
                .createCampaign(
                    title,
                    target,
                    refund,
                    campaignLengthInDays,
                    maxEarlyPledgers,
                    { value: refund, gasLimit: 500000 }
                );

            await createTx.wait();

            let campaignID = await new Promise((resolve) => {
                domCrowdfund.getCampaignCount().then((campaignCount) => {
                    const campaignID = campaignCount.toString() - 1;
                    resolve(campaignID);
                });
            });

            let expiryDate = await new Promise((resolve) => {
                domCrowdfund.getCampaignInfo(campaignID).then((responses) => {
                    console.log(responses);
                    const [, , , , date] = responses;
                    const endDate = date.toLocaleString();
                    resolve(endDate);
                });
            });

            const newCampaign = {
                campaignID,
                title,
                creator,
                target: target.toString(),
                refund: refund.toString(),
                expiryDate,
                maxEarlyPledgers,
                handlePledge: async () => {
                    domCrowdfund.on("CampaignPledge", () => {
                        document.getElementsByClassName("button").innerText =
                            "You have successfully pledged to campaign!";
                    });
                    const pledgeAmount = ethers.utils.parseUnits(
                        document
                            .getElementById("pledge-amount")
                            .value.toString(),
                        18
                    );
                    const pledgeTx = await domCrowdfund
                        .connect(signer)
                        .pledge(campaignID, { value: pledgeAmount });
                    await pledgeTx.wait();
                },
                handleWithdrawRefund: async () => {
                    const withdrawTx = await domCrowdfund
                        .connect(signer)
                        .withdrawRefund(campaignID);
                    await withdrawTx.wait();
                },
                handleClaimTokens: async () => {
                    const claimTX = daontownToken
                        .connect(signer)
                        .claimDAOntownTokens(campaignID);
                    await claimTX.wait();
                },
                handleCreatorWithdrawal: async () => {
                    const address =
                        document.getElementById("withdraw-address").value;
                    const creatorWithdrawTx = await domCrowdfund
                        .connect(signer)
                        .creatorWithdrawal(campaignID, address);
                    await creatorWithdrawTx.wait();
                },
            };
            console.log(newCampaign);
            console.log(campaignID.toString());

            setCampaigns((campaigns) => [...campaigns, newCampaign]);
        } catch (e) {
            console.log(e);
        }
    }

    async function findCampaign() {
        try {
            const campaignID = document.getElementById("id").value;
            let [title, creator, target, refund, expiryDate, maxEarlyPledgers] =
                await domCrowdfund.getCampaignInfo(campaignID);

            let [
                totalPledgedAmount,
                percentOfGoal,
                isGoalMet,
                creatorHasWithdrawn,
            ] = await domCrowdfund.getCampaignFundingStatus(campaignID);

            existingCampaign = {
                campaignID,
                title,
                creator,
                target: target.toString(),
                refund: refund.toString(),
                expiryDate: expiryDate.toLocaleString(),
                maxEarlyPledgers,
                totalPledgedAmount: totalPledgedAmount.toString(),
                percentOfGoal: percentOfGoal.toString(),
                isGoalMet: isGoalMet.toString(),
                creatorHasWithdrawn: creatorHasWithdrawn.toString(),
                handlePledge: async () => {
                    domCrowdfund.on("CampaignPledge", () => {
                        document.getElementsByClassName("button").innerText =
                            "You have successfully pledged to campaign!";
                    });
                    const pledgeAmount = ethers.utils.parseUnits(
                        document
                            .getElementById("pledge-amount")
                            .value.toString(),
                        18
                    );
                    const pledgeTx = await domCrowdfund
                        .connect(signer)
                        .pledge(campaignID, { value: pledgeAmount });
                    await pledgeTx.wait();
                },
                handleWithdrawRefund: async () => {
                    const withdrawTx = await domCrowdfund
                        .connect(signer)
                        .withdrawRefund(campaignID);
                    await withdrawTx.wait();
                },
                handleClaimTokens: async () => {
                    const claimTX = daontownToken
                        .connect(signer)
                        .claimDAOntownTokens(campaignID);
                    await claimTX.wait();
                },
                handleCreatorWithdrawal: async () => {
                    const address =
                        document.getElementById("withdraw-address").value;
                    const creatorWithdrawTx = await domCrowdfund
                        .connect(signer)
                        .creatorWithdrawal(campaignID, address);
                    await creatorWithdrawTx.wait();
                },
            };
            console.log(existingCampaign);
            console.log(campaignID.toString());

            setExistingCampaigns((existingCampaigns) => [
                ...existingCampaigns,
                existingCampaign,
            ]);
        } catch (e) {
            console.log(e);
        }
    }

    return (
        <div className="fullbg">
            <center>
                <h1> Crowdfunding Escrow Platform Using Dominant Assurance </h1>
            </center>

            <div className="create-campaign">
                <h1> Create New Campaign </h1>
                <label>
                    Campaign Title
                    <input type="text" id="title" />
                </label>

                <label>
                    Campaign Funding Goal (in TXDC)
                    <input type="text" id="target" />
                </label>

                <label>
                    Pledger Refund Bonus (in TXDC)
                    <input type="text" id="refund" />
                </label>

                <label>
                    Campaign Length (in Days)
                    <input type="text" id="campaign-length" />
                </label>

                <label>
                    Max Amount of Early Pledgers
                    <input type="text" id="early-pledgers" />
                </label>

                <div
                    className="button"
                    id="new"
                    onClick={(e) => {
                        e.preventDefault();
                        createCampaign();
                    }}
                >
                    Create Campaign
                </div>
            </div>
            <div className="active-campaigns">
                <h1> Pledge to New Campaign </h1>

                <div id="container">
                    {campaigns.map((campaign) => {
                        return (
                            <NewCampaign
                                key={campaign.campaignID}
                                {...campaign}
                            />
                        );
                    })}
                </div>
            </div>
            <div className="closed-campaigns">
                <h1> Existing Campaigns </h1>
                <label>
                    Campaign ID:
                    <input type="text" id="id" />
                </label>
                <div
                    className="button"
                    id="find"
                    onClick={(e) => {
                        e.preventDefault();
                        findCampaign();
                    }}
                >
                    Find Campaign
                </div>
                <div id="container">
                    {existingCampaigns.map((campaign) => {
                        return (
                            <ExistingCampaign
                                key={campaign.campaignID}
                                {...campaign}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default App;
