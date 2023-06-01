export default function Campaign({
    currentCampaignID,
    title,
    creator,
    target,
    refund,
    expiryDate,
    maxEarlyPledgers,
    handlePledge,
    handleWithdrawRefund,
    handleClaimTokens,
    handleCreatorWithdrawal,
}) {
    return (
        <div className="active-campaigns">
            <ul className="fields">
                <li>
                    <div> Campaign ID: </div>
                    <div> {currentCampaignID} </div>
                </li>
                <li>
                    <div> Campaign Title: </div>
                    <div> {title} </div>
                </li>
                <li>
                    <div> Creator: </div>
                    <div> {creator} </div>
                </li>
                <li>
                    <div> Campaign Funding Goal: </div>
                    <div> {target} </div>
                </li>
                <li>
                    <div> Campaign Refund Bonus: </div>
                    <div> {refund} </div>
                </li>
                <li>
                    <div> Campaign End Date: </div>
                    <div> {expiryDate} </div>
                </li>
                <li>
                    <div> Max Early Pledgers: </div>
                    <div> {maxEarlyPledgers} </div>
                </li>
                <label>
                    Pledge amount (in TXDC):
                    <input type="text" id="pledge-amount" />
                </label>
                <div
                    className="button"
                    id={currentCampaignID}
                    onClick={(e) => {
                        e.preventDefault();
                        handlePledge();
                    }}
                >
                    Pledge
                </div>
                <div>
                    Refunds are enabled after a campaign expires without meeting
                    its goal.
                </div>
                <div
                    className="button"
                    id={currentCampaignID}
                    onClick={(e) => {
                        e.preventDefault();
                        handleWithdrawRefund();
                    }}
                >
                    Withdraw Refund
                </div>
                <div>
                    Upon a successful campaign, pledgers can claim property
                    tokens.
                </div>
                <div
                    className="button"
                    id={currentCampaignID}
                    onClick={(e) => {
                        e.preventDefault();
                        handleClaimTokens();
                    }}
                >
                    Claim Property Tokens/Assets
                </div>
                <div>
                    Upon a successful campaign, the campaign creator can
                    withdraw pledged funds.
                </div>
                <label>
                    Address to withdraw campaign funds to:
                    <input type="text" id="withdraw-address" />
                </label>
                <div
                    className="button"
                    id={currentCampaignID}
                    onClick={(e) => {
                        e.preventDefault();
                        handleCreatorWithdrawal();
                    }}
                >
                    Creator Withdraw Funds
                </div>
            </ul>
        </div>
    );
}
