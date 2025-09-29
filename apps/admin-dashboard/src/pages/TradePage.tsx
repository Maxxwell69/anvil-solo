import Header from "./Layout/Header";
import React, { useState } from "react";
import { Link } from "react-router-dom";
// import Modal from "../components/Modal";
import Navbar from "../components/Navbar";
import { styled } from "styled-components";
import { call, ellipsis } from "../context/util";
import useStore from "../context/useStore";
import Loading from "../components/Loading";

// import { checkSolBalance, getWalletTokenBalances } from "../context/util";
// import config from "../context/config.json";
// import axios from "axios";

const TradePage = () => {
  const [trade, setTrade] = useState<SwapInterface[]>([]);
  const [keyword, setKeyword] = useState("");
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [showBalanceOnly, setShowBalanceOnly] = useState(false);
  const { update, loading } = useStore();

  const getTokenList = async () => {
    update({ loading: true });
    const data = await call("admin/tradesList", { keyword: keyword });
    if (data && data?.result) {
      let tradesList = data.result;
      if (showActiveOnly) {
        tradesList = tradesList.filter((item: any) => item.active);
      }
      if (showBalanceOnly) {
        tradesList = tradesList.filter((item: any) => item.isBalance);
      }
      setTrade(tradesList);
    }
    update({ loading: false });
  };
  React.useEffect(() => {
    getTokenList(); // Initial fetch
    const intervalId = setInterval(() => {
      getTokenList();
    }, 20000);

    return () => clearInterval(intervalId);
  }, [keyword, showActiveOnly, showBalanceOnly]);

  return (
    <Main>
      <Header type={2} />
      <div className="container">
        <Navbar />
        <div className="content">
          <div className="recent-trade bg-lightblack br-12">
            <div className="card-item xl-card bg-lightblack br-12">
              <div>
                <input
                  type="text"
                  className="text-white"
                  placeholder="Search here"
                  value={keyword}
                  onChange={(e) => {
                    setKeyword(e.target.value);
                  }}
                />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 64 64"
                  width="25px"
                  height="25px"
                >
                  <path
                    fill="currentColor"
                    stroke="currentColor"
                    d="M 24 2.8886719 C 12.365714 2.8886719 2.8886719 12.365723 2.8886719 24 C 2.8886719 35.634277 12.365714 45.111328 24 45.111328 C 29.036552 45.111328 33.664698 43.331333 37.298828 40.373047 L 52.130859 58.953125 C 52.130859 58.953125 55.379484 59.435984 57.396484 57.333984 C 59.427484 55.215984 58.951172 52.134766 58.951172 52.134766 L 40.373047 37.298828 C 43.331332 33.664697 45.111328 29.036548 45.111328 24 C 45.111328 12.365723 35.634286 2.8886719 24 2.8886719 z M 24 7.1113281 C 33.352549 7.1113281 40.888672 14.647457 40.888672 24 C 40.888672 33.352543 33.352549 40.888672 24 40.888672 C 14.647451 40.888672 7.1113281 33.352543 7.1113281 24 C 7.1113281 14.647457 14.647451 7.1113281 24 7.1113281 z"
                  />
                </svg>
              </div>
              <div style={{ display: "flex", gap: "10px", marginLeft: "20px" }}>
                <label
                  style={{ display: "flex", alignItems: "center", gap: "5px" }}
                >
                  <input
                    type="checkbox"
                    checked={showActiveOnly}
                    onChange={(e) => setShowActiveOnly(e.target.checked)}
                  />
                  Show Active Only
                </label>
                <label
                  style={{ display: "flex", alignItems: "center", gap: "5px" }}
                >
                  <input
                    type="checkbox"
                    checked={showBalanceOnly}
                    onChange={(e) => setShowBalanceOnly(e.target.checked)}
                  />
                  Show Balance Only
                </label>
              </div>
            </div>
            <div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: "4%" }}>
                        <span>No</span>
                      </th>

                      <th style={{ width: "10%" }}>
                        <div style={{ minWidth: "120px" }}>Coin Name</div>
                      </th>
                      <th style={{ width: "12%" }}>
                      <div style={{ minWidth: "120px" }}>Coin Address(CA)</div>
                      </th>
                      <th style={{ width: "12%" }}>
                        <span>PairAddress</span>
                      </th>
                      <th style={{ width: "12%" }}>
                        <span>Funding Wallet</span>
                      </th>
                      <th style={{ width: "4%" }}>
                        <span>Amount(Sol)</span>
                      </th>
                      <th style={{ width: "5%" }}>
                        <span>Buy</span>
                      </th>
                      <th style={{ width: "5%" }}>
                        <span>Sell</span>
                      </th>
                      <th style={{ width: "5%" }}>
                        <span>Buy Status</span>
                      </th>
                      <th style={{ width: "5%" }}>
                        <span>Sell Status</span>
                      </th>
                      <th style={{ width: "5%" }}>
                        <span>Time(min)</span>
                      </th>
                      <th style={{ width: "5%" }}>
                        <span>Active</span>
                      </th>
                      <th style={{ width: "5%" }}>
                        <span>IsBalance?</span>
                      </th>
                      <th style={{ width: "5%" }}>
                        <span>Dir</span>
                      </th>
                      <th style={{ width: "6%" }}>
                        <span>User ID</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {trade.map((token: any, i: number) => (
                      <tr key={i}>
                        <td style={{ flex: 1 }}>
                          <span>{i + 1}</span>
                        </td>

                        <td style={{ flex: 1 }}>{token.quoteName}</td>
                        <td style={{ flex: 1 }}>
                          <Link
                            to={
                              "https://dexscreener.com/solana/" +
                              token.pairAddress
                            }
                            target="_blank"
                          >
                            {ellipsis(token.quoteToken, 6)}
                          </Link>
                        </td>
                        <td style={{ flex: 1 }}>
                          <Link
                            to={
                              "https://solscan.io/account/" + token.pairAddress
                            }
                            target="_blank"
                          >
                            {ellipsis(token.pairAddress, 6)}
                          </Link>
                        </td>
                        <td style={{ flex: 1 }}>
                          <Link
                            to={
                              "https://solscan.io/account/" + token.fundingWallet
                            }
                            target="_blank"
                          >
                            {ellipsis(token.fundingWallet, 6)}
                          </Link>
                        </td>
                        <td style={{ flex: 1 }}>{token.amount}</td>
                        <td style={{ flex: 1, color: "red" }}>{token.buy}</td>
                        <td style={{ flex: 1, color: "green" }}>
                          {token.sell}
                        </td>
                        <td style={{ flex: 1, color: "red" }}>
                          {token.buyProgress}
                        </td>
                        <td style={{ flex: 1, color: "green" }}>
                          {token.sellProgress}
                        </td>
                        <td style={{ flex: 1 }}>{token.loopTime}</td>
                        <td
                          style={{
                            flex: 1,
                            color: token.active ? "green" : "red",
                          }}
                        >
                          {token.active ? "true" : "false"}
                        </td>
                        <td
                          style={{
                            flex: 1,
                            color: token.isBalance ? "green" : "red",
                          }}
                        >
                          {token.isBalance ? "Yes" : "No"}
                        </td>
                        <td style={{ flex: 1 }}>
                          <span>{token.dir}</span>
                        </td>
                        <td style={{ flex: 1, color: "gray" }}>
                          <span>{token.userId}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        {loading && <Loading />}
      </div>
      {/* <Modal
        show={showNewModal}
        onClose={() => {
          setShowNewModal(false);
        }}
        closeOverlay={true}
        isDefault
      >
        <StyledModalContainer style={{ zIndex: 1 }}>
          {balance.map((item: any) => (
            <div>{item.id}</div>
          ))}
          <div className="header">dafa</div>
          <div className="hr mt-1">adfas</div>
          <div className="mt-1">asdfaf</div>
        </StyledModalContainer>
      </Modal> */}
    </Main>
  );
};

const Main = styled.main`
  display: flex;
  width: 100vw;
  height: 100vh;
  color: white;
  background-color: var(--dark-black);
  background-image: linear-gradient(
    to right bottom,
    var(--dark-black) 18.87%,
    #383737 56.45%,
    #18181a 76.26%
  );
  padding-bottom: var(--space);
  .container {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: calc(100vw - 345px);
    height: 100vh;
    .content {
      width: 100%;
      height: calc(100% - 120px);
      display: flex;
      flex-direction: column;
      padding: 0 var(--space) var(--space) var(--space);
      gap: var(--space);
      .card-group {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 40px;
        width: 100%;
        .card-item {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 130px;

          position: relative;
          color: var(--white);

          .detail {
            display: flex;
            flex-direction: column;
            justify-content: center;
            width: 100%;
            font-size: 18px;
            line-height: 33.82px;
            text-align: center;
            text-underline-position: from-font;
            text-decoration-skip-ink: none;
            z-index: 1;
            padding: 15px 0;
            gap: 30px;
            & > span {
              padding-left: 15px;
            }
            div {
              display: flex;
              font-family: Squada One;
              font-size: 40px;
              font-weight: 400;
              align-items: center;
              justify-content: center;
              svg {
                width: 24px;
                height: 24px;
                z-index: 1;
                &:hover {
                  color: var(--red);
                  cursor: pointer;
                }
              }
            }

            img {
              position: absolute;
              bottom: 0;
              left: 0;
              width: 100%;
              opacity: 0.05;
            }
          }

          svg {
            position: absolute;
            right: 0;
            bottom: 0;
            height: inherit;
          }

          &:hover {
            filter: brightness(1.15);
          }
        }

        .sm-card {
          width: 25%;
        }

        .md-card {
          width: 50%;
        }

        .lg-card {
          width: 75%;
        }

        .xl-card {
          width: 100%;
        }

        .blue-card {
          background-image: linear-gradient(
            to right top,
            #004496 18.87%,
            var(--blue) 56.91%
          );
          color: var(--dark-blue);
        }

        .purple-card {
          background-image: linear-gradient(
            345.68deg,
            #464879 18.87%,
            #8e91c7 56.91%
          );
          color: #7679af;
        }
        .yellow-card {
          background-image: linear-gradient(
            345.68deg,
            #ca851d 18.87%,
            #a8a309 56.91%
          );
          color: #e0a44a;
        }

        .pink-card {
          background-image: linear-gradient(
            278.68deg,
            #592a61 18.87%,
            #d761ec 88.86%
          );
          color: #ac4cbc;
        }
      }
      .recent-trade {
        display: flex;
        flex-direction: column;
        height: 100%;
        width: 100%;
        overflow-y: hidden;
        overflow: auto;
        & > div:first-of-type {
          display: flex;
          align-items: center;
          justify-content: left;
          padding: 10px;
          gap: 20px;
          color: var(--brown);
          & > div {
            border-radius: var(--space);
            padding: 0 30px;
            display: flex;
            align-items: center;
            gap: 10px;
            background-color: var(--black);
            /* border: 1px solid var(--brown); */

            input {
              font-size: 20px;
              outline: none;
              background-color: transparent;
              padding: 10px 0;
            }

            &:hover {
              color: var(--red);
              svg {
                cursor: pointer;
              }
            }
          }
        }
        & > div:last-of-type {
          height: 100%;
          overflow-y: hidden;
          overflow: auto;
          .table-container {
            border-radius: var(--borderRadius);
            color: white;
            table {
            width: 100%;
            border-collapse: collapse;

            thead {
                tr {
                border-bottom: 1px solid var(--light-black);
                th {
                    position: sticky;
                    top: 0;
                    padding: 5px;
                    background-color: var(--black);
                    text-align: center;
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
                align-items: center;
                td {
                    font-size: 14px;
                    padding: 5px;
                    text-align: center;
                    a {
                    color: white;
                    }
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
      }
    }
  }
`;
const StyledModalContainer = styled.div`
  background: linear-gradient(0deg, #1b1b16, #1a1b16),
    linear-gradient(0deg, #686b3d, #313121);
  border-radius: 20px;
  border: 1px solid #303121;
  padding: 16px;
  color: white;
  .d {
    display: flex;
    flex-direction: row;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
  }
  .mt-1 {
    margin-top: 1em;
  }
  .mt-3 {
    margin-top: 2em;
  }
  .header {
    padding: 10px 0 0 8px;
    color: rgba(250, 250, 255, 1);
    display: flex;
    justify-content: space-between;
    align-items: center;
    .close {
      cursor: pointer;
      border: 1px solid #212231;
      background: linear-gradient(0deg, #1b1a16, #1b1b16),
        linear-gradient(0deg, #2f3121, #313021);
      width: 36px;
      height: 36px;
      border-radius: 50px;
      display: flex;
      justify-content: center;
      align-items: center;
      &:hover {
        background: linear-gradient(0deg, #040403, #1a1b16),
          linear-gradient(0deg, #222116, #303121);
        color: var(--primary);
      }
    }
  }
  .hr {
    background: #313021;
    width: 100%;
    height: 1px;
  }

  .avatar {
    position: relative;
    text-align: center;
    margin-top: 16px;
    .edit {
      // position: absolute;
      // top: 4px;
      // right: 4px;
      background-color: #258aa7;
      color: #eee;
      padding: 6px;
      border-radius: 5px;
      cursor: pointer;
      z-index: 2;
      transition: 0.2s;
      width: 100%;
      margin-top: 10px;
      &:hover {
        background: #169dc3;
      }
    }
  }

  .social-input {
    display: flex;
    align-items: center;
    gap: 8px;
    input {
      padding: 16px;
      font-size: 14px;
      border: 1px solid #444;
      border-radius: 8px;
      background-color: transparent;
      outline: none;
      width: 100%;
      color: var(--white);
      font-size: 1em;
      &:-internal-autofill-selected {
        background-color: transparent;
      }
    }
  }

  .save-button {
    background-color: #258aa7;
    color: #eee;
    padding: 6px;
    border-radius: 5px;
    cursor: pointer;
    z-index: 2;
    transition: 0.2s;
    width: 100%;
    margin-top: 10px;
    text-align: center;
    // width: 100px;
    &:hover {
      background: #169dc3;
    }
  }
`;
export default TradePage;