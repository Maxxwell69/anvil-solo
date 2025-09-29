import React from "react";
import { styled } from "styled-components";
import { Link } from "react-router-dom";

import logo_img from "../../assets/images/logo.png";
import Icon from "../../components/icon";

interface HeaderProps {
  type: number;
}
const Header = ({ type }: HeaderProps) => {
  return (
    <HeaderStyle>
      <Link to="/">
        <div className="logo">
          <img src={logo_img} alt="logo" width={40} />
          <span className="text-white">Anvil Bot Admin</span>
        </div>
      </Link>
      <div className="menu">
        <ul>
          <Link to="/">
            <li className={`${type === 4 ? "active" : "text-gray"}`}>
              <Icon icon="Menu" size={18} height={20} />
              <span>Tokens</span>
            </li>
          </Link>
          <Link to="/trade">
            <li className={`${type === 2 ? "active" : "text-gray"}`}>
              <Icon icon="Trade" size={18} height={20} />
              <span>Trades</span>
            </li>
          </Link>
          <Link to="/fee">
            <li className={`${type === 3 ? "active" : "text-gray"}`}>
              <Icon icon="Info" size={18} height={20} />
              <span>Premium</span>
            </li>
          </Link>
          <Link to="/user">
            <li className={`${type === 5 ? "active" : "text-gray"}`}>
              <Icon icon="User" size={18} height={20} />
              <span>Users</span>
            </li>
          </Link>
        </ul>
      </div>
    </HeaderStyle>
  );
};

const HeaderStyle = styled.div`
  display: flex;
  flex-direction: column;
  background-color: var(--light-black);
  width: 345px;
  height: 100vh;

  a {
    text-decoration: none;
    .logo {
      height: 80px;
      display: flex;
      align-items: center;
      margin-left: 30px;
      justify-content: flex-start;
      gap: 10px;
      // gap: var(--space);
      img {
        width: 48px;
        height: 48px;
      }
      span {
        font-family: "Inter";
        font-family: 700;
        font-size: 18x;
        line-height: 16.94px;
        color: var(--white);
      }
    }
  }

  .menu {
    display: flex;
    flex-direction: column;
    width: 100%;
    justify-content: center;
    ul {
      a {
        text-decoration: none;
      }
      display: flex;
      flex-direction: column;
      list-style-type: none;

      li {
        display: flex;
        align-items: center;
        padding: 12px 0;
        gap: 15px;
        border-right: 8px solid transparent;
        height: 48px;
        padding-left: var(--space);

        &:hover {
          background-color: var(--black);
          color: var(--white);
          cursor: pointer;
        }
        &.active {
          border-right: 8px solid var(--green);
          color: var(--green);
          border-radius: 4px;
          background-color: var(--dark-blue);
        }

        svg {
          width: 24px;
          height: 24px;
        }

        span {
          font-family: Squada One;
          font-size: 20px;
          font-weight: 400;
          line-height: 19.03px;
          text-align: left;
          text-underline-position: from-font;
          text-decoration-skip-ink: none;
        }
      }
    }
  }
`;
export default Header;
