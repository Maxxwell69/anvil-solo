import React, { useState } from 'react';
import { styled } from 'styled-components';
import { useGlobalContext } from '../context'

const TokenTable: React.FC = () => {
    const trades: TokenTradesInterface[] = [
        // { date: '7h 38m ago', token: 'Eth', trader: "0x02dfdfdfdfddfdfd", amount: 201.38, usd: 201.38, fee: 215.0, tx: "eere", type: 1 },
        // { date: '4h 12m ago', token: 'USDT', trader: "0x02dfdfdfdfddfdfd", amount: 15.25, usd: 15.25, fee: 120.0, tx: "eere", type: 2 },
        // { date: '3h 2m ago', token: 'BNB', trader: "0x02dfdfdfdfddfdfd", amount: 5863.5, usd: 5863.5, fee: 20.51, tx: "eere", type: 3 },
        // { date: '5h 2m ago', token: 'SOL', trader: "0x02dfdfdfdfddfdfd", amount: 563.5, usd: 563.5, fee: 520.51, tx: "eere", type: 1 },
        // { date: '4h 38m ago', token: 'Remove', trader: "0x02dfdfdfdfddfdfd", amount: 201.38, usd: 201.38, fee: 215.0, tx: "eere", type: 4 },
        // { date: '5h 12m ago', token: 'Buy', trader: "0x02dfdfdfdfddfdfd", amount: 15.25, usd: 15.25, fee: 120.0, tx: "eere", type: 1 },
        // { date: '1h 2m ago', token: 'SOL', trader: "0x02dfdfdfdfddfdfd", amount: 5863.5, usd: 5863.5, fee: 20.51, tx: "eere", type: 1 },
        // { date: '2m ago', token: 'Buy', trader: "0x02dfdfdfdfddfdfd", amount: 563.5, usd: 563.5, fee: 520.51, tx: "eere", type: 1 },
        // { date: '7h 38m ago', token: 'SOL', trader: "0x02dfdfdfdfddfdfd", amount: 201.38, usd: 201.38, fee: 215.0, tx: "eere", type: 2 },
        // { date: '4h 12m ago', token: 'Buy', trader: "0x02dfdfdfdfddfdfd", amount: 15.25, usd: 15.25, fee: 120.0, tx: "eere", type: 1 },
        // { date: '3h 2m ago', token: 'BNB', trader: "0x02dfdfdfdfddfdfd", amount: 5863.5, usd: 5863.5, fee: 20.51, tx: "eere", type: 3 },
        // { date: '5h 2m ago', token: 'ERC20', trader: "0x02dfdfdfdfddfdfd", amount: 563.5, usd: 563.5, fee: 520.51, tx: "eere", type: 1 },
        // { date: '4h 38m ago', token: 'Remove', trader: "0x02dfdfdfdfddfdfd", amount: 201.38, usd: 201.38, fee: 215.0, tx: "eere", type: 4 },
        // { date: '5h 12m ago', token: 'Buy', trader: "0x02dfdfdfdfddfdfd", amount: 15.25, usd: 15.25, fee: 120.0, tx: "eere", type: 1 },
        // { date: '1h 2m ago', token: 'ERC20', trader: "0x02dfdfdfdfddfdfd", amount: 5863.5, usd: 5863.5, fee: 20.51, tx: "eere", type: 2 },
        // { date: '2m ago', token: 'Buy', trader: "0x02dfdfdfdfddfdfd", amount: 563.5, usd: 563.5, fee: 520.51, tx: "eere", type: 1 },
    ];

    const [sortConfig, setSortConfig] = useState<{ key: keyof TokenTradesInterface; direction: 'ascending' | 'descending' | null }>({
        key: 'created',
        direction: 'ascending',
    });

    const sortedTokens = [...trades].sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
    });

    const onSort = (key: keyof TokenTradesInterface) => {
        let direction: 'ascending' | 'descending' | undefined;

        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        } else {
            direction = 'ascending';
        }

        setSortConfig({ key, direction });
    };

    return (
        <DataTable>
            <div className='table-container'>
                <table>
                    <thead>
                        <tr>
                            <th>
                                <header>
                                    <span>Type</span>
                                </header>
                            </th>
                            <th>
                                <header>
                                    <span>date</span>
                                    {/* <svg className='sort' width={32} height={32} xmlns="http://www.w3.org/2000/svg" version="1.1" x="0px" y="0px" viewBox="0 0 100 125" onClick={() => onSort('date')}>
                                        <path fill='currentColor' d="M72.1,53.4H27.9c-2.1,0-3.1,2.2-1.7,3.5l22.1,20.7c0.9,0.9,2.5,0.9,3.5,0l22.1-20.7C75.3,55.5,74.2,53.4,72.1,53.4z"/>
                                        <path fill='currentColor' d="M73.9,43.1L51.7,22.4c-0.9-0.9-2.5-0.9-3.5,0L26.1,43.1c-1.4,1.3-0.3,3.5,1.7,3.5h44.3C74.2,46.6,75.3,44.5,73.9,43.1z"/>
                                    </svg> */}
                                </header>
                            </th>
                            <th>
                                <header>
                                    <span>token</span>
                                    {/* <svg className='sort' width={32} height={32} xmlns="http://www.w3.org/2000/svg" version="1.1" x="0px" y="0px" viewBox="0 0 100 125" onClick={() => onSort('token')}>
                                        <path fill='currentColor' d="M72.1,53.4H27.9c-2.1,0-3.1,2.2-1.7,3.5l22.1,20.7c0.9,0.9,2.5,0.9,3.5,0l22.1-20.7C75.3,55.5,74.2,53.4,72.1,53.4z"/>
                                        <path fill='currentColor' d="M73.9,43.1L51.7,22.4c-0.9-0.9-2.5-0.9-3.5,0L26.1,43.1c-1.4,1.3-0.3,3.5,1.7,3.5h44.3C74.2,46.6,75.3,44.5,73.9,43.1z"/>
                                    </svg> */}
                                </header>
                            </th>
                            <th>
                                <header>
                                    <span>trader</span>
                                    {/* <svg className='sort' width={32} height={32} xmlns="http://www.w3.org/2000/svg" version="1.1" x="0px" y="0px" viewBox="0 0 100 125" onClick={() => onSort('trader')}>
                                        <path fill='currentColor' d="M72.1,53.4H27.9c-2.1,0-3.1,2.2-1.7,3.5l22.1,20.7c0.9,0.9,2.5,0.9,3.5,0l22.1-20.7C75.3,55.5,74.2,53.4,72.1,53.4z"/>
                                        <path fill='currentColor' d="M73.9,43.1L51.7,22.4c-0.9-0.9-2.5-0.9-3.5,0L26.1,43.1c-1.4,1.3-0.3,3.5,1.7,3.5h44.3C74.2,46.6,75.3,44.5,73.9,43.1z"/>
                                    </svg> */}
                                </header>
                            </th>
                            <th>
                                <header>
                                    <span>amount</span>
                                    {/* <svg className='sort' width={32} height={32} xmlns="http://www.w3.org/2000/svg" version="1.1" x="0px" y="0px" viewBox="0 0 100 125" onClick={() => onSort('amount')}>
                                        <path fill='currentColor' d="M72.1,53.4H27.9c-2.1,0-3.1,2.2-1.7,3.5l22.1,20.7c0.9,0.9,2.5,0.9,3.5,0l22.1-20.7C75.3,55.5,74.2,53.4,72.1,53.4z"/>
                                        <path fill='currentColor' d="M73.9,43.1L51.7,22.4c-0.9-0.9-2.5-0.9-3.5,0L26.1,43.1c-1.4,1.3-0.3,3.5,1.7,3.5h44.3C74.2,46.6,75.3,44.5,73.9,43.1z"/>
                                    </svg> */}
                                </header>
                            </th>
                            <th>
                                <header>
                                    <span>usd</span>
                                    {/* <svg className='sort' width={32} height={32} xmlns="http://www.w3.org/2000/svg" version="1.1" x="0px" y="0px" viewBox="0 0 100 125" onClick={() => onSort('usd')}>
                                        <path fill='currentColor' d="M72.1,53.4H27.9c-2.1,0-3.1,2.2-1.7,3.5l22.1,20.7c0.9,0.9,2.5,0.9,3.5,0l22.1-20.7C75.3,55.5,74.2,53.4,72.1,53.4z"/>
                                        <path fill='currentColor' d="M73.9,43.1L51.7,22.4c-0.9-0.9-2.5-0.9-3.5,0L26.1,43.1c-1.4,1.3-0.3,3.5,1.7,3.5h44.3C74.2,46.6,75.3,44.5,73.9,43.1z"/>
                                    </svg> */}
                                </header>
                            </th>
                            <th>
                                <header>
                                    <span>fee</span>
                                    {/* <svg className='sort' width={32} height={32} xmlns="http://www.w3.org/2000/svg" version="1.1" x="0px" y="0px" viewBox="0 0 100 125" onClick={() => onSort('fee')}>
                                        <path fill='currentColor' d="M72.1,53.4H27.9c-2.1,0-3.1,2.2-1.7,3.5l22.1,20.7c0.9,0.9,2.5,0.9,3.5,0l22.1-20.7C75.3,55.5,74.2,53.4,72.1,53.4z"/>
                                        <path fill='currentColor' d="M73.9,43.1L51.7,22.4c-0.9-0.9-2.5-0.9-3.5,0L26.1,43.1c-1.4,1.3-0.3,3.5,1.7,3.5h44.3C74.2,46.6,75.3,44.5,73.9,43.1z"/>
                                    </svg> */}
                                </header>
                            </th>
                            <th>
                                <header>
                                    <span>tx</span>
                                    {/* <svg className='sort' width={32} height={32} xmlns="http://www.w3.org/2000/svg" version="1.1" x="0px" y="0px" viewBox="0 0 100 125" onClick={() => onSort('tx')}>
                                        <path fill='currentColor' d="M72.1,53.4H27.9c-2.1,0-3.1,2.2-1.7,3.5l22.1,20.7c0.9,0.9,2.5,0.9,3.5,0l22.1-20.7C75.3,55.5,74.2,53.4,72.1,53.4z"/>
                                        <path fill='currentColor' d="M73.9,43.1L51.7,22.4c-0.9-0.9-2.5-0.9-3.5,0L26.1,43.1c-1.4,1.3-0.3,3.5,1.7,3.5h44.3C74.2,46.6,75.3,44.5,73.9,43.1z"/>
                                    </svg> */}
                                </header>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* {
                            sortedTokens.map((trade, i) => (
                                <tr key={i} className={`${trade.type === 1 ? 'text-red' : trade.type === 2 ? 'text-green' : trade.type === 3 ? 'text-blue' : 'text-gray'}  `}>
                                    <td className={`${trade.type === 1 ? 'text-red' : trade.type === 2 ? 'text-green' : trade.type === 3 ? 'text-blue' : 'text-gray'}`} >
                                        {
                                            trade.type === 1 ?
                                                (
                                                    <div className='bg-darkred'>
                                                        <svg version="1.1" x="0px" y="0px" viewBox="0 0 40 50"><g transform="translate(0,-1012.3622)"><path d="m 35,1022.3622 -2,0 0,21.5625 -26.5938,-26.5625 -1.4062,1.4063 26.5937,26.5937 -21.5937,0 0,2 24,0 1,0 0,-1 0,-24 z" fill="currentColor" fill-opacity="1" stroke="none"  visibility="visible" display="inline" overflow="visible"/></g></svg>
                                                    </div>
                                                ) :
                                            trade.type === 2 ?
                                                (
                                                    <div className='bg-darkgreen'>
                                                        <svg version="1.1" x="0px" y="0px" viewBox="0 0 40 50">
                                                            <g transform="translate(0,-1012.3622)">
                                                                <path d="m 10,1017.3622 0,2 21.5625,0 L 5,1045.956 6.40625,1047.3622 33,1020.7685 l 0,21.5937 2,0 0,-24 0,-1 -1,0 -24,0 z" fill="currentColor" fill-opacity="1" stroke="none" visibility="visible" display="inline" overflow="visible"/></g>
                                                        </svg>
                                                    </div>
                                                ) :
                                            trade.type === 3 ?
                                                (
                                                    <div className='bg-darkblue'>
                                                        <svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 32 40" x="0px" y="0px">
                                                            <path fill='currentColor' stroke='currentColor' d="M15.983 0c-0.623 0.010-1.125 0.517-1.125 1.142 0 0.006 0 0.011 0 0.017v-0.001 29.685c0 0.005 0 0.010 0 0.016 0 0.631 0.511 1.142 1.142 1.142s1.142-0.511 1.142-1.142c0-0.006 0-0.011 0-0.017v0.001-29.685c0-0.005 0-0.010 0-0.015 0-0.631-0.511-1.142-1.142-1.142-0.006 0-0.012 0-0.018 0h0.001z"/>
                                                            <path fill='currentColor' stroke='currentColor' d="M1.158 14.858c-0.005 0-0.010 0-0.016 0-0.631 0-1.142 0.511-1.142 1.142s0.511 1.142 1.142 1.142c0.006 0 0.011 0 0.017 0h29.683c0.005 0 0.010 0 0.016 0 0.631 0 1.142-0.511 1.142-1.142s-0.511-1.142-1.142-1.142c-0.006 0-0.011 0-0.017 0z"/>
                                                        </svg>
                                                    </div>
                                                ) : 
                                                (
                                                    <div className='bg-darkgray'>
                                                        <svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 32 40" x="0px" y="0px">
                                                            <path fill='currentColor' stroke='currentColor' d="M1.158 14.858c-0.005 0-0.010 0-0.016 0-0.631 0-1.142 0.511-1.142 1.142s0.511 1.142 1.142 1.142c0.006 0 0.011 0 0.017 0h29.683c0.005 0 0.010 0 0.016 0 0.631 0 1.142-0.511 1.142-1.142s-0.511-1.142-1.142-1.142c-0.006 0-0.011 0-0.017 0z"/>
                                                        </svg>
                                                    </div>
                                                )
                                        }
                                    </td>
                                    <td>{trade.date.toLocaleString()}</td>
                                    <td>{trade.token}</td>
                                    <td>{trade.trader}</td>
                                    <td>{trade.amount.toFixed(2)}</td>
                                    <td>{trade.usd.toFixed(2)}</td>
                                    <td>{trade.fee.toFixed(2)}</td>
                                    <td>{trade.tx}</td>
                                </tr>
                            ))
                        } */}
                    </tbody>
                </table>
            </div>
        </DataTable>
    );
};

const DataTable = styled.table`
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow-y: auto;
    border-radius: var(--borderRadius);
    scrollbar-width: thin;
    scrollbar-color: #56565b #28282d;
    margin-right: 6px;
    header {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: var(--space-3);
        background-image: none;
        background-color: transparent;
        gap: 6px;
        color: white;
        width: 100%;
        &:hover {
            background-color: var(--bg-color4);
        }
        span {
            color: white;
        }
    }
    
    .table-container {
        border-radius: var(--borderRadius);
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 0 -1px;
            thead {
                tr {
                    border-bottom: 1px solid var(--light-black);
                    th {
                        position: sticky; 
                        top: 0;                   
                        padding: 20px 0;
                        background-color: var(--black);
                    }
                    .sort:hover {
                        fill: var(--bg-gray);
                        stroke: var(--bg-gray);
                        cursor: pointer;
                    }
                }
            }

            tbody {
                tr {
                    font-weight: 600;
                    td {
                        font-size: 14px;
                        padding: 15px 0;
                        text-align: center;
                        div {
                            display: flex;
                            border-radius: 50%;
                            width: 30px;
                            height: 30px;
                            align-items: center;
                            justify-content: center;
                            margin: 0 auto;
                            svg {
                                width: 25px;
                                height: 25px;
                            }
                        }
                        
                    }
                    &:hover {
                        background-color: var(--dark-blue);
                        cursor: pointer;
                    }

                    &:not(:last-child) {
                        border-bottom: 1px solid var(--light-black);
                    }
                }
            }
        }
    }
    
`;
export default TokenTable;