import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { getToken } from "./services/api";
import Detail from "./components/Detail";
import Layout from "./components/Layout";
import Liste from "./components/Liste";
import Creation from "./components/Creation";
import Login from "./components/Login";
import Inscription from "./components/Inscription";
import Statistiques from "./components/Statistiques";
import "./App.css";

function Privee({ children }) {
  return getToken() ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/inscription" element={<Inscription />} />
        <Route element={<Privee><Layout /></Privee>}>
          <Route path="/" element={<Liste />} />
          <Route path="/fiches/nouvelle" element={<Creation />} />
          <Route path="/fiches/:id" element={<Detail />} />
          <Route path="/statistiques" element={<Statistiques />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
