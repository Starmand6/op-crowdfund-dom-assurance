<a name="readme-top"></a>

# Crowdfunding Escrow Platform Using Dominant Assurance

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li><a href="#about-the-project">About The Project</a></li>
    <li><a href="#project-technicals">Project Technicals</a></li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#for-the-devs">For The Devs</a></li>
    <li><a href="#future-considerations">Future Considerations</a></li>
    <li><a href="#lessons-learned">Lessons Learned</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>

<!-- ABOUT THE PROJECT -->

## About The Project

This project translates Alex Tabarrok’s “dominant assurance” contracts idea to the blockchain in the form of a working escrow contract for the crowdfunding of a property. Click [here](https://foresight.org/summary/dominant-assurance-contracts-alex-tabarrok-george-mason-university/) for more info on dominant assurance. This alternative mechanism can be extended to fund any public good.

Using "DAOntown" as the main campaign example, any pledger that pledges to the campaign will be able to mint and claim DAOntown tokens, which could represent their share of governance rights, land use rights, etc. The token contract is presently written with the ERC20/XRC20 standard, but could easily be replaced with the ERC/XRC721 or other token standard if desired.

### DomCrowdfund.sol Crowdfunding Contract Functionality

-   `createCampaign()` is called by a campaign creator to populate the campaign struct for all users. Each campaign is given a unique campaign ID. The campaign struct is organized as follows:
    ```sol
    struct Campaign {
        string title;
        address creator;
        uint256 targetAmount;
        uint256 refundBonus;
        uint256 campaignExpiryDate;
        uint32 maxEarlyPledgers;
        address[] pledgers;
        address[] earlyPedgers;
        uint256 totalPledgedAmount;
        bool isGoalMet;
        bool hasCompletedRefunds;
        bool creatorHasWithdrawnFunds;
    }
    ```
-   `pledge()` will make a pledge to the campaign associated with the campaign ID that the user enters. Pledge sends funds to the crowdfunding platform contract.
-   `withdrawRefund()` is only callable after a campaign expires that has not met its goal. This function can only be called by pledgers of the specific unsuccessful campaign.
-   `creatorWithdrawal()` can only be called by the creator of the specific campaign ID entered as an argument. This function can only be called upon successful campaign. Creator can choose any address to withdraw all the campaign funds to.
-   A bunch of getters: `getCampaignInfo()`, `getCampaignFundingStatus()`, `getCampaignCount()`, `getBalance()`, `getCampaignEarlyPledgers()`, `getCampaignPledgers()`, `getAmountPledged()`, `getAddress()`, `getCampaignRefundStatus()`

### DAOntownToken.sol XRC20 Token Contract Functionality

-   `claimDAOntownTokens()` is really the only function that can be called on this contract by campaign pledgers. In this project example, DAOntown tokens are minted and sent 1-for-1 to pledgers based on how much TXDC they pledged to the campaign. These tokens can be used as governance tokens, land use right tokens, etc.
-   `mint()` can only be called by the token contract owner. Ownership could be transferred to a multisig after a successful campaign so that the property token holders can vote on if they want to mint more tokens or keep with the existing supply.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- PROJECT TECHNICALS -->

## Project Technicals

Crowdfund w/ Dominant Assurance (DomCrowdfund.sol) Contract Address: xdc02e6dBd011cA192FAb56713D0ACb0ac034f0C878

[BlocksScan Crowdfund Contract Page - XDC Apothem Testnet](https://explorer.apothem.network/address/xdc02e6dbd011ca192fab56713d0acb0ac034f0c878#readContract)

DAOntown Token (DAOntownToken.sol) Contract Address: xdc0fAeF7797c27238dA41Bb0b35F7d0E87D3F2D110

[BlocksScan DAOntown Token Contract Page - XDC Apothem Testnet](https://explorer.apothem.network/tokens/xdc0faef7797c27238da41bb0b35f7d0e87d3f2d110#token-transfer)

[Live dApp Link](https://black-night-1404.on.fleek.co/)

Test Coverage Report:

![Alt text](./images/TestCoverage-Hack1.png?raw=true "Test Coverage via Hardhat")

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- USAGE -->

## Usage

-   Testnet XDC is needed to interact with the app. It can be obtained from this [faucet](https://faucet.blocksscan.io/).

-   Please use MetaMask to interact with the app.

-   Most everything is tied to the campaign ID#. Users need it when calling functions for pledging, withdrawing, and claiming tokens.

-   There are two known bugs:
    -   Though the smart contracts are workig properly on chain, the campaign ID and expiry date are not populating correctly on the front end. It is something in the interaction between the front end and the crowdfunding project when using the useState Hook in React. The variables are populating
    -   `getCampaignRefundStatus()` is reverting. It is wigging out on array memory I'm fairly sure
-   I ran out of time to fix them before the Web3athon Hackathon submission deadline, but these bugs do not seem to be too major in terms of effort and can be addressed on the next iteration
-   Regarding the first bug, to interact with a full life cycle of a campaign, after you have created a campaign, do not refresh the page and do not create a second campaign. To create a second campaign, just refresh the page, and the front end will display correctly for just that second campaign. It will not update functionality and/or state properly for both campaigns. (Just ran out of time to fix!) As a reminder, the crowdfunding smart contract is working as intended, so you can always run through complete life cycles using the BlocksScan Read and Write Contract pages, since the contract is verified.

Here's a couple of screenshots of the app in action:

![Alt text](./images/FEcreate.png?raw=true "Test Coverage via Hardhat")

![Alt text](./images/FEpledge.png?raw=true "Test Coverage via Hardhat")

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- FOR THE DEVS -->

## For The Devs

For quickstart `git clone repo` TODO and `cd` into directory and run `npm install`.

Then `cd` into the `/app` directory and run `npm install`.

To run the front-end application, run `npm start` from the `/app` directory. Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

### Development Stack, Plugins, Libraries, and Dependencies

-   Smart contracts: Solidity, Hardhat (deploy, toolbox, chai matchers, mocha, network helpers), Ethers, prettier, solhint
-   OpenZeppelin inherited contracts: Ownable, ReentrancyGuard
-   Front End: React, Webpack, Craco, Babel, Ethers, detectEthereumProvider

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- FUTURE CONSIDERATIONS -->

## Future Considerations

-   Fix the return variables (amount refunded, percent refunded) to the getCampaignRefundStatus() function. Looping through the plegers array was causing panic code 17 in testing. Could not figure out a way to provide the desired functionality without getting the panic code.
-   Add edge case or bizarre case testing in unit tests and staging tests.
-   Add user action feedback, e.g. creating visual displays when a campaign has met a goal from a pledge, error messaging, etc.
-   Add more functionality on the front end to get info on existing or past campaigns.
-   Add more flexibility in the user inputs for payment amounts and campaign lengths.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- LESSONS LEARNED -->

## Lessons Learned

-   I have to remind myself that often the location of the bug is not in the obvious place. If a particular element is not working properly, there's a good chance it is because of another element elsewhere. Slow down and back up to bring all causes and effects into focus.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- CONTRIBUTING -->

## Contributing

Scott Auriat was the main consultant and sounding board for this project.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- LICENSE -->

## License

Distributed under the MIT License.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- CONTACT -->

## Contact

Armand Daigle - [@\_Starmand](https://twitter.com/_Starmand) - armanddaoist@gmail.com

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- ACKNOWLEDGMENTS -->

## Acknowledgments and Resources

Thanks to Scott Auriat for his consultation on different aspects, as well as introducing me to the dominant assurance strategy.

A big thanks to the XDC support team and community. The [XDC community docs](https://docs.xdc.community/) were especially helpful and made it a fairly straightforward process to go from knowing zero about deploying to XDC to successfully deploying two contracts in about two days.

<p align="right">(<a href="#readme-top">back to top</a>)</p>
