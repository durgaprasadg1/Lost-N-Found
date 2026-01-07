"use client";

import { useEffect } from "react";

export default function AdminRegisterInfo() {
  useEffect(() => {
    // Prevent accidental access
    console.log("Admin registration is only available via API");
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-2xl bg-white p-8 rounded-xl shadow border">
        <h1 className="text-3xl font-bold text-center text-slate-800 mb-4">
          Admin Registration
        </h1>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-800">
            ⚠️ Admin registration is only available via API for security
            reasons.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">API Endpoint</h2>
            <code className="block bg-gray-100 p-3 rounded text-sm">
              POST /api/admin/register
            </code>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">Request Body</h2>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
              {`{
  "name": "Admin Name",
  "email": "admin@example.com",
  "password": "SecurePassword123"
}`}
            </pre>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">
              Using Postman / Thunder Client / Hoppscotch
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Set method to POST</li>
              <li>
                Enter URL:{" "}
                <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                  {typeof window !== "undefined" ? window.location.origin : ""}
                  /api/admin/register
                </code>
              </li>
              <li>Set Content-Type header to application/json</li>
              <li>Add the JSON body with name, email, and password</li>
              <li>Send the request</li>
            </ol>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
            <h3 className="font-semibold text-blue-900 mb-2">Note:</h3>
            <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
              <li>Email must be unique across both admins and users</li>
              <li>Password must be at least 8 characters</li>
              <li>
                After registration, use the unified login page at{" "}
                <a href="/login" className="underline">
                  /login
                </a>
              </li>
              <li>Admin secret is no longer required</li>
            </ul>
          </div>

          <div className="text-center mt-6">
            <a
              href="/login"
              className="text-blue-600 hover:underline font-medium"
            >
              Go to Login Page →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
