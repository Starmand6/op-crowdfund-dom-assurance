// SPDX-License-Identifier: MIT

pragma solidity 0.8.18;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title Escrow Platform for Crowdfunding Campaigns Using Dominant Assurance
 * @author Armand Daigle
 * @notice This crowdfunding escrow contract uses a dominant assurance mechansism
 * as an alternative way to crowdfund projects and Real World Assets. Special thanks
 * to Scott Auriat for consultation, as well as Alex Tabarrok for coming up with
 * Dominant Assurance Contracts.
 * @dev Heart hands to you!
 */
contract DomCrowdfund is Ownable, ReentrancyGuard {
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

    Campaign[] public allCampaigns;

    /// It's a Campaign mapping party in here!
    mapping(uint32 => Campaign) public campaignsByID;
    mapping(address => Campaign) public creatorToCampaign;
    mapping(uint32 => mapping(address => uint256))
        public campaignPledgerAmounts;
    mapping(uint32 => mapping(address => bool)) public campaignEarlyPledgers;
    mapping(uint32 => mapping(address => bool)) public campaignPledgersRefunded;

    event CampaignCreated(
        uint256 indexed,
        address,
        uint256,
        uint256,
        uint256 indexed,
        uint32
    );
    event CampaignPledge(address, uint256, uint256);
    event CampaignRefundWithdrawal(uint32, address, uint256);
    event CampaignGoalMet_RAWK(uint256);
    event CampaignFundsSent(address payable);
    event t0wnTokensClaimed(address payable, uint256);

    error CampaignIDDoesNotExist();
    error CampaignHasExpired();
    error SuccessfulCampaign_FunctionClosed();
    error MustSendPledgeFunds();
    error CampaignIsStillActive();
    error CallerIsNotAPledger();
    error AlreadyWithdrawn();
    error InsufficientFunds();
    error CallerIsNotCampaignCreator();
    error CampaignGoalIsNotMet();

    constructor() {}

    receive() external payable {}

    fallback() external payable {}

    /**
     * @notice Anyone can create a campaign.
     * @return currentID is the campaign ID to which all stored variables
     * for the given campaign are tied. It is most important.
     */
    function createCampaign(
        string calldata _title,
        uint256 _targetAmount,
        uint256 _refundBonus,
        uint256 _campaignLengthInDays,
        uint32 _maxEarlyPledgers
    ) external payable returns (uint32) {
        require(
            _targetAmount > _refundBonus,
            "Campaign goal must be greater than bonus."
        );
        require(
            msg.value == _refundBonus,
            "Funds sent to contract must equal refund bonus amount."
        );

        uint256 _expiryDate = block.timestamp +
            (_campaignLengthInDays * 1 days);

        Campaign memory campaign = Campaign(
            _title,
            msg.sender,
            _targetAmount,
            _refundBonus,
            _expiryDate,
            _maxEarlyPledgers,
            new address[](0),
            new address[](0),
            0,
            false,
            false,
            false
        );

        // Populate struct, arrays, and mappings with new campaign
        uint32 currentID = uint32(allCampaigns.length);
        allCampaigns.push(campaign);
        campaignsByID[currentID] = campaign;
        creatorToCampaign[msg.sender] = campaign;

        emit CampaignCreated(
            currentID,
            msg.sender,
            _targetAmount,
            _refundBonus,
            _expiryDate,
            _maxEarlyPledgers
        );
        return (currentID);
    }

    /// @notice This function will place funds into "escrow". Pledges can pledge
    /// funds above targetAmount. Any overage goes to creator.
    function pledge(uint32 id) external payable {
        if (allCampaigns.length > 0 && id > (allCampaigns.length - 1)) {
            revert CampaignIDDoesNotExist();
        }
        if (block.timestamp > campaignsByID[id].campaignExpiryDate) {
            revert CampaignHasExpired();
        }
        if (campaignsByID[id].isGoalMet == true) {
            revert SuccessfulCampaign_FunctionClosed();
        }
        if (msg.value == 0) {
            revert MustSendPledgeFunds();
        }

        // Calculates if caller will be an early pledger.
        if (
            campaignEarlyPledgers[id][msg.sender] == false &&
            campaignsByID[id].pledgers.length <
            campaignsByID[id].maxEarlyPledgers
        ) {
            campaignEarlyPledgers[id][msg.sender] = true;
            campaignsByID[id].earlyPedgers.push(msg.sender);
        }

        campaignPledgerAmounts[id][msg.sender] += msg.value;
        campaignsByID[id].totalPledgedAmount += msg.value;
        campaignsByID[id].pledgers.push(msg.sender);
        emit CampaignPledge(msg.sender, id, msg.value);

        if (
            campaignsByID[id].totalPledgedAmount >=
            campaignsByID[id].targetAmount
        ) {
            campaignsByID[id].isGoalMet = true;
            emit CampaignGoalMet_RAWK(campaignsByID[id].totalPledgedAmount);
        }
    }

    /**
     * @dev No event is emitted when campaign expires. This function is callable
     * after campaign expiry if campaign goal is not met. A timer could be
     * implemented on the front end if desired.
     */
    function withdrawRefund(uint32 id) external payable nonReentrant {
        if (block.timestamp < campaignsByID[id].campaignExpiryDate) {
            revert CampaignIsStillActive();
        }
        if (campaignPledgersRefunded[id][msg.sender]) {
            revert AlreadyWithdrawn();
        }
        if (campaignPledgerAmounts[id][msg.sender] == 0) {
            revert CallerIsNotAPledger();
        }
        if (campaignsByID[id].isGoalMet == true) {
            revert SuccessfulCampaign_FunctionClosed();
        }

        uint256 regRefundAmount = campaignPledgerAmounts[id][msg.sender];

        // Early pledgers will receive their pledge refund as well as the
        // early pledger bonus by the end of this function call.
        if (campaignEarlyPledgers[id][msg.sender]) {
            uint256 earlyPledgerRefundBonus = getEarlyRefundCalc(id);
            uint256 earlyWithdrawAmount = earlyPledgerRefundBonus +
                regRefundAmount;
            // Sanity Check
            if (address(this).balance < earlyWithdrawAmount) {
                revert InsufficientFunds();
            }
            campaignPledgerAmounts[id][msg.sender] = 0;
            campaignPledgersRefunded[id][msg.sender] = true;
            (bool earlySuccess, ) = msg.sender.call{value: earlyWithdrawAmount}(
                ""
            );
            require(earlySuccess, "Failed to send refund");

            emit CampaignRefundWithdrawal(id, msg.sender, earlyWithdrawAmount);
        } else {
            // Sanity Check
            if (address(this).balance < regRefundAmount) {
                revert InsufficientFunds();
            }
            campaignPledgerAmounts[id][msg.sender] = 0;
            campaignPledgersRefunded[id][msg.sender] = true;
            // Sending pledge refund.
            (bool regSuccess, ) = msg.sender.call{value: regRefundAmount}("");
            require(regSuccess, "Failed to send refund");

            emit CampaignRefundWithdrawal(id, msg.sender, regRefundAmount);
        }

        (uint256 campaignAmountLeft, ) = getCampaignAmountRefunded(id);

        if (campaignAmountLeft == 0) {
            campaignsByID[id].hasCompletedRefunds = true;
        }
    }

    /**
     * @notice The goal is to get to here! Individual campaign creators are
     * responsible for pulling their funds.
     * @dev No event is emitted when campaign expires. This function is callable
     * after campaign expiry if goal is met. A timer could be implemented on the
     * front end if desired.
     * @param receivingAddress Creator address must call this function, but they can
     * input another address to receive funds if desired.
     */
    function creatorWithdrawal(
        uint32 id,
        address payable receivingAddress
    ) external payable {
        //
        if (msg.sender != campaignsByID[id].creator) {
            revert CallerIsNotCampaignCreator();
        }
        if (campaignsByID[id].isGoalMet != true) {
            revert CampaignGoalIsNotMet();
        }
        if (campaignsByID[id].creatorHasWithdrawnFunds) {
            revert AlreadyWithdrawn();
        }

        // Creators get all campaign pledges, as well as the refund bonus
        // they originally deposited.
        uint256 creatorFunds = campaignsByID[id].totalPledgedAmount +
            campaignsByID[id].refundBonus;

        /*
         * @dev This would be a huge problem, but this is mainly a sanity check
         * and a jumping off point if things are extra wonky.
         */
        if (address(this).balance < creatorFunds) {
            revert InsufficientFunds();
        }

        campaignsByID[id].creatorHasWithdrawnFunds = true;
        (bool success, ) = receivingAddress.call{value: creatorFunds}("");
        require(success, "Failed to withdraw campaign funds.");

        emit CampaignFundsSent(receivingAddress);
    }

    /// Getters
    // To avoid "Stack too deep" errors and for general sanity, campaign getters
    // were split into a few functions.
    function getCampaignInfo(
        uint32 id
    )
        external
        view
        returns (string memory, address, uint256, uint256, uint256, uint32)
    {
        return (
            campaignsByID[id].title,
            campaignsByID[id].creator,
            campaignsByID[id].targetAmount,
            campaignsByID[id].refundBonus,
            campaignsByID[id].campaignExpiryDate,
            campaignsByID[id].maxEarlyPledgers
        );
    }

    function getCampaignFundingStatus(
        uint32 id
    ) external view returns (uint256, uint256, bool, bool) {
        uint256 percentOfGoal = ((100 * campaignsByID[id].totalPledgedAmount) /
            campaignsByID[id].targetAmount);
        return (
            campaignsByID[id].totalPledgedAmount,
            percentOfGoal,
            campaignsByID[id].isGoalMet,
            campaignsByID[id].creatorHasWithdrawnFunds
        );
    }

    function getCampaignCount() external view returns (uint256) {
        return allCampaigns.length;
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function getCampaignEarlyPledgers(
        uint32 id
    ) external view returns (address[] memory) {
        return (campaignsByID[id].earlyPedgers);
    }

    function getCampaignPledgers(
        uint32 id
    ) external view returns (address[] memory) {
        return (campaignsByID[id].pledgers);
    }

    function getAmountPledged(
        uint32 id,
        address addy
    ) external view returns (uint256) {
        uint256 amountPledged = campaignPledgerAmounts[id][addy];
        return amountPledged;
    }

    function getAddress() external view returns (address) {
        return address(this);
    }

    function getCampaignRefundsCompleted(
        uint32 id
    ) external view returns (bool) {
        return campaignsByID[id].hasCompletedRefunds;
    }

    function getCampaignAmountRefunded(
        uint32 id
    ) public view returns (uint256, uint256) {
        address[] memory pledgers = campaignsByID[id].pledgers;
        uint256 numPledgers = pledgers.length;
        require(numPledgers > 0, "No campaign pledgers yet.");
        uint256 amountNotRefunded;
        uint32 i = 0;
        for (; i < numPledgers; i++) {
            if (campaignPledgerAmounts[id][pledgers[i]] > 0) {
                amountNotRefunded += campaignPledgerAmounts[id][pledgers[i]];
            }
            if (campaignEarlyPledgers[id][pledgers[i]] == true) {
                uint256 earlyRefund = getEarlyRefundCalc(id);
                amountNotRefunded += earlyRefund;
            }
        }

        uint256 amountRefunded = campaignsByID[id].totalPledgedAmount +
            campaignsByID[id].refundBonus -
            amountNotRefunded;
        uint256 percentRefunded = ((100 * amountRefunded) /
            (campaignsByID[id].totalPledgedAmount +
                campaignsByID[id].refundBonus));

        return (amountRefunded, percentRefunded);
    }

    function getEarlyRefundCalc(uint32 id) public view returns (uint256) {
        uint16 numPledgers = uint16(campaignsByID[id].pledgers.length);
        uint256 earlyPledgerRefundBonus = campaignsByID[id].refundBonus /
            (
                (numPledgers > campaignsByID[id].maxEarlyPledgers)
                    ? campaignsByID[id].maxEarlyPledgers
                    : numPledgers
            );
        return earlyPledgerRefundBonus;
    }
}
