const { network } = require("hardhat");
const { verify } = require("../utils/verify.js");
const chainId = network.config.chainId;

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    var daontownToken;
    var domCrowdfund;

    if (chainId === 31337) {
        log("-------------------------------------");
        domCrowdfund = (await deployments.get("DomCrowdfund")).address;
        daontownToken = await deploy("DAOntownToken", {
            contract: "DAOntownToken",
            from: deployer,
            log: true,
            args: [domCrowdfund],
            waitConfirmations: network.config.blockConfirmations || 1,
        });
    } else {
        log("------------------------------------");
        domCrowdfund = "0x81fa7a47bE7BBa84a6391773e8481725310563C8";
        daontownToken = await deploy(
            "DAOntownToken",
            {
                contract: "DAOntownToken",
                from: deployer,
                log: true,
                args: [domCrowdfund],
                waitConfirmations: network.config.blockConfirmations || 3,
            },
            { gasLimit: 500_000 }
        );
    }

    if (
        (chainId === 420 || chainId === 10) &&
        process.env.OPTIMISM_ETHERSCAN_API_KEY
    ) {
        log("Verifying...");
        await verify(daontownToken.address, [domCrowdfund]);
    }
    log("-----------------------------------------------");
};

module.exports.tags = ["deploy", "token"];
