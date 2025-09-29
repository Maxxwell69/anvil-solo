import React, { useState } from "react";
import { styled } from "styled-components";

import Header from "./Layout/Header";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";
import useStore from "../context/useStore";
import { call, ellipsis, convertToDate } from "../context/util";
import Icon from "../components/icon";
import Loading from "../components/Loading";

const FeePage = () => {
  const [feeData, setFeeData] = useState<FeeInterface[]>([]);
  const [keyword, setKeyword] = useState("");
  const { update, loading } = useStore();

  const getFeeData = async () => {
    update({ loading: true });
    let data = await call("admin/getFee", { keyword: keyword });
    if (data && data.result) {
      const v = data.result;
      setFeeData(v);
    }
    update({ loading: false });
  };

  React.useEffect(() => {
    getFeeData(); // Initial fetch
    const intervalId = setInterval(() => {
      getFeeData();
    }, 20000);

    return () => clearInterval(intervalId);
  }, [keyword]);

  return (
    <Main>
      <Header type={3} />
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
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: "5%" }}>
                      <span>No</span>
                    </th>
                    <th style={{ width: "5%" }}>
                      <span>Sender</span>
                    </th>
                    <th style={{ width: "15%" }}>
                      <span>Receiver</span>
                    </th>
                    <th style={{ width: "20%" }}>
                      <span>Tx ID</span>
                    </th>

                    <th style={{ width: "7%" }}>
                      <span>Amount(Sol)</span>
                    </th>

                    <th style={{ flex: 1, width: "7%" }}>
                      <span>Period(day)</span>
                    </th>
                    <th style={{ flex: 1, width: "10%" }}>
                      <span>active</span>
                    </th>
                    <th style={{ flex: 1, width: "10%" }}>
                      <span>Sign</span>
                    </th>
                    <th style={{ flex: 1, width: "7%" }}>
                      <span>Start Date</span>
                    </th>
                    <th style={{ flex: 1, width: "7%" }}>
                      <span>Expire Date</span>
                    </th>
                    <th style={{ flex: 1, width: "7%" }}>
                      <span>Reg Date</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {feeData.map((fee: any, i: number) => (
                    <tr key={i}>
                      <td style={{ flex: 1 }}>
                        <span>{i + 1}</span>
                      </td>
                      <td style={{ flex: 1, color: "gray" }}>{fee.sender}</td>
                      <td style={{ flex: 1 }}>{ellipsis(fee.receiver, 6)}</td>
                      <td style={{ flex: 1 }}>
                        <Link
                          to={"https://solscan.io/tx/" + fee.txId}
                          target="_blank"
                        >
                          {ellipsis(fee.txId, 20)}
                        </Link>
                      </td>
                      <td style={{ flex: 1 }}>{fee.amount}</td>
                      <td style={{ flex: 1 }}>{fee.period}</td>
                      <td
                        style={{ flex: 1, color: fee.active ? "green" : "red" }}
                      >
                        {fee.active ? "true" : "false"}
                      </td>
                      <td style={{ flex: 1 }}>
                        {fee.description === "Premium is actived"
                          ? "Owner"
                          : "SuperAdmin"}
                      </td>
                      <td style={{ flex: 1, color: "green" }}>
                        {fee.start_date}
                      </td>
                      <td style={{ flex: 1, color: "red" }}>{fee.end_date}</td>
                      <td style={{ flex: 1 }}>
                        {convertToDate(fee.lastUpdated)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
export default FeePage;
