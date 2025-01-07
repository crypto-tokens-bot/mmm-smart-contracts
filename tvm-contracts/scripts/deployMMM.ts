import { toNano } from '@ton/core';
import { MMM } from '../wrappers/MMM';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const mMM = provider.open(MMM.createFromConfig({}, await compile('MMM')));

    await mMM.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(mMM.address);

    // run methods on `mMM`
}
