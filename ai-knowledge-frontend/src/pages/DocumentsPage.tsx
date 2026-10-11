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
  deleteDocument,
  getDocuments,
  uploadDocument,
} from "../services/documents";

import type {
  Document,
} from "../types";

import {
  ArrowLeft,
  File,
  FileText,
  Lock,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react";


export default function DocumentsPage() {

  const navigate =
    useNavigate();


  const [
    documents,
    setDocuments,
  ] = useState<Document[]>([]);


  const [
    selectedFile,
    setSelectedFile,
  ] = useState<File | null>(
    null
  );


  const [
    accessLevel,
    setAccessLevel,
  ] = useState(1);


  const [
    loading,
    setLoading,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState("");


  const [
    success,
    setSuccess,
  ] = useState("");


  useEffect(() => {
    loadDocuments();
  }, []);


  async function loadDocuments() {

    try {

      const data =
        await getDocuments();

      setDocuments(data);

    } catch {

      setError(
        "Failed to load documents"
      );
    }
  }


  async function handleUpload(
    event: SyntheticEvent<HTMLFormElement>
  ) {

    event.preventDefault();

    if (!selectedFile) {

      setError(
        "Please select a file"
      );

      return;
    }


    setLoading(true);
    setError("");
    setSuccess("");


    try {

      const uploaded =
        await uploadDocument(
          selectedFile,
          accessLevel
        );


      setSuccess(
        `${uploaded.title} uploaded successfully`
      );


      setSelectedFile(null);

      setAccessLevel(1);


      // Refresh list after upload
      await loadDocuments();

    } catch (error) {

      if (error instanceof Error) {
        setError(
          error.message
        );
      } else {
        setError(
          "Failed to upload document"
        );
      }

    } finally {

      setLoading(false);
    }
  }


  async function handleDelete(
    documentId: number,
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
    setSuccess("");


    try {

      await deleteDocument(
        documentId
      );


      setSuccess(
        `${title} deleted`
      );


      // Remove immediately from UI
      setDocuments(
        current =>
          current.filter(
            document =>
              document.id
              !== documentId
          )
      );

    } catch (error) {

      if (error instanceof Error) {
        setError(
          error.message
        );
      } else {
        setError(
          "Failed to delete document"
        );
      }
    }
  }


 return (
  <main className="min-h-screen bg-slate-50">

    {/* HEADER */}
    <header className="border-b border-slate-200 bg-white">

      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">

        <div className="flex items-center gap-4">

          <button
            onClick={() =>
              navigate("/chat")
            }
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
            title="Back to chat"
          >
            <ArrowLeft size={18} />
          </button>


          <div>

            <h1 className="text-xl font-semibold tracking-tight text-slate-900">
              Knowledge Base
            </h1>

            <p className="mt-0.5 text-sm text-slate-500">
              Manage documents available to the AI assistant.
            </p>

          </div>

        </div>


        <div className="hidden items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 sm:flex">

          <ShieldCheck size={14} />

          Administrator

        </div>

      </div>

    </header>


    <div className="mx-auto max-w-6xl px-6 py-8">

      {/* PAGE OVERVIEW */}
      <section className="mb-8 grid gap-4 sm:grid-cols-3">

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <FileText size={20} />
          </div>

          <p className="text-2xl font-semibold text-slate-900">
            {documents.length}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Total documents
          </p>

        </div>


        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <ShieldCheck size={20} />
          </div>

          <p className="text-2xl font-semibold text-slate-900">

            {
              documents.filter(
                document =>
                  document.required_access_level
                  === 1
              ).length
            }

          </p>

          <p className="mt-1 text-sm text-slate-500">
            Standard access
          </p>

        </div>


        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Lock size={20} />
          </div>

          <p className="text-2xl font-semibold text-slate-900">

            {
              documents.filter(
                document =>
                  document.required_access_level
                  === 2
              ).length
            }

          </p>

          <p className="mt-1 text-sm text-slate-500">
            Restricted access
          </p>

        </div>

      </section>


      {/* UPLOAD CARD */}
      <section className="mb-8 rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b border-slate-200 px-6 py-5">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Upload size={19} />
            </div>

            <div>

              <h2 className="font-semibold text-slate-900">
                Upload document
              </h2>

              <p className="mt-0.5 text-sm text-slate-500">
                Add a PDF or text file to the knowledge base.
              </p>

            </div>

          </div>

        </div>


        <form
          onSubmit={handleUpload}
          className="p-6"
        >

          <div className="grid gap-6 lg:grid-cols-[1fr_260px]">

            {/* FILE INPUT */}
            <div>

              <label className="mb-2 block text-sm font-medium text-slate-700">
                Document
              </label>


              <label
                htmlFor="document-file"
                className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center transition hover:border-indigo-400 hover:bg-indigo-50/50"
              >

                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
                  <File size={20} />
                </div>


                {selectedFile ? (
                  <>
                    <p className="max-w-full truncate text-sm font-medium text-slate-800">
                      {selectedFile.name}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Click to choose another file
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-slate-700">
                      Choose a file to upload
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      PDF or TXT
                    </p>
                  </>
                )}


                <input
                  id="document-file"
                  type="file"
                  accept=".pdf,.txt"
                  className="hidden"
                  onChange={event => {

                    const file =
                      event
                        .target
                        .files?.[0];

                    setSelectedFile(
                      file ?? null
                    );
                  }}
                />

              </label>

            </div>


            {/* ACCESS LEVEL */}
            <div>

              <label
                htmlFor="access-level"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Access level
              </label>


              <select
                id="access-level"
                value={accessLevel}
                onChange={event =>
                  setAccessLevel(
                    Number(
                      event.target.value
                    )
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
              >

                <option value={1}>
                  Level 1 — Standard
                </option>

                <option value={2}>
                  Level 2 — Restricted
                </option>

              </select>


              <div className="mt-4 rounded-xl bg-slate-50 p-4">

                <div className="flex gap-3">

                  <Lock
                    size={17}
                    className="mt-0.5 shrink-0 text-slate-400"
                  />

                  <p className="text-xs leading-5 text-slate-500">

                    {accessLevel === 1
                      ? "All authenticated users can retrieve information from this document."
                      : "Only administrators and level 2 users can retrieve information from this document."}

                  </p>

                </div>

              </div>

            </div>

          </div>


          {/* MESSAGES */}
          {error && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}


          {success && (
            <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {success}
            </div>
          )}


          {/* UPLOAD BUTTON */}
          <div className="mt-6 flex justify-end">

            <button
              type="submit"
              disabled={
                loading
                || !selectedFile
              }
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 active:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >

              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload size={17} />
                  Upload document
                </>
              )}

            </button>

          </div>

        </form>

      </section>


      {/* DOCUMENT LIST */}
      <section>

        <div className="mb-4">

          <h2 className="text-lg font-semibold text-slate-900">
            Documents
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Files currently available to the knowledge system.
          </p>

        </div>


        {documents.length === 0 ? (

          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">

            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
              <FileText size={22} />
            </div>

            <h3 className="font-medium text-slate-900">
              No documents yet
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Upload your first document to populate the knowledge base.
            </p>

          </div>

        ) : (

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            {documents.map(
              (document, index) => (

                <article
                  key={document.id}
                  className={`flex items-center justify-between gap-6 px-6 py-5 ${
                    index !==
                    documents.length - 1
                      ? "border-b border-slate-200"
                      : ""
                  }`}
                >

                  <div className="flex min-w-0 items-center gap-4">

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                      <FileText size={20} />
                    </div>


                    <div className="min-w-0">

                      <p className="truncate font-medium text-slate-900">
                        {document.title}
                      </p>


                      <div className="mt-1.5 flex flex-wrap items-center gap-2">

                        <span className="text-xs text-slate-400">
                          ID #{document.id}
                        </span>


                        {document.required_access_level === 2 ? (

                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-200">
                            <Lock size={11} />
                            Restricted
                          </span>

                        ) : (

                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
                            <ShieldCheck size={11} />
                            Standard
                          </span>

                        )}

                      </div>

                    </div>

                  </div>


                  <button
                    onClick={() =>
                      handleDelete(
                        document.id,
                        document.title
                      )
                    }
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                    title="Delete document"
                    aria-label={`Delete ${document.title}`}
                  >
                    <Trash2 size={17} />
                  </button>

                </article>

              )
            )}

          </div>

        )}

      </section>

    </div>

  </main>
);
}