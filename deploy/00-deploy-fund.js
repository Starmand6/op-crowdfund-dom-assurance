const { network } = require("hardhat");
const { verify } = require("../utils/verify.js");
const chainId = network.config.chainId;

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    var domCrowdfund;

    if (chainId == 31337) {
        log("-------------------------------------");
        domCrowdfund = await deploy("DomCrowdfund", {
            contract: "DomCrowdfund",
            from: deployer,
            log: true,
            waitConfirmations: network.config.blockConfirmations || 1,
        });
    } else {
        log("------------------------------------");
        domCrowdfund = await deploy(
            "DomCrowdfund",
            {
                contract: "DomCrowdfund",
                from: deployer,
                log: true,
                waitConfirmations: network.config.blockConfirmations || 3,
            },
            { gasLimit: 500_000 }
        );
    }

    if (
        (chainId == 420 || chainId == 10) &&
        process.env.OPTIMISM_ETHERSCAN_API_KEY
    ) {
        log("Verifying...");
        await verify(domCrowdfund.address);
    }
    log("-----------------------------------------------");
};

module.exports.tags = ["crowdfund", "deploy"];
