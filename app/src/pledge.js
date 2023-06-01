export default async function pledge(
    domCrowdfund,
    signer,
    campaignID,
    pledgeAmount
) {
    const pledgeTx = await domCrowdfund
        .connect(signer)
        .pledge(campaignID, { value: pledgeAmount });
    var goalMet;
    domCrowdfund.on("CampaignGoalMet_RAWK", function (arg1) {
        goalMet = arg2;
        //domCrowdfund.getCampaignInfo;
    });
    const receipt = await pledgeTx.wait();
    return goalMet;
}

// const creationEvent = receipt.events[0];
// const { currentID } = creationEvent.args;
// console.log(currentID.toString());
// return currentID;
