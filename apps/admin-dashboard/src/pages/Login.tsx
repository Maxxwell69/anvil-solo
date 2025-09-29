import React from "react";
import { useNavigate } from "react-router-dom";
import jwtDecode from "jwt-decode";
import styled from "styled-components";
import { call, Now, showToast } from "../context/util";

import logo_img from "../assets/images/logo.png";
import useStore from "../context/useStore";

const Login = () => {
  const navigate = useNavigate();
  const [status, setStatus] = React.useState({
    name: "",
    password: "",
    showpassword: false,
  });

  const { update, logined, email } = useStore();

  const login = async () => {
    try {
      const name = status.name;
      const password = status.password;
      if (!name || !password) return showToast("Input email and password");
      const result =
        (
          await call("admin/login", {
            email: name,
            password: password,
          })
        )?.result || null;
      if (result) {
        switch (result["message"]) {
          case "success": {
            const token = result["token"];
            var data = jwtDecode(token) as any;
            console.log("data: ", data);
            update({
              email: data?.email,
              name: data?.name,
              token: token,
              logined: true,
              lasttime: Now(),
            });
            navigate("/");
            break;
          }
          default: {
            showToast(result["message"]);
          }
        }
      }
    } catch (ex) {}
  };

  React.useEffect(() => {
    if (logined && email) {
      navigate("/");
    }
  }, []);

  return (
    <StyledMain>
      <div style={{}}>
        <StyledContainer className="container">
          <StyledLoginPanel>
            <div className="d center middle gap">
              <div>
                <img src={logo_img} alt="logo" width={40} />
              </div>
              <h2 style={{}}>Anvil Bot Admin</h2>
            </div>
            <div style={{ marginTop: "3em" }}>Email</div>
            <input
              type="text"
              placeholder=""
              value={status.name}
              onChange={(e) => {
                setStatus({ ...status, name: e.target.value });
              }}
            />
            <div style={{ marginTop: "2em" }}>Password</div>
            <input
              type="password"
              placeholder=""
              value={status.password}
              onChange={(e) => {
                setStatus({ ...status, password: e.target.value });
              }}
            />
            <div className="login-btn" onClick={login}>
              Login
            </div>
          </StyledLoginPanel>
        </StyledContainer>
      </div>
    </StyledMain>
  );
};

export default Login;

const StyledMain = styled.div`
  background-color: var(--dark-black);
  background-image: linear-gradient(
    to right bottom,
    var(--dark-black) 18.87%,
    #1e1e1e 56.45%,
    #18181a 76.26%
  );
  color: white;
`;

const StyledContainer = styled.div`
  padding: 3rem 0 8rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  @media (max-width: 1024px) {
    padding: 1rem 0;
  }
  @media (max-width: 768px) {
    padding: 0;
  }
  min-height: 100vh;
`;

const StyledLoginPanel = styled.div`
  border-radius: 2rem;
  background-color: ${({ theme }) => theme.boxColor};
  padding: 2rem 5rem;
  width: 90%;
  max-width: 600px;
  color: ${({ theme }) => theme.text};
  margin: 3rem auto;
  .login-btn {
    background-color: #258aa7;
    color: #eee;
    padding: 12px;
    border-radius: 8px;
    cursor: pointer;
    z-index: 2;
    transition: 0.2s;
    width: 100%;
    margin-top: 10px;
    text-align: center;
    margin-top: 1em;
    &:hover {
      background: #169dc3;
    }
  }
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
  .title {
    color: white;
    text-align: center;
    font-size: 2rem;
    margin: 0;
  }
  a {
    text-align: center;
    color: #6b9beb;
  }
  @media (max-width: 768px) {
    width: 100%;
    padding: 2rem 1rem;
    margin: 1.5rem auto 5rem;
    a {
      display: block;
    }
    .link {
      text-align: center;
    }
  }
  .logo {
    cursor: pointer;
    width: 240px;
    height: auto;
    @media (max-width: 768px) {
      margin: 0 8px;
      width: 150px;
    }
  }
`;
