import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/core';

export type MMMConfig = {};

export function mMMConfigToCell(config: MMMConfig): Cell {
    return beginCell().endCell();
}

export class MMM implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new MMM(address);
    }

    static createFromConfig(config: MMMConfig, code: Cell, workchain = 0) {
        const data = mMMConfigToCell(config);
        const init = { code, data };
        return new MMM(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }
}
