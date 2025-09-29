import React, { useState, useEffect } from "react";
import { styled } from "styled-components";
import { useNavigate } from "react-router-dom";

import Header from "./Layout/Header";
import Navbar from "../components/Navbar";
import { call } from "../context/util";
import Icon from "../components/icon";
import useStore from "../context/useStore";
import Loading from "../components/Loading";

const UserPage = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserInterface[]>([]);
  const [keyword, setKeyword] = useState("");
  const { update, loading } = useStore();

  const getUserList = async () => {
    update({ loading: true });

    const data = await call("admin/userlist", { keyword: keyword });
    if (data && data.result) {
      setUsers(data.result);
    }
    update({ loading: false });
  };

  const handleUserClick = (userId: string) => {
    navigate(`/${userId}`);
  };

  React.useEffect(() => {
    getUserList(); // Initial fetch
    const intervalId = setInterval(() => {
      getUserList();
    }, 10000);

    return () => clearInterval(intervalId);
  }, [keyword]);

  return (
    <Main>
      <Header type={5} />
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
                />
                <Icon icon="Search" />
              </div>
              <div className="total-user">
                <span>Total User : </span>
                {users.length}
              </div>
            </div>
            <div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th style={{ flex: 1 }}>
                        <span>No</span>
                      </th>
                      <th style={{ flex: 1 }}>
                        <span>User ID</span>
                      </th>
                      <th style={{ flex: 1 }}>
                        <span>User Name</span>
                      </th>
                      <th style={{ flex: 1 }}>
                        <span>Premium Status</span>
                      </th>
                      <th style={{ flex: 1 }}>
                        <span>Num of Referrals</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user: any, i: number) => (
                      <tr
                        key={i}
                        onClick={() => handleUserClick(user.userId)}
                        style={{ cursor: "pointer" }}
                      >
                        <td style={{ flex: 1 }}>{i + 1}</td>
                        <td style={{ flex: 1, color: "gray" }}>
                          {user.userId}
                        </td>
                        <td style={{ flex: 1 }}>{user.userName}</td>
                        <td
                          style={{
                            flex: 1,
                            color: user.premium ? "green" : "red",
                          }}
                        >
                          {user.premium ? "true" : "false"}
                        </td>
                        <td style={{ flex: 1 }}>{user.referralCount}</td>
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
          justify-content: space-between;
          gap: 10px;
          padding: 15px;

          .token-search {
            border-radius: var(--space);
            background-color: var(--black);
            padding: 0 30px;
            display: flex;
            align-items: center;
            gap: 10px;
            color: var(--brown);

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

          .total-user {
            font-size: 1.2em;
            color: red;
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
      margin: 0 -1px;
      thead {
        tr {
          border-bottom: 1px solid var(--light-black);
          th {
            position: sticky;
            top: 0;
            padding: 10px 0;
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
            font-size: 1em;
            padding: 10px 0;
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
export default UserPage;