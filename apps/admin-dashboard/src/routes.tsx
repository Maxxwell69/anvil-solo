import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

import TradePage from "./pages/TradePage";
import FeePage from "./pages/FeePage";
import TokensPage from "./pages/TokensPage";
import UsersPage from "./pages/UsersPage";
import Login from "./pages/Login";
import UserDetailPage from "./pages/[userId]";
import { Now } from "./context/util";
import useStore from "./context/useStore";

const Router = () => {
  const { update, logined, lasttime } = useStore();

  React.useEffect(() => {
    if (logined) {
      if (lasttime + 43200 < Now()) {
        //session expiration 12 hours, logout
        update({
          email: "",
          token: "",
          logined: false,
          isMetamask: false,
          lasttime: 0,
        });
      }
      update({ lasttime: Now() });
    }
  }, []);
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TokensPage />}></Route>
        <Route path="/trade" element={<TradePage />}></Route>
        <Route path="/fee" element={<FeePage />}></Route>
        <Route path="/user" element={<UsersPage />}></Route>
        <Route path="/:userId" element={<UserDetailPage />}></Route>
        <Route path="/login" element={<Login />}></Route>
      </Routes>
      <Toaster position="top-center" />
    </BrowserRouter>
  );
};

export default Router;
