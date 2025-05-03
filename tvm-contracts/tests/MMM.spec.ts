import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano } from '@ton/core';
import { MMM } from '../wrappers/MMM';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

describe('MMM', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('MMM');
    });

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let mMM: SandboxContract<MMM>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        mMM = blockchain.openContract(MMM.createFromConfig({}, code));

        deployer = await blockchain.treasury('deployer');

        const deployResult = await mMM.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: mMM.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and mMM are ready to use
    });
});
