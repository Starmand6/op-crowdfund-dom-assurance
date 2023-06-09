// SPDX-License-Identifier: MIT

pragma solidity 0.8.18;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./DomCrowdfund.sol";

contract DAOntownToken is ERC20, Ownable, ReentrancyGuard {
    DomCrowdfund private immutable i_crowdfund;

    mapping(uint32 => mapping(address => bool)) public pledgerHasMintedTokens;
    uint256 public tokensMintedFromCrowdfund;

    constructor(address payable _crowdfund) ERC20("DAOntown Token", "DTT") {
        i_crowdfund = DomCrowdfund(_crowdfund);
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function crowdfundMint(address to, uint256 amount) private {
        _mint(to, amount);
    }

    /**
     * @dev In order to access the relevant variables and pledgers, caller must enter
     * a crowdfunding campaign ID.
     */
    function claimDAOntownTokens(uint32 id) external nonReentrant {
        // if all have been claimed, permanently close this function via locks.
        require(
            i_crowdfund.getAmountPledged(id, msg.sender) > 0,
            "Must be crowdfunding campaign pledger."
        );

        (, , bool isGoalMet, ) = i_crowdfund.getCampaignFundingStatus(id);
        require(isGoalMet == true, "Campaign did not meet funding goal.");
        require(
            pledgerHasMintedTokens[id][msg.sender] == false,
            "Already minted your allotment."
        );
        // Use crowdfund pledger mapping to mint tokens 1-for-1 to pledged amount
        // and transfer to caller.
        uint256 amount = i_crowdfund.getAmountPledged(id, msg.sender);
        pledgerHasMintedTokens[id][msg.sender] = true;
        crowdfundMint(msg.sender, amount);
    }
}
