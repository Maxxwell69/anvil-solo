import React, { useState } from "react";
import { styled } from "styled-components";

import Header from "./Layout/Header";
import Navbar from "../components/Navbar";
import { call, ellipsis, convertToDate } from "../context/util";
import Icon from "../components/icon";
import Loading from "../components/Loading";
import { Link, useNavigate } from "react-router-dom";
import useStore from "../context/useStore";

const TokensPage = () => {
  const [tokens, setTokens] = useState<TokenInterface[]>([]);
  const [keyword, setKeyword] = useState("");
  const navigate = useNavigate();
  const { email, logined, update, loading } = useStore();
  const getTokenList = async () => {
    update({ loading: true });
    const data = await call("admin/tokenlist", { keyword: keyword });
    if (data && data.result) {
      const tokens = data.result;
      setTokens(tokens);
    }
    update({ loading: false });
  };

  React.useEffect(() => {
    if (!logined || !email) {
      navigate("/login");
      return;
    }
    getTokenList(); // Initial fetch
    const intervalId = setInterval(() => {
      getTokenList();
    }, 20000);

    return () => clearInterval(intervalId);
  }, [keyword]);

  return (
    <Main>
      <Header type={4} />
      <div className="container">
        <Navbar />
        <div className="content">
          <div className="recent-trade bg-lightblack br-12">
            <div className="bg-lightblack br-12">
              <div className="token-search">
                <input
                  type="text"
                  className="text-white"
                  placeholder="Search here"
                  value={keyword}
                  onChange={(e) => {
                    setKeyword(e.target.value);
                  }}
                  style={{ fontSize: "1.2em" }}
                />
                <Icon icon="Search" />
              </div>
            </div>
            <div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: "7%" }}>
                        <span>No</span>
                      </th>
                      <th style={{ width: "18%" }}>
                        <span>Token</span>
                      </th>
                      <th style={{ width: "25%" }}>
                        <span>Pair</span>
                      </th>
                      <th style={{ width: "25%" }}>
                        <span>Address</span>
                      </th>

                      <th style={{ width: "10%" }}>
                        <span>User ID</span>
                      </th>

                      <th style={{ flex: 1, width: "15%" }}>
                        <span>Reg Date</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tokens.map((token: any, i: number) => (
                      <tr key={i}>
                        <td style={{ flex: 1 }}>
                          <span>{i + 1}</span>
                        </td>
                        <td style={{ flex: 2, color: "yellow" }}>
                          {token.name}
                        </td>
                        <td style={{ flex: 1 }}>
                          {token.pairInfo && token.pairInfo.length > 0 ? (
                            <Link
                              to={
                                "https://solscan.io/account/" +
                                token.pairInfo[0].pairAddress
                              }
                              target="_blank"
                            >
                              {token.pairInfo[0].pairAddress}
                            </Link>
                          ) : (
                            "No pair info available"
                          )}
                        </td>
                        <td style={{ flex: 1, alignItems: "flex-start" }}>
                          {token.publicKey}
                        </td>

                        <td style={{ flex: 1, color: "gray" }}>
                          <span>{token.userId}</span>
                        </td>

                        <td style={{ flex: 1, color: "green" }}>
                          {convertToDate(token.lastUpdated)}
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
    </Main>
  );
};

const Main = styled.main`
  display: flex;
  width: 100vw;
  height: 100vh;
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
          justify-content: center;
          gap: 20px;
          margin: 10px;
          padding: 0 20px;
          .token-history {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
            .item {
              display: flex;
              position: relative;
              height: inherit;
              align-items: center;
              justify-content: center;
              color: var(--white);
              padding: 15px var(--space);
              height: 70px;
              opacity: 0.5;
              & > div:last-of-type {
                position: absolute;
                top: 10px;
                right: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 22px;
                height: 22px;
                border-radius: 50%;
              }
              &:hover {
                background-color: var(--black);
                cursor: pointer;
                font-weight: bold;
                opacity: 1;
              }
            }

            .item.active {
              border-top: 2px solid red;
              background-color: var(--black);
              font-weight: bold;
              opacity: 1;
            }
          }

          .token-search {
            border-radius: var(--space);
            background-color: var(--black);
            padding: 0 30px;
            display: flex;
            align-items: center;
            gap: 10px;
            color: var(--brown);
            input {
              font-size: 25px;
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
          background-color: var(--black);
        }
      }
    }
  }
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
            padding: 10px;
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
            font-size: 1em;
            padding: 10px;
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
`;

// const StyledModalContainer = styled.div`
//   background: linear-gradient(0deg, #1b1b16, #1a1b16),
//     linear-gradient(0deg, #686b3d, #313121);
//   border-radius: 20px;
//   border: 1px solid #303121;
//   padding: 16px;
//   color: white;
//   .d {
//     display: flex;
//     flex-direction: row;
//     align-items: center;
//     flex-wrap: wrap;
//     gap: 8px;
//   }
//   .mt-1 {
//     margin-top: 1em;
//   }
//   .mt-3 {
//     margin-top: 2em;
//   }
//   .header {
//     padding: 10px 0 0 8px;
//     color: rgba(250, 250, 255, 1);
//     display: flex;
//     justify-content: space-between;
//     align-items: center;
//     .close {
//       cursor: pointer;
//       border: 1px solid #212231;
//       background: linear-gradient(0deg, #1b1a16, #1b1b16),
//         linear-gradient(0deg, #2f3121, #313021);
//       width: 36px;
//       height: 36px;
//       border-radius: 50px;
//       display: flex;
//       justify-content: center;
//       align-items: center;
//       &:hover {
//         background: linear-gradient(0deg, #040403, #1a1b16),
//           linear-gradient(0deg, #222116, #303121);
//         color: var(--primary);
//       }
//     }
//   }
//   .hr {
//     background: #313021;
//     width: 100%;
//     height: 1px;
//   }

//   .avatar {
//     position: relative;
//     text-align: center;
//     margin-top: 16px;
//     .edit {
//       // position: absolute;
//       // top: 4px;
//       // right: 4px;
//       background-color: #235867;
//       color: #eee;
//       padding: 6px;
//       border-radius: 5px;
//       cursor: pointer;
//       z-index: 2;
//       transition: 0.2s;
//       width: 100%;
//       margin-top: 10px;
//       &:hover {
//         background: #169dc3;
//       }
//     }
//   }

//   .social-input {
//     display: flex;
//     align-items: center;
//     gap: 8px;
//     input {
//       padding: 0 16px;
//       font-size: 14px;
//       border: 1px solid var(--border-color3);
//       border-radius: 6px;
//       background-color: transparent;
//       outline: none;
//       width: 100%;
//       color: var(--white);
//       // height: 48px;
//       &:-internal-autofill-selected {
//         background-color: transparent;
//       }
//     }
//   }

//   .save-button {
//     background-color: #235867;
//     color: #eee;
//     padding: 6px;
//     border-radius: 5px;
//     cursor: pointer;
//     z-index: 2;
//     transition: 0.2s;
//     width: 100%;
//     margin-top: 10px;
//     text-align: center;
//     // width: 100px;
//     &:hover {
//       background: #169dc3;
//     }
//   }
// `;
export default TokensPage;
