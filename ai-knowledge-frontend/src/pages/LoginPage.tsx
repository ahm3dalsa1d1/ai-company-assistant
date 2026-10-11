import {
  useState
} from "react";

import type {
  SubmitEvent
} from "react";
import { useNavigate } from "react-router-dom";

import { login } from "../services/auth";


import {
  useAuth
} from "../context/AuthContext";

import {
  Bot,
  LockKeyhole,
  LogIn,
  User,
} from "lucide-react";


export default function LoginPage() {

  const navigate = useNavigate();

  const [username, setUsername] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

    const { refreshUser } = useAuth();


async function handleSubmit(
  event: SubmitEvent<HTMLFormElement>
) {
  event.preventDefault();

  setError("");
  setLoading(true);

  try {
    const result = await login(
      username,
      password
    );

    sessionStorage.setItem(
      "access_token",
      result.access_token
    );

    await refreshUser();

    navigate("/chat");

  } catch {
    setError(
      "Incorrect username or password"
    );

  } finally {
    setLoading(false);
  }
}

 return (
  <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-6 py-12">

    {/* BACKGROUND DECORATION */}
    <div className="pointer-events-none absolute inset-0">

      <div className="absolute left-1/4 top-0 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />

      <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />

    </div>


    <div className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl shadow-black/40 lg:grid-cols-2">

      {/* LEFT SIDE */}
      <section className="hidden flex-col justify-between bg-gradient-to-br from-indigo-600 to-indigo-800 p-10 text-white lg:flex">

        <div>

          <div className="mb-10 flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
              <Bot size={23} />
            </div>

            <div>
              <p className="font-semibold">
                AI Knowledge
              </p>

              <p className="text-xs text-indigo-200">
                Company Assistant
              </p>
            </div>

          </div>


          <h1 className="max-w-md text-4xl font-semibold leading-tight tracking-tight">
            Find answers inside your company knowledge.
          </h1>


          <p className="mt-5 max-w-md text-sm leading-6 text-indigo-100">
            Search authorized documents,
            ask natural-language questions,
            and get contextual answers through
            the company knowledge base.
          </p>

        </div>


        <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur">

          <p className="text-sm font-medium">
            Secure by design
          </p>

          <p className="mt-1 text-xs leading-5 text-indigo-100">
            Access to documents and AI responses
            is controlled by your account permissions.
          </p>

        </div>

      </section>


      {/* LOGIN SIDE */}
      <section className="bg-white p-8 sm:p-12">

        {/* MOBILE BRAND */}
        <div className="mb-10 flex items-center gap-3 lg:hidden">

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <Bot size={21} />
          </div>

          <div>
            <p className="font-semibold text-slate-900">
              AI Knowledge
            </p>

            <p className="text-xs text-slate-500">
              Company Assistant
            </p>
          </div>

        </div>


        <div className="mb-8">

          <p className="mb-2 text-sm font-medium text-indigo-600">
            Welcome back
          </p>

          <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
            Sign in to your account
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Enter your credentials to continue
            to the knowledge assistant.
          </p>

        </div>


        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >

          {/* USERNAME */}
          <div>

            <label
              htmlFor="username"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Username
            </label>


            <div className="relative">

              <User
                size={18}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                id="username"
                value={username}
                onChange={event =>
                  setUsername(
                    event.target.value
                  )
                }
                autoComplete="username"
                required
                placeholder="Enter your username"
                className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
              />

            </div>

          </div>


          {/* PASSWORD */}
          <div>

            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Password
            </label>


            <div className="relative">

              <LockKeyhole
                size={18}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                id="password"
                type="password"
                value={password}
                onChange={event =>
                  setPassword(
                    event.target.value
                  )
                }
                autoComplete="current-password"
                required
                placeholder="Enter your password"
                className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
              />

            </div>

          </div>


          {/* ERROR */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}


          {/* LOGIN BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 active:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >

            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Signing in...
              </>
            ) : (
              <>
                <LogIn size={18} />
                Sign in
              </>
            )}

          </button>

        </form>


        <p className="mt-8 text-center text-xs leading-5 text-slate-400">
          Access is restricted according to
          your assigned account permissions.
        </p>

      </section>

    </div>

  </main>
);
}