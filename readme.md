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

Using "DAOntown" as the main campaign example, any pledger that pledges to the campaign will be able to mint and claim DAOntown tokens, which could represent their share of governance rights, land use rights, etc. The token contract is presently written with the ERC20 standard, but could easily be replaced with the ERC721 or other token standard if desired.

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
-   A bunch of getters: `getCampaignInfo()`, `getCampaignFundingStatus()`, `getCampaignCount()`, `getBalance()`, `getCampaignEarlyPledgers()`, `getCampaignPledgers()`, `getAmountPledged()`, `getAddress()`, `getCampaignRefundsCompleted()`, `getCampaignAmountRefunded()`, `getEarlyRefundCalc()`

### DAOntownToken.sol XRC20 Token Contract Functionality

-   `claimDAOntownTokens()` is really the only function that can be called on this contract by campaign pledgers. In this project example, DAOntown tokens are minted and sent 1-for-1 to pledgers based on how much ETH they pledged to the campaign. These tokens can be used as governance tokens, land use right tokens, etc.
-   `mint()` can only be called by the token contract owner. Ownership could be transferred to a multisig after a successful campaign so that the property token holders can vote on if they want to mint more tokens or keep with the existing supply.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- PROJECT TECHNICALS -->

## Project Technicals

Crowdfund w/ Dominant Assurance (DomCrowdfund.sol) Contract Address: 0x81fa7a47bE7BBa84a6391773e8481725310563C8

[Crowdfund Contract Page - Optimism-Goerli Testnet](https://goerli-optimism.etherscan.io/address/0x81fa7a47be7bba84a6391773e8481725310563c8#code)

DAOntown Token (DAOntownToken.sol) Contract Address: 0x6ecA5993Ef426ff5c67B859676120d0b8AF597fA

[DAOntown Token Contract Page - Optimism-Goerli Testnet](https://goerli-optimism.etherscan.io/address/0x6ecA5993Ef426ff5c67B859676120d0b8AF597fA#code)

[Live Crowdfunding dApp Link](https://weathered-hall-4705.on.fleek.co/)

Test Coverage Report:

![Alt text](./images/TestCoverage-Hack1.png?raw=true "Test Coverage via Hardhat")

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- USAGE -->

## Usage

-   Testnet ETH is needed to interact with the app. It can be obtained from this [faucet](https://goerlifaucet.com/), then bridged to Optimism Goerli.

-   Please use MetaMask to interact with the app.

-   Most everything is tied to the campaign ID#. Users need it when calling functions for pledging, withdrawing, and claiming tokens.

-   Though the smart contracts are workig properly on chain, the campaign ID is not currently populating correctly on the front end.To interact with a full life cycle of a campaign, after you have created a campaign, do not refresh the page until you are done with that campaign. To create a second campaign, just refresh the page. It will not update functionality and/or state properly for both campaigns. As a reminder, the crowdfunding smart contract is working as intended, so you can always run through complete life cycles using the Block Explorer Read and Write Contract pages, since the contract is verified.

Here's a couple of screenshots of the app in action:

![Alt text](./images/FEcreate.png?raw=true "Test Coverage via Hardhat")

![Alt text](./images/FEpledge.png?raw=true "Test Coverage via Hardhat")

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- FOR THE DEVS -->

## For The Devs

For quickstart, clone the repo using the link from Github, `cd` into directory, and run `npm install`.

Then `cd` into the `/app` directory and run `npm install`.

To launch the front-end application, run `npm start` from the `/app` directory. Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

### Development Stack, Plugins, Libraries, and Dependencies

-   Smart contracts: Solidity, Hardhat (deploy, toolbox, chai matchers, mocha, network helpers), Ethers, prettier, solhint
-   OpenZeppelin inherited contracts: Ownable, ReentrancyGuard
-   Front End: React, Webpack, Craco, Babel, Ethers, detectEthereumProvider

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- FUTURE CONSIDERATIONS -->

## Future Considerations

-   Add edge case or bizarre case testing in unit tests and staging tests.
-   Add user action feedback, e.g. creating visual displays when a campaign has met a goal from a pledge, error messaging, etc.
-   Add more functionality on the front end to get info on existing or past campaigns.
-   Add more flexibility in the user inputs for payment amounts and campaign lengths.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- LESSONS LEARNED -->

## Lessons Learned

-   I have to remind myself that often that bug locations are not in obvious places. If a particular element is not working properly, there's a good chance it is because of another element elsewhere. Slowing down and backing up can help bring all causes and effects into focus.

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

A big thanks to the fellow Alchemy University students and community for helping me learn a lot about React.

<p align="right">(<a href="#readme-top">back to top</a>)</p>
