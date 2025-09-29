import React, { useState, useEffect } from "react";
import { styled } from "styled-components";
import { useParams } from "react-router-dom";

import Header from "./Layout/Header";
import Navbar from "../components/Navbar";
import { call, showToast } from "../context/util";
import useStore from "../context/useStore";
import Loading from "../components/Loading";
import Icon from "../components/icon";

const UserDetailPage = () => {
  const { userId } = useParams();
  const [user, setUser] = useState<any>(null);
  const { update, loading } = useStore();

  const [referralEnabled, setReferralEnabled] = useState<boolean>(false);
  const [loadings, setLoadings] = useState<boolean>(false);
  const [referralInfo, setReferralInfo] = useState<any>(null);
  const [botFeeInfo, setbotFeeInfo] = useState<any>(null);
  const [referralUsers, setReferralUsers] = useState<any[]>([]);
  const [botFee, setbotFee] = useState<any>(0);
  const [referralFee, setReferralFee] = useState<any>(0);
  const [referrerId, setReferrerId] = useState<any>(null);

  useEffect(() => {
    const fetchReferralUsers = async () => {
      try {
        const res = await call("admin/getUserIdsByReferrerId", { userId });
        if (!res) {
          console.error("No response received from API");
          return;
        }
        // const userIds = res;

        //  const userIds = Array.isArray(res.result) ? res.result : Object.values(res.result || {});
        const userIds = Array.isArray(res) ? res : Object.values(res || {});

        // Fetch user details for each referred user
        const userDetailsPromises = userIds.map(
          async (refUserId: string | number) => {
            try {
              const userDetailRes = await call("admin/userdetail", {
                userId: refUserId.toString(),
              });
              return (
                userDetailRes?.result || { userId: refUserId, userName: "N/A" }
              );
            } catch (err) {
              console.error(
                `Failed to fetch user details for ${refUserId}`,
                err
              );
              return { userId: refUserId, userName: "N/A" };
            }
          }
        );

        const referredUsers = await Promise.all(userDetailsPromises);
        setReferralUsers(referredUsers);
      } catch (err) {
        console.error("Failed to fetch referral users", err);
      }
    };

    fetchReferralUsers();
  }, [userId]);

  const fetchReferralStatus = async () => {
    try {
      const res = await call("admin/getReferralStatus", { userId });
      setReferralEnabled(res?.result?.enabled);
    } catch (err) {
      console.error("Failed to fetch referral status", err);
    }
  };

  const fetchReferraluser = async () => {
    try {
      const res = await call("admin/getReferraluser", { userId });
      setReferrerId(res?.result.referrerId);
    } catch (err) {
      console.error("Failed to fetch referral info", err);
    }
  };

  const fetchReferralInfo = async () => {
    try {
      const res = await call("admin/getReferralInfo", { userId });
      setReferralInfo(res?.result);
      setReferralFee(res?.result?.feeEarn);
    } catch (err) {
      console.error("Failed to fetch referral info", err);
    }
  };

  const fetchBotFeeInfo = async () => {
    try {
      const res = await call("admin/getBotFee", { userId });
      setbotFeeInfo(res?.result);
      setbotFee(res?.result?.fee);
    } catch (err) {
      console.error("Failed to fetch referral info", err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchReferralStatus();
        await fetchReferralInfo();
        await fetchBotFeeInfo();
        await fetchReferraluser();
      } catch (err) {
        console.error("Failed to fetch data:", err);
      }
    };
    fetchData();
  }, [userId]);

  const handleToggle = async () => {
    try {
      setLoadings(true);
      const newStatus = !referralEnabled;
      await call("admin/toggleReferral", {
        userId,
        enabled: newStatus,
      });
      setReferralEnabled(newStatus);
    } catch (err) {
      console.error("Toggle failed:", err);
      alert("Failed to update referral status");
    } finally {
      setLoadings(false);
    }
  };

  const getUserDetails = async () => {
    update({ loading: true });
    const data = await call("admin/userdetail", { userId });
    if (data && data.result) {
      setUser(data.result);
    }
    update({ loading: false });
  };

  useEffect(() => {
    if (userId) {
      getUserDetails();
    }
  }, [userId]);

  if (!user) return null;

  return (
    <Main>
      <Header type={5} />
      <div className="container">
        <Navbar />
        <div className="content">
          <div className="back-button" onClick={() => window.history.back()}>
            <Icon icon="ArrowLeft" size={24} /> Back to Users
          </div>
          <div className="user-detail bg-lightblack br-12" style={{
            height: "100%",
            overflow: "scroll"
          }}>
            <h2 className="text-white">User Details</h2>
            <div className="detail-container">
              <div className="detail-item">
                <span className="label">User ID:</span>
                <span className="value">{userId}</span>
              </div>
              <div className="detail-item">
                <span className="label">Username:</span>
                <span className="value">{user.userName}</span>
              </div>

              {botFeeInfo && (
                <>
                  <div className="detail-item">
                    <span className="label">bot Fee:</span>
                    <span className="value">{botFeeInfo.fee || 0}</span>
                  </div>
                </>
              )}
              {referralInfo && (
                <>
                  <div className="detail-item">
                    <span className="label">Referral Fee Earned:</span>
                    <span className="value">{referralInfo.feeEarn || 0}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Referral Wallet:</span>
                    <span className="value">
                      {referralInfo.wallet || "N/A"}
                    </span>
                  </div>
                </>
              )}

              <div className="detail-item">
                <span className="label">Referrer Id:</span>
                <div className="input-group">
                  <input
                    type="text" pattern="[0-9]*"
                    className="value input-field"
                    value={referrerId}
                    onChange={(e) => {
                      setReferrerId(e.target.value);
                    }}
                  />
                  <button
                    className="update-btn"
                    onClick={async () => {
                      try {
                        update({ loading: true });
                        await call("admin/updateReferrerId", {
                          userId: userId,
                          referrerId,
                        });
                        showToast("referrer id updated successfully");
                      } catch (err) {
                        console.error("Failed to referrer Id", err);
                        showToast("Failed to referrer Id");
                      } finally {
                        update({ loading: false });
                      }
                    }}
                  >
                    Update
                  </button>
                </div>
              </div>

              <div className="detail-item">
                <span className="label">Bot Fee (%):</span>
                <div className="input-group">
                  <input
                    type="number"
                    className="value input-field"
                    value={botFee}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (value >= 0 && value <= 100) {
                        setbotFee(value);
                      }
                    }}
                  />
                  <button
                    className="update-btn"
                    onClick={async () => {
                      try {
                        update({ loading: true });
                        await call("admin/updateBotFee", {
                          userId,
                          fee: botFee,
                        });
                        showToast("Bot fee updated successfully");
                        const res = await call("admin/getBotFee", { userId });
                        setbotFeeInfo(res?.result);
                      } catch (err) {
                        console.error("Failed to update bot fee", err);
                        showToast("Failed to update bot fee");
                      } finally {
                        update({ loading: false });
                      }
                    }}
                  >
                    Update
                  </button>
                </div>
              </div>
              <div className="detail-item">
                <span className="label">Referral Fee (%):</span>
                <div className="input-group">
                  <input
                    type="number"
                    className="value input-field"
                    value={referralFee}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (value >= 0 && value <= 100) {
                        setReferralFee(value);
                      }
                    }}
                  />
                  <button
                    className="update-btn"
                    onClick={async () => {
                      try {
                        update({ loading: true });
                        await call("admin/updateReferralFee", {
                          userId,
                          fee: referralFee,
                        });
                        showToast("Referral fee updated successfully");
                        const res = await call("admin/getReferralInfo", {
                          userId,
                        });
                        setReferralInfo(res?.result);
                      } catch (err) {
                        console.error("Failed to update referral fee", err);
                        showToast("Failed to update referral fee");
                      } finally {
                        update({ loading: false });
                      }
                    }}
                  >
                    Update
                  </button>
                </div>
              </div>
              <div className="detail-item">
                <span className="label">Referral Status:</span>
                <div className="toggle-container">
                  <span className="toggle-label off">OFF</span>
                  <div
                    className="toggle-switch"
                    style={{
                      pointerEvents: loading ? "none" : "auto",
                      opacity: loading ? 0.5 : 1,
                    }}
                    onClick={handleToggle}
                  >
                    <div
                      className={`switch ${referralEnabled ? "active" : ""}`}
                    ></div>
                  </div>
                  <span className="toggle-label on">ON</span>
                </div>
              </div>
            </div>
            <div>
              {Array.isArray(referralUsers) && referralUsers.length > 0 ? (
                <div className="referral-list card">
                  <h3 className="section-title">🎁 Referred Users</h3>
                  <div className="table-container">
                    <table className="referral-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>User ID</th>
                          <th>Username</th>
                        </tr>
                      </thead>
                      <tbody>
                        {referralUsers.map((user, i) => (
                          <tr key={i}>
                            <td>{i + 1}</td>
                            <td>{user.userId}</td>
                            <td>{user.userName}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  <p className="empty-message">No users referred yet.</p>
                  <span className="empty-icon">🙁</span>
                </div>
              )}
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
      padding: 0 var(--space) var(--space) var(--space);

      .back-button {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: var(--brown);
        cursor: pointer;
        margin-bottom: 1rem;
        transition: color 0.2s;

        &:hover {
          color: white;
        }
      }
      .user-detail {
        padding: 2rem;

        h2 {
          margin-bottom: 2rem;
        }

        .detail-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;

          .detail-item {
            display: flex;
            gap: 1rem;

            .label {
              color: var(--brown);
              min-width: 150px;
            }

            .value {
              color: white;

              &.input-field {
                background: transparent;
                border: 1px solid var(--brown);
                border-radius: 4px;
                padding: 0.5rem;
                width: 100px;
                &:focus {
                  border-color: var(--green);
                  outline: none;
                }
              }
            }

            .toggle-switch {
              width: 50px;
              height: 24px;
              background-color: var(--black);
              border-radius: 12px;
              padding: 2px;
              cursor: pointer;
              position: relative;

              .switch {
                width: 20px;
                height: 20px;
                background-color: var(--brown);
                border-radius: 50%;
                transition: transform 0.2s, background-color 0.2s;

                &.active {
                  transform: translateX(26px);
                  background-color: var(--green);
                }
              }
            }
            .input-group {
              display: flex;
              gap: 1rem;
              align-items: center;

              .update-btn {
                background-color: var(--green);
                color: white;
                border: none;
                border-radius: 4px;
                padding: 0.5rem 1rem;
                cursor: pointer;
                transition: opacity 0.2s;

                &:hover {
                  opacity: 0.8;
                }
              }
            }
          }
        }
      }
    }
  }

  .toggle-container {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .toggle-label {
    font-size: 12px;
    font-weight: 500;
    &.off {
      color: var(--brown);
    }
    &.on {
      color: var(--green);
    }
  }

  .toggle-switch {
    width: 50px;
    height: 24px;
    background-color: var(--black);
    border-radius: 12px;
    padding: 2px;
    cursor: pointer;
    position: relative;

    .switch {
      width: 20px;
      height: 20px;
      background-color: var(--brown);
      border-radius: 50%;
      transition: transform 0.2s, background-color 0.2s;

      &.active {
        transform: translateX(26px);
        background-color: var(--green);
      }
    }
  }

  .referral-list.card {
    background: #1e1e2f;
    padding: 1.5rem;
    border-radius: 10px;
    margin-top: 2rem;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.25);
  }

  .section-title {
    color: #ffffff;
    margin-bottom: 1rem;
    font-size: 1.25rem;
  }

  .referral-table {
    width: 100%;
    border-collapse: collapse;
  }

  .referral-table th,
  .referral-table td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid #444;
    color: #e0e0e0;
  }

  .referral-table tr:nth-child(even) {
    background-color: #2a2a3d;
  }

  .referral-table tr:hover {
    background-color: #333355;
    cursor: pointer;
  }

  .empty-state {
    text-align: center;
    padding: 2rem;
    color: #aaa;
  }

  .empty-message {
    font-size: 1.1rem;
  }

  .empty-icon {
    font-size: 2rem;
    margin-top: 0.5rem;
    display: block;
  }
`;

export default UserDetailPage;
