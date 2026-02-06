import React, { useState, useEffect } from "react";
import supabase from "../lib/supabaseClient";
import { getCompanyData } from "../lib/getCompanyData";

type User = {
  id: number;
  username: string;
  password: string;
  role?: string;
  email?: string;
  nombre_usuario?: string;
};

type LoginProps = {
  onLogin?: () => void;
};

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("ViSonixRo");
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);

  useEffect(() => {
    loadCompanyInfo();
  }, []);

  async function loadCompanyInfo() {
    try {
      const company = await getCompanyData();
      if (company) {
        setCompanyName(company.nombre || "ViSonixRo");
        setCompanyLogo(company.logoUrl || null);
      }
    } catch (err) {
      console.error("Error loading company data:", err);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    try {
      console.log("Attempting login for:", cleanUsername);

      // Use ilike for case-insensitive username matching
      const { data: sbData, error: sbError } = await supabase
        .from("users")
        .select("id, username, password, role, nombre_usuario")
        .ilike("username", cleanUsername)
        .limit(1)
        .maybeSingle();

      if (sbError) {
        setMessage("Error de base de datos: " + sbError.message);
        console.error("Supabase error:", sbError);
        return;
      }

      if (!sbData) {
        console.log("User not found in DB");
        setMessage("Usuario no encontrado");
        return;
      }

      console.log("User found:", sbData.username);
      const found = sbData as User;

      // Compare passwords
      if (found.password === cleanPassword) {
        const toStore = {
          id: found.id,
          username: found.username,
          role: found.role,
          name: found.nombre_usuario,
        };
        localStorage.setItem("user", JSON.stringify(toStore));

        // Load additional info for cashiers
        try {
          if (found.role === "cajero") {
            // Fetch CAI
            const { data: caiRows } = await supabase
              .from("cai")
              .select("*")
              .eq("cajero", found.username)
              .order("id", { ascending: false })
              .limit(1);

            if (caiRows && caiRows.length > 0) {
              localStorage.setItem("caiInfo", JSON.stringify(caiRows[0]));
            }

            // Fetch NC Info
            const { data: ncRows } = await supabase
              .from("ncredito")
              .select("*")
              .eq("cajero", found.username)
              .order("id", { ascending: false })
              .limit(1);

            if (ncRows && ncRows.length > 0) {
              localStorage.setItem("ncInfo", JSON.stringify(ncRows[0]));
            }
          }
        } catch (e) {
          console.error("Error loading extra user data", e);
        }

        setMessage("Inicio de sesión correcto");
        if (typeof onLogin === "function") onLogin();
      } else {
        console.log(
          "Password mismatch. Input:",
          cleanPassword,
          "Stored:",
          found.password,
        );
        setMessage("Contraseña incorrecta");
      }
    } catch (err: any) {
      console.error("Login exception:", err);
      setMessage(err.message || "Error desconocido");
    }
  }

  return (
    <div className="login-root">
      <div className="login-card" role="region" aria-label="login panel">
        {companyLogo && (
          <div className="login-logo">
            <img src={companyLogo} alt="Logo de la empresa" />
          </div>
        )}
        <h3 className="login-title">Bienvenido a {companyName}</h3>
        <div className="login-sub">Inicia sesión con tu cuenta</div>

        <div className="login-inner">
          <form onSubmit={handleSubmit}>
            <div className="form-field">
              <label htmlFor="username">Usuario</label>
              <input
                id="username"
                className="input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="usuario"
                required
                autoComplete="username"
              />
            </div>

            <div className="form-field">
              <label htmlFor="password">Contraseña</label>
              <input
                id="password"
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="contraseña"
                required
                autoComplete="current-password"
              />
            </div>

            <div>
              <button className="btn-primary" type="submit">
                Entrar
              </button>
            </div>
          </form>

          {message && <p className="login-message">{message}</p>}
        </div>
      </div>
    </div>
  );
}
