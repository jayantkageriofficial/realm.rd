"use client";

import React from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { ChangeLockPassword } from "@/lib/actions/auth";
import logo from "@/assets/logo.svg";
import { redirect } from "next/navigation";

export default function LockPassword() {
  const [info, setInfo] = React.useState<{
    currentpwd?: string;
    newpwd?: string;
    cfpwd?: string;
    loading?: boolean;
  }>({});

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInfo({ ...info, [e.target.id]: e.target.value });
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const id = toast.loading("Processing");
    setInfo({ ...info, loading: true });
    if (!info.currentpwd || !info.newpwd || !info.cfpwd) {
      setInfo({ ...info, loading: false });
      return toast.error("Fill all the fields", { id });
    }
    if (info.newpwd.length < 8) {
      setInfo({ ...info, loading: false });
      return toast.error("Minimum Password lenth is 8", { id });
    }
    if (info.newpwd != info.cfpwd) {
      setInfo({ ...info, loading: false });
      return toast.error("Password confirmation failed", { id });
    }
    const res = await ChangeLockPassword(info.currentpwd, info.cfpwd);
    if (!res) {
      setInfo({ ...info, loading: false });
      return toast.error("Internal Error", { id });
    }
    setInfo({ loading: false });
    toast.success("Changed Applicaiton Lock Password", { id });
    return redirect("/");
  };

  return (
    <>
      <section id="app-pwd" className="min-h-screen flex">
        <div className="w-full max-w-md mx-auto my-auto overflow-hidden rounded-lg bg-primary">
          <div className="px-6 py-4">
            <div className="flex justify-baseline mx-auto">
              <Image
                className="w-auto h-7 sm:h-8 select-none"
                src={logo}
                alt="Logo"
              />
            </div>

            <h3 className="mt-3 text-xl font-medium text-start text-gray-600 dark:text-gray-200">
              Change Application Lock Password
            </h3>

            <form onSubmit={onSubmit}>
              <div className="w-full mt-5">
                <input
                  className="block w-full py-3 border rounded-lg px-4 bg-secondary/60 text-amber-50 border-gray-600 focus:border-blue-300 focus:ring-blue-300 focus:outline-none focus:ring focus:ring-opacity-40"
                  type="password"
                  placeholder="Current Password"
                  id="currentpwd"
                  disabled={info.loading}
                  onChange={onChange}
                />
              </div>

              <div className="w-full mt-4">
                <input
                  className="block w-full py-3 border rounded-lg px-4 bg-secondary/60 text-amber-50 border-gray-600 focus:border-blue-300 focus:ring-blue-300 focus:outline-none focus:ring focus:ring-opacity-40"
                  type="password"
                  placeholder="New Password"
                  id="newpwd"
                  disabled={info.loading}
                  onChange={onChange}
                />
              </div>

              <div className="w-full mt-4">
                <input
                  className="block w-full py-3 border rounded-lg px-4 bg-secondary/60 text-amber-50 border-gray-600 focus:border-blue-300 focus:ring-blue-300 focus:outline-none focus:ring focus:ring-opacity-40"
                  type="password"
                  placeholder="Confirm New Password"
                  id="cfpwd"
                  disabled={info.loading}
                  onChange={onChange}
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
                  Change Password
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
