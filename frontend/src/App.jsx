import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { getToken } from "./services/api";
import Detail from "./components/Detail";
import Layout from "./components/Layout";
import Liste from "./components/Liste";
import Login from "./components/Login";

function Privee({ children }) {
  return getToken() ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<Privee><Layout /></Privee>}>
          <Route path="/" element={<Liste />} />
          <Route path="/fiches/:id" element={<Detail />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
