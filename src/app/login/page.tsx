"use client";

import React, { useState } from "react";
import styles from "./login.module.css";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const credentials = btoa(`${username}:${password}`);
      console.log("Credentials:", credentials);
      const response = await fetch(
        "https://zone01normandie.org/api/auth/signin",
        {
          method: "POST",
          headers: {
            Authorization: "Basic " + credentials,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Login failed");
      } else {
        const token = await response.json();
        document.cookie = `token=${token}; secure;`;
        console.log("Token set in cookie:", document.cookie);
        document.location.href = "/";
      }
    } catch (error) {
      setErrorMessage("Incorrect credentials. Please try again.");
      console.log("Error:", error);
      setIsLoading(false);
      return;
    }
  };

  return (
    <div className={styles.page}>
      <h2>Login</h2>
      {errorMessage && (
        <div className={styles.errorMessage}>
          <p>{errorMessage}</p>
        </div>
      )}
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputGroup}>
          <label>Username:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div className={styles.inputGroup}>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          className={styles.submitButton}
          disabled={isLoading}
        >
          {isLoading ? "Loading..." : "Login"}
        </button>
      </form>
    </div>
  );
}
