import React from "react";
import { styled } from "styled-components";
import { useNavigate } from "react-router-dom";
import useStore from "../context/useStore";
import Icon from "./icon";

const Navbar = () => {
  const navigate = useNavigate();
  const { email, name, update } = useStore();

  const logout = async () => {
    update({ logined: false, email: "", name: "" });
    navigate("/login");
  };

  return (
    <Nav>
      <div className="username">
        <span className="text-white">{name}</span>
        <span className="text-gray">{email}</span>
      </div>
      {/* <img src={user_img} alt="" /> */}
      <div className="bg-darkred" onClick={logout}>
        <Icon icon="Logout" size={20} />
      </div>
    </Nav>
  );
};

const Nav = styled.nav`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  height: 120px;
  width: 100%;
  padding-right: var(--space);
  gap: 20px;

  .username {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: flex-start;
    gap: 5px;
    & > span:first-of-type {
      font-size: 18px;
    }

    & > span:last-of-type {
      font-size: 12px;
    }
  }
  img {
    width: 40px;
    height: 40px;
  }

  .bg-darkred {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    color: var(--red);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    &:hover {
      opacity: 0.8;
    }
  }
`;
export default Navbar;
