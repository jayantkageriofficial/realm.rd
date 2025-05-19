"use client";

import React from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { Login as login } from "@/lib/actions/auth";
import logo from "@/assets/logo.svg";
import { redirect } from "next/navigation";

export default function Login(props: {
  searchParams: Promise<{
    path: string | undefined;
  }>;
}) {
  const [info, setInfo] = React.useState<{
    username?: string;
    password?: string;
    loading?: boolean;
  }>({});

  const { path } = React.use(props.searchParams);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInfo({ ...info, [e.target.id]: e.target.value });
  };
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setInfo({ ...info, loading: true });
    if (!info.username || !info.password) {
      setInfo({ ...info, loading: false });
      return toast.error("Fill all the fields");
    }
    if (info.password.length < 8) {
      setInfo({ ...info, loading: false });
      return toast.error("Invalid Credentials");
    }
    const res = await login(info.username || "", info.password || "");
    if (res == "locked") {
      toast.error("Application Locked");
      return redirect("/locked");
    }
    if (!res) {
      setInfo({ ...info, loading: false });
      return toast.error("Invalid Credentials");
    }
    const session = JSON.parse(res);
    if (!session.token) {
      setInfo({ ...info, loading: false });
      return toast.error("Invalid Credentials");
    }
    toast.success("Logged In");
    setInfo({ username: "", password: "", loading: false });
    return redirect(path || "/");
  };

  return (
    <>
      <section
        id="login"
        className="container flex items-center justify-center min-h-screen px-6 mx-auto"
      >
        <form className="w-full max-w-md" onSubmit={onSubmit}>
          <Image
            className="w-auto h-8 sm:h-9 select-none"
            src={logo}
            alt="Logo"
          />
          {/* 
          <h1 className="mt-3 text-2xl font-semibold text-gray-800 capitalize sm:text-3xl dark:text-white">
            Login
          </h1> */}

          <div className="relative flex items-center mt-8">
            <span className="absolute">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-6 h-6 mx-3 text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                />
              </svg>
            </span>

            <input
              type="text"
              className="block w-full py-3 border rounded-lg px-11 bg-secondary/60 text-amber-50 border-gray-600 focus:border-blue-300 focus:ring-blue-300 focus:outline-none focus:ring focus:ring-opacity-40"
              placeholder="Username"
              autoComplete="off"
              id="username"
              onChange={onChange}
              value={info.username || ""}
              disabled={info.loading}
            />
          </div>

          <div className="relative flex items-center mt-4">
            <span className="absolute">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-6 h-6 mx-3 text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </span>

            <input
              id="password"
              type="password"
              className="block w-full py-3 border rounded-lg px-11 bg-secondary/60 text-amber-50 border-gray-600 focus:border-blue-300 focus:ring-blue-300 focus:outline-none focus:ring focus:ring-opacity-40"
              placeholder="Password"
              autoComplete="off"
              onChange={onChange}
              value={info.password || ""}
              disabled={info.loading}
            />
          </div>

          <div className="mt-6">
            <button
              className={`w-full px-6 py-3 text-sm font-medium tracking-wide text-white capitalize transition-colors duration-300 transform bg-red-600 rounded-lg hover:bg-red-500 select-none focus:outline-none focus:ring focus:ring-blue-500 ${
                info.loading ? "cursor-not-allowed" : "cursor-pointer"
              }`}
              type="submit"
              disabled={info.loading}
            >
              Sign in
            </button>
          </div>
        </form>
      </section>
    </>
  );
}
