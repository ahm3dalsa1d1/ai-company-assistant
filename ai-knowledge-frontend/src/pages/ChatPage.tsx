import {
  useEffect,
  useState,
} from "react";

import type {
  SyntheticEvent,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  useAuth,
} from "../context/AuthContext";

import {
  getConversationMessages,
  getConversations,
  streamChat,
  deleteConversation
} from "../services/chat";

import type {
  Conversation,
  Message,
} from "../types";

import {
  Bot,
  FileText,
  LogOut,
  MessageSquarePlus,
  Send,
  Trash2,
  User,
} from "lucide-react";


export default function ChatPage() {

  const navigate = useNavigate();

  const {
    user,
    logout,
  } = useAuth();


  const [
    conversations,
    setConversations,
  ] = useState<Conversation[]>([]);

  const [
    activeConversationId,
    setActiveConversationId,
  ] = useState<number | null>(
    null
  );

  const [
    messages,
    setMessages,
  ] = useState<Message[]>([]);

  const [
    question,
    setQuestion,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");


  useEffect(() => {
    loadConversations();
  }, []);


  async function loadConversations() {

    try {

      const data =
        await getConversations();

      setConversations(data);

    } catch {

      setError(
        "Failed to load conversations"
      );
    }
  }


  async function selectConversation(
    conversationId: number
  ) {

    setError("");

    try {

      const data =
        await getConversationMessages(
          conversationId
        );

      setActiveConversationId(
        conversationId
      );

      setMessages(data);

    } catch {

      setError(
        "Failed to load conversation"
      );
    }
  }


  function startNewConversation() {

    setActiveConversationId(
      null
    );

    setMessages([]);

    setQuestion("");

    setError("");
  }

  async function handleDeleteConversation(
  conversationId: number,
  title: string
) {

  const confirmed =
    window.confirm(
      `Delete "${title}"?`
    );

  if (!confirmed) {
    return;
  }


  setError("");


  try {

    await deleteConversation(
      conversationId
    );


    // Remove it from the sidebar
    setConversations(
      current =>
        current.filter(
          conversation =>
            conversation.id
            !== conversationId
        )
    );


    // If the deleted conversation
    // is currently open, clear the chat.
    if (
      activeConversationId
      === conversationId
    ) {

      setActiveConversationId(
        null
      );

      setMessages([]);
    }

  } catch (error) {

    if (error instanceof Error) {
      setError(
        error.message
      );
    } else {
      setError(
        "Failed to delete conversation"
      );
    }
  }
}


  function handleLogout() {

    logout();

    navigate(
      "/login",
      {
        replace: true,
      }
    );
  }


  async function handleSubmit(
    event: SyntheticEvent<HTMLFormElement>
  ) {

    event.preventDefault();

    if (
      !question.trim()
      || loading
    ) {
      return;
    }


    const userQuestion =
      question.trim();

    setQuestion("");

    setError("");

    setLoading(true);


    // Immediately display the user's
    // question and an empty assistant
    // message for streaming.
    setMessages(
      current => [
        ...current,

        {
          role: "user",
          content: userQuestion,
        },

        {
          role: "assistant",
          content: "",
        },
      ]
    );


    try {

      let conversationId =
        activeConversationId;


      await streamChat(
        userQuestion,
        activeConversationId,
        {

          onMetadata: (
            newConversationId
          ) => {

            conversationId =
              newConversationId;

            setActiveConversationId(
              newConversationId
            );
          },


          onToken: token => {

            setMessages(
              current => {

                const updated =
                  [...current];

                const lastIndex =
                  updated.length - 1;

                if (lastIndex < 0) {
                  return current;
                }

                const lastMessage =
                  updated[lastIndex];

                updated[lastIndex] = {
                  ...lastMessage,

                  content:
                    lastMessage.content
                    + token,
                };

                return updated;
              }
            );
          },
        }
      );


      // Reload sidebar so a newly-created
      // conversation appears immediately.
      if (conversationId !== null) {
        await loadConversations();
      }

    } catch {

      setError(
        "Failed to send message"
      );

    } finally {

      setLoading(false);
    }
  }


  return (
  <div className="flex h-screen overflow-hidden bg-slate-50">

    {/* SIDEBAR */}
    <aside className="flex w-72 shrink-0 flex-col border-r border-slate-800 bg-slate-950 text-white">

      {/* BRAND */}
      <div className="border-b border-slate-800 px-5 py-5">
        <div className="flex items-center gap-3">

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-950/30">
            <Bot size={22} />
          </div>

          <div>
            <h1 className="font-semibold tracking-tight">
              AI Knowledge
            </h1>

            <p className="text-xs text-slate-400">
              Company Assistant
            </p>
          </div>

        </div>
      </div>


      {/* CURRENT USER */}
      <div className="px-4 pt-4">

        <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 p-3">

          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-800">
            <User
              size={18}
              className="text-slate-300"
            />
          </div>

          <div className="min-w-0">

            <p className="truncate text-sm font-medium text-white">
              {user?.username}
            </p>

            <p className="text-xs text-slate-400">
              {user?.access_level === 2
                ? "Administrator"
                : "Standard user"}
            </p>

          </div>

        </div>

      </div>


      {/* NEW CONVERSATION */}
      <div className="px-4 py-4">

        <button
          onClick={startNewConversation}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500 active:bg-indigo-700"
        >
          <MessageSquarePlus size={17} />
          New conversation
        </button>

      </div>


      {/* CONVERSATIONS */}
      <div className="flex min-h-0 flex-1 flex-col">

        <div className="px-5 pb-2">

          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Conversations
          </p>

        </div>


        <div className="flex-1 overflow-y-auto px-3 pb-4">

          {conversations.length === 0 && (
            <p className="px-2 py-4 text-sm text-slate-500">
              No conversations yet.
            </p>
          )}


          {conversations.map(
            conversation => (

              <div
                key={conversation.id}
                className="group mb-1 flex items-center gap-1"
              >

                <button
                  onClick={() =>
                    selectConversation(
                      conversation.id
                    )
                  }
                  className={`min-w-0 flex-1 truncate rounded-lg px-3 py-2.5 text-left text-sm transition ${
                    activeConversationId ===
                    conversation.id
                      ? "bg-slate-800 font-medium text-white"
                      : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                  }`}
                  title={conversation.title}
                >
                  {conversation.title}
                </button>


                <button
                  onClick={() =>
                    handleDeleteConversation(
                      conversation.id,
                      conversation.title
                    )
                  }
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-600 opacity-0 transition hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
                  title="Delete conversation"
                  aria-label={`Delete ${conversation.title}`}
                >
                  <Trash2 size={15} />
                </button>

              </div>
            )
          )}

        </div>

      </div>


      {/* SIDEBAR FOOTER */}
      <div className="border-t border-slate-800 p-4">

        {user?.access_level === 2 && (

          <button
            onClick={() =>
              navigate("/documents")
            }
            className="mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300 transition hover:bg-slate-900 hover:text-white"
          >
            <FileText size={17} />
            Documents
          </button>

        )}


        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-400 transition hover:bg-slate-900 hover:text-red-400"
        >
          <LogOut size={17} />
          Logout
        </button>

      </div>

    </aside>


    {/* MAIN CHAT */}
    <main className="flex min-w-0 flex-1 flex-col">

      {/* HEADER */}
      <header className="flex h-16 shrink-0 items-center border-b border-slate-200 bg-white px-8">

        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            Knowledge Assistant
          </h2>

          <p className="text-xs text-slate-500">
            Answers are based on documents
            you have permission to access.
          </p>
        </div>

      </header>


      {/* MESSAGES */}
      <section className="flex-1 overflow-y-auto">

        <div className="mx-auto flex min-h-full max-w-4xl flex-col px-6 py-8">

          {messages.length === 0 ? (

            /* EMPTY STATE */
            <div className="m-auto flex max-w-lg flex-col items-center text-center">

              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-indigo-100 bg-indigo-50 text-indigo-600">
                <Bot size={30} />
              </div>

              <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                What would you like to know?
              </h2>

              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                Ask a question about your
                company documents and the
                assistant will search the
                information you are authorized
                to access.
              </p>

            </div>

          ) : (

            <div className="flex flex-col gap-7">

              {messages.map(
                (message, index) => (

                  <div
                    key={index}
                    className={`flex ${
                      message.role === "user"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >

                    <div
                      className={`flex max-w-2xl gap-3 ${
                        message.role === "user"
                          ? "flex-row-reverse"
                          : ""
                      }`}
                    >

                      {/* AVATAR */}
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                          message.role === "user"
                            ? "bg-slate-900 text-white"
                            : "bg-indigo-100 text-indigo-600"
                        }`}
                      >
                        {message.role === "user"
                          ? (
                            <User size={17} />
                          )
                          : (
                            <Bot size={18} />
                          )}
                      </div>


                      <div
                        className={`flex flex-col ${
                          message.role === "user"
                            ? "items-end"
                            : "items-start"
                        }`}
                      >

                        <span className="mb-1.5 px-1 text-xs font-medium text-slate-500">
                          {message.role === "user"
                            ? "You"
                            : "Assistant"}
                        </span>


                        <div
                          className={`whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
                            message.role === "user"
                              ? "rounded-tr-md bg-slate-900 text-white"
                              : "rounded-tl-md border border-slate-200 bg-white text-slate-700"
                          }`}
                        >
                          {message.content ||
                            (
                              loading
                                ? (
                                  <span className="flex items-center gap-1">
                                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
                                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:150ms]" />
                                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:300ms]" />
                                  </span>
                                )
                                : ""
                            )}
                        </div>

                      </div>

                    </div>

                  </div>

                )
              )}

            </div>

          )}


          {error && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

        </div>

      </section>


      {/* INPUT AREA */}
      <footer className="shrink-0 border-t border-slate-200 bg-white px-6 py-4">

        <form
          onSubmit={handleSubmit}
          className="mx-auto flex max-w-4xl items-center gap-3"
        >

          <div className="relative flex-1">

            <input
              value={question}
              onChange={event =>
                setQuestion(
                  event.target.value
                )
              }
              disabled={loading}
              placeholder="Ask about your documents..."
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:bg-slate-100"
            />

          </div>


          <button
            type="submit"
            disabled={
              loading
              || !question.trim()
            }
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm transition hover:bg-indigo-500 active:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            title="Send message"
          >
            <Send size={18} />
          </button>

        </form>


        <p className="mx-auto mt-2 max-w-4xl text-center text-[11px] text-slate-400">
          AI responses are generated from
          accessible knowledge-base documents.
        </p>

      </footer>

    </main>

  </div>
);}