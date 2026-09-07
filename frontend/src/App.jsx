import { useState, useEffect } from "react";

function App() {
  const [activePage, setActivePage] = useState("Inbox");
  const [showCompose, setShowCompose] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState(null);

  const [to, setTo] = useState("");
const [subject, setSubject] = useState("");
const [body, setBody] = useState("");

const [emailBody, setEmailBody] = useState("");

  const [emails, setEmails] = useState([]);
const [loading, setLoading] = useState(true);

const [sentEmails, setSentEmails] = useState([]);
const [starredEmails, setStarredEmails] = useState([]);
const [trashEmails, setTrashEmails] = useState([]);

const [emailFilter, setEmailFilter] = useState("all");
const [searchText, setSearchText] = useState("");

const [aiMessage, setAiMessage] = useState("");

useEffect(() => {
  fetch("http://localhost:5000/api/emails", {
    credentials: "include",
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch emails");
      }
      return response.json();
    })
    .then((data) => {
      const formattedEmails = data.map((email) => {
        // Get sender name from Gmail's From field
        let sender = email.from;

        if (email.from.includes("<")) {
          sender = email.from.split("<")[0].trim();
        }

        return {
          id: email.id,
          sender: sender,
          email: email.from,
          subject: email.subject || "(No Subject)",
          preview: email.snippet,
          time: new Date(email.date).toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          }),
          unread: email.unread,
        };
      });

      setEmails(formattedEmails);
      setLoading(false);
    })
    .catch((error) => {
      console.error("Error loading emails:", error);
      setLoading(false);
    });
}, []);

useEffect(() => {
  const refreshEmails = () => {
    // Refresh Inbox
    fetch("http://localhost:5000/api/emails", {
      credentials: "include",
    })
      .then((response) => response.json())
      .then((data) => {
        const formattedEmails = data.map((email) => {
          let sender = email.from;

          if (email.from.includes("<")) {
            sender = email.from.split("<")[0].trim();
          }

          return {
            id: email.id,
            sender: sender,
            email: email.from,
            subject: email.subject || "(No Subject)",
            preview: email.snippet,
            time: new Date(email.date).toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
            }),
            unread: email.unread,
          };
        });

        setEmails(formattedEmails);
      })
      .catch((error) => {
        console.error("Error refreshing emails:", error);
      });

    // Refresh Sent
    if (activePage === "Sent") {
      fetch("http://localhost:5000/api/sent", {
        credentials: "include",
      })
        .then((response) => response.json())
        .then((data) => {
          const formattedSentEmails = data.map((email) => ({
            id: email.id,
            sender: email.to || "Unknown",
            email: email.to || "",
            subject: email.subject || "(No Subject)",
            preview: email.snippet || "",
            time: new Date(email.date).toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
            }),
            unread: false,
          }));

          setSentEmails(formattedSentEmails);
        })
        .catch((error) => {
          console.error("Error refreshing sent emails:", error);
        });
    }
  };

  const interval = setInterval(refreshEmails, 30000);

  return () => clearInterval(interval);
}, [activePage]);

useEffect(() => {
  if (activePage !== "Sent") return;

  fetch("http://localhost:5000/api/sent", {
    credentials: "include",
  })
    .then((response) => response.json())
    .then((data) => {
      const formattedSentEmails = data.map((email) => ({
        id: email.id,
        sender: email.to || "Unknown",
        email: email.to || "",
        subject: email.subject || "(No Subject)",
        preview: email.snippet || "",
        time: new Date(email.date).toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        }),
        unread: false,
      }));

      setSentEmails(formattedSentEmails);
    })
    .catch((error) => {
      console.error("Error loading sent emails:", error);
    });
}, [activePage]);

useEffect(() => {
  if (activePage !== "Starred") return;

  fetch("http://localhost:5000/api/starred", {
    credentials: "include",
  })
    .then((response) => response.json())
    .then((data) => {
      const formattedStarredEmails = data.map((email) => {
        let sender = email.from;

        if (email.from.includes("<")) {
          sender = email.from.split("<")[0].trim();
        }

        return {
          id: email.id,
          sender: sender,
          email: email.from,
          subject: email.subject || "(No Subject)",
          preview: email.snippet || "",
          time: new Date(email.date).toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          }),
          unread: email.unread,
        };
      });

      setStarredEmails(formattedStarredEmails);
    })
    .catch((error) => {
      console.error("Error loading starred emails:", error);
    });
}, [activePage]);

useEffect(() => {
  if (activePage !== "Trash") return;

  fetch("http://localhost:5000/api/trash", {
    credentials: "include",
  })
    .then((response) => response.json())
    .then((data) => {
      const formattedTrashEmails = data.map((email) => {
        let sender = email.from;

        if (email.from.includes("<")) {
          sender = email.from.split("<")[0].trim();
        }

        return {
          id: email.id,
          sender: sender,
          email: email.from,
          subject: email.subject || "(No Subject)",
          preview: email.snippet || "",
          time: new Date(email.date).toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          }),
          unread: email.unread,
        };
      });

      setTrashEmails(formattedTrashEmails);
    })
    .catch((error) => {
      console.error("Error loading trash emails:", error);
    });
}, [activePage]);

useEffect(() => {
  if (!selectedEmail) return;

  fetch(`http://localhost:5000/api/emails/${selectedEmail.id}`, {
    credentials: "include",
  })
    .then((response) => response.json())
    .then((data) => {
      setEmailBody(data.body || "No message content available.");
    })
    .catch((error) => {
      console.error("Error loading email:", error);
      setEmailBody("Could not load the email content.");
    });
}, [selectedEmail]);

  return (
    <div className="app">
      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          font-family: Arial, sans-serif;
          background: #f5f7fb;
        }

        .app {
          display: flex;
          height: 100vh;
          color: #202124;
        }

        /* SIDEBAR */
        .sidebar {
          width: 230px;
          background: white;
          border-right: 1px solid #e5e7eb;
          padding: 25px 15px;
        }

        .logo {
          font-size: 22px;
          font-weight: bold;
          margin-bottom: 30px;
          padding-left: 10px;
        }

        .logo span {
          color: #6c63ff;
        }

        .compose-btn {
          width: 100%;
          padding: 13px;
          border: none;
          border-radius: 10px;
          background: #6c63ff;
          color: white;
          font-size: 15px;
          cursor: pointer;
          margin-bottom: 25px;
        }

        .compose-btn:hover {
          background: #574fd6;
        }

        .nav-item {
          padding: 12px;
          border-radius: 8px;
          cursor: pointer;
          margin-bottom: 5px;
          font-size: 15px;
        }

        .nav-item:hover {
          background: #f0efff;
        }

        .nav-item.active {
          background: #ecebff;
          color: #574fd6;
          font-weight: bold;
        }

        /* MAIN */
        .main {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .topbar {
          height: 70px;
          background: white;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          padding: 0 25px;
          gap: 15px;
        }

        .search {
          flex: 1;
          max-width: 600px;
          padding: 12px 18px;
          border: 1px solid #ddd;
          border-radius: 25px;
          font-size: 14px;
          outline: none;
        }

        .search:focus {
          border-color: #6c63ff;
        }

        .content {
          padding: 25px;
          overflow-y: auto;
        }

        .page-title {
          font-size: 25px;
          margin-bottom: 20px;
        }

        /* EMAIL LIST */
        .email-list {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #e5e7eb;
        }

        .email {
          display: grid;
          grid-template-columns: 180px 1fr 90px;
          gap: 15px;
          padding: 18px 20px;
          border-bottom: 1px solid #eee;
          cursor: pointer;
        }

        .email:last-child {
          border-bottom: none;
        }

        .email:hover {
          background: #f8f8ff;
        }

        .sender {
          font-weight: 500;
        }

        .unread .sender,
        .unread .subject {
          font-weight: bold;
        }

        .email-preview {
          color: #777;
          margin-top: 5px;
          font-size: 14px;
        }

        .time {
          color: #777;
          font-size: 13px;
          text-align: right;
        }

        /* AI PANEL */
        .ai-panel {
          width: 320px;
          background: white;
          border-left: 1px solid #e5e7eb;
          padding: 25px;
          display: flex;
          flex-direction: column;
        }

        .ai-title {
          font-size: 19px;
          font-weight: bold;
          margin-bottom: 8px;
        }

        .ai-subtitle {
          color: #777;
          font-size: 13px;
          margin-bottom: 20px;
        }

        .suggestion {
          background: #f3f2ff;
          padding: 12px;
          border-radius: 8px;
          font-size: 13px;
          margin-bottom: 10px;
          cursor: pointer;
        }

        .suggestion:hover {
          background: #e8e6ff;
        }

        .ai-input {
          margin-top: auto;
          padding: 13px;
          border: 1px solid #ddd;
          border-radius: 10px;
          outline: none;
        }

        /* COMPOSE */
        .overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.35);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .compose {
          width: 500px;
          background: white;
          border-radius: 12px;
          padding: 25px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        }

        .compose-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .compose-header h2 {
          margin: 0;
        }

        .close {
          border: none;
          background: none;
          font-size: 20px;
          cursor: pointer;
        }

        .compose input,
        .compose textarea {
          width: 100%;
          padding: 12px;
          margin-bottom: 12px;
          border: 1px solid #ddd;
          border-radius: 7px;
          font-family: Arial;
        }

        .compose textarea {
          height: 180px;
          resize: none;
        }

        .send-btn {
          background: #6c63ff;
          color: white;
          border: none;
          padding: 12px 25px;
          border-radius: 7px;
          cursor: pointer;
        }

        /* EMAIL DETAIL */
        .back {
          border: none;
          background: #eee;
          padding: 8px 15px;
          border-radius: 6px;
          cursor: pointer;
          margin-bottom: 20px;
        }

        .detail {
          background: white;
          padding: 30px;
          border-radius: 12px;
        }

        .detail h2 {
          margin-bottom: 10px;
        }

        .detail-meta {
          color: #777;
          margin-bottom: 25px;
        }

        .detail-body {
          line-height: 1.7;
        }
      `}</style>

      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="logo">
          ✉️ <span>AI Mail</span>
        </div>

        <button
          className="compose-btn"
          onClick={() => setShowCompose(true)}
        >
          ✏️ Compose
        </button>

        <div
          className={`nav-item ${activePage === "Inbox" ? "active" : ""}`}
          onClick={() => {
  setActivePage("Inbox");
  setSelectedEmail(null);
  setEmailFilter("all");
  setAiMessage("");
}}
        >
          📥 Inbox
        </div>

        <div
          className={`nav-item ${activePage === "Sent" ? "active" : ""}`}
          onClick={() => {
            setActivePage("Sent");
            setSelectedEmail(null);
          }}
        >
          📤 Sent
        </div>

        <div
  className={`nav-item ${activePage === "Starred" ? "active" : ""}`}
  onClick={() => {
    setActivePage("Starred");
    setSelectedEmail(null);
  }}
>
  ⭐ Starred
</div>
        <div
  className={`nav-item ${activePage === "Trash" ? "active" : ""}`}
  onClick={() => {
    setActivePage("Trash");
    setSelectedEmail(null);
  }}
>
  🗑️ Trash
</div>
      </aside>

      {/* MAIN AREA */}
      <main className="main">
        <header className="topbar">
          <input
  className="search"
  placeholder="🔍 Search emails..."
  onChange={(e) => {
  const search = e.target.value.toLowerCase();

  setSearchText(search);

  if (search === "") {
    setEmailFilter("all");
    setAiMessage("");
    return;
  }

  setEmailFilter("search");
  setAiMessage(`Searching for "${e.target.value}"`);
}}
/>
        </header>

        <section className="content">
          {!selectedEmail ? (
            <>
              <h1 className="page-title">{activePage}</h1>

              <div className="email-list">
                {(activePage === "Sent"
  ? sentEmails
  : activePage === "Starred"
  ? starredEmails
  : activePage === "Trash"
  ? trashEmails
  : emailFilter === "unread"
  ? emails.filter((email) => email.unread)
  : emailFilter === "Spotify"
  ? emails.filter((email) =>
      `${email.sender} ${email.email}`.toLowerCase().includes("spotify")
    )
  : emailFilter === "search"
  ? emails.filter((email) =>
      `${email.sender} ${email.email} ${email.subject} ${email.preview}`
        .toLowerCase()
        .includes(searchText)
    )
  : emails
).map((email) => (
                  <div
                    key={email.id}
                    className={`email ${email.unread ? "unread" : ""}`}
                    onClick={() => setSelectedEmail(email)}
                  >
                    <div className="sender">{email.sender}</div>

                    <div>
                      <div className="subject">{email.subject}</div>
                      <div className="email-preview">
                        {email.preview}
                      </div>
                    </div>

                    <div className="time">{email.time}</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <button
                className="back"
                onClick={() => setSelectedEmail(null)}
              >
                ← Back
              </button>

              <div className="detail">
                <h2>{selectedEmail.subject}</h2>

                <div className="detail-meta">
                  From: {selectedEmail.sender} &lt;{selectedEmail.email}&gt;
                </div>

                <div className="detail-body">
  <p>{emailBody}</p>
</div>

<button
  className="send-btn"
  onClick={() => {
    const replyTo = selectedEmail.email.includes("<")
      ? selectedEmail.email.split("<")[1].replace(">", "").trim()
      : selectedEmail.email;

    setTo(replyTo);

    setSubject(
      selectedEmail.subject.startsWith("Re:")
        ? selectedEmail.subject
        : `Re: ${selectedEmail.subject}`
    );

    setBody("");

    setShowCompose(true);
    setAiMessage("Opening a reply to this email.");
  }}
>
  ↩️ Reply
</button>

              </div>
            </>
          )}
        </section>
      </main>

      {/* AI ASSISTANT */}
      <aside className="ai-panel">
        <div className="ai-title">🤖 AI Assistant</div>

        <div className="ai-subtitle">
          Tell me what you want to do with your emails.
        </div>

        {aiMessage && (
  <div
    style={{
      background: "#f3f2ff",
      padding: "12px",
      borderRadius: "8px",
      marginBottom: "15px",
      fontSize: "13px",
    }}
  >
    🤖 {aiMessage}
  </div>
)}

        <div
  className="suggestion"
  onClick={() => {
  const unreadEmails = emails.filter((email) => email.unread);

  setEmailFilter("unread");

  setAiMessage(
    unreadEmails.length > 0
      ? `Showing ${unreadEmails.length} unread emails.`
      : "You have no unread emails."
  );
}}
>
  "Show my unread emails"
</div>

       <div
  className="suggestion"
  onClick={() => {
    const spotifyEmails = emails.filter((email) =>
      `${email.sender} ${email.email} ${email.subject} ${email.preview}`
        .toLowerCase()
        .includes("spotify")
    );

    setEmailFilter("Spotify");

    setAiMessage(
      spotifyEmails.length > 0
        ? `Showing ${spotifyEmails.length} emails from Spotify.`
        : "I couldn't find any emails from Spotify."
    );
  }}
>
  "Find emails from Spotify"
</div>

        <div
  className="suggestion"
  onClick={() => {
    if (emails.length > 0) {
      setSelectedEmail(emails[0]);
      setAiMessage("Opening the latest email.");
    } else {
      setAiMessage("No emails found.");
    }
  }}
>
  "Open the latest email"
</div>

        <div
  className="suggestion"
  onClick={() => {
    setShowCompose(true);
    setAiMessage("Opening the compose window.");
  }}
>
  "Compose an email"
</div>

        <input
  className="ai-input"
  placeholder="Ask AI something..."
  onKeyDown={(e) => {
    if (e.key === "Enter") {
      const command = e.target.value.toLowerCase();
      if (
  command.includes("go to trash") ||
  command.includes("open trash") ||
  command.includes("show trash")
) {
  setActivePage("Trash");
  setSelectedEmail(null);
  setAiMessage("🗑️ Showing your trash emails.");
}

      else if (
  command.includes("go to starred") ||
  command.includes("open starred") ||
  command.includes("show starred")
) {
  setActivePage("Starred");
  setSelectedEmail(null);
  setAiMessage("⭐ Showing your starred emails.");
}
else if (
  command.includes("go to sent") ||
  command.includes("open sent") ||
  command.includes("show sent")
) {
  setActivePage("Sent");
  setSelectedEmail(null);
  setAiMessage("📤 Showing your sent emails.");
}
else if (
  command.includes("go to inbox") ||
  command.includes("open inbox") ||
  command.includes("show inbox")
) {
  setActivePage("Inbox");
  setSelectedEmail(null);
  setEmailFilter("all");
  setAiMessage("📥 Showing your inbox.");
}
else if (command.includes("reply")) {

      
  if (selectedEmail) {
    const replyTo = selectedEmail.email.includes("<")
      ? selectedEmail.email.split("<")[1].replace(">", "").trim()
      : selectedEmail.email;

    setTo(replyTo);

    setSubject(
      selectedEmail.subject.startsWith("Re:")
        ? selectedEmail.subject
        : `Re: ${selectedEmail.subject}`
    );

    setBody("");
    setShowCompose(true);
    setAiMessage(`Opening a reply to ${selectedEmail.sender}.`);
  } else {
    setAiMessage("Please open an email first so I know which email to reply to.");
  }
}
else if (
  command.includes("summarize") ||
  command.includes("summary")
) {
  if (!selectedEmail) {
    setAiMessage("Please open an email first so I can summarize it.");
  } else {
    setAiMessage("🤖 Thinking...");

    fetch("http://localhost:5000/api/ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        message: command,
        email: emailBody,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          setAiMessage(data.answer);
        } else {
          setAiMessage(data.error || "AI could not summarize the email.");
        }
      })
      .catch((error) => {
        console.error("AI error:", error);
        setAiMessage("Could not connect to the AI service.");
      });
  }

  
}

else if (command.includes("unread")) {

      
        const unreadEmails = emails.filter((email) => email.unread);
        setEmailFilter("unread");
        setAiMessage(
          unreadEmails.length > 0
            ? `Showing ${unreadEmails.length} unread emails.`
            : "You have no unread emails."
        );
      }

      else if (command.includes("spotify")) {
        const spotifyEmails = emails.filter((email) =>
          `${email.sender} ${email.email} ${email.subject} ${email.preview}`
            .toLowerCase()
            .includes("spotify")
        );

        setEmailFilter("Spotify");
        setAiMessage(
          spotifyEmails.length > 0
            ? `Showing ${spotifyEmails.length} emails from Spotify.`
            : "I couldn't find any emails from Spotify."
        );
      }

      else if (
  command.includes("latest") ||
  command.includes("newest") ||
  command.includes("most recent")
) {
  if (emails.length > 0) {
    setSelectedEmail(emails[0]);
    setAiMessage("Opening the latest email.");
  } else {
    setAiMessage("No emails found.");
  }
}

      else if (command.includes("compose") || command.includes("write")) {
  setAiMessage("🤖 Writing your email...");

  fetch("http://localhost:5000/api/ai-compose", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      message: command,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        const result = data.result;

        const subjectMatch = result.match(/SUBJECT:\s*(.*)/i);
        const bodyMatch = result.match(/BODY:\s*([\s\S]*)/i);

        setSubject(
          subjectMatch ? subjectMatch[1].trim() : ""
        );

        setBody(
          bodyMatch ? bodyMatch[1].trim() : result
        );

        setTo("");
        setShowCompose(true);
        setAiMessage("✉️ Email drafted successfully.");
      } else {
        setAiMessage(data.error || "Could not draft the email.");
      }
    })
    .catch((error) => {
      console.error("AI compose error:", error);
      setAiMessage("Could not connect to the AI service.");
    });
}

      else {
  let searchTerm = command
    .replace("find emails about", "")
    .replace("find emails from", "")
    .replace("find emails", "")
    .replace("show emails about", "")
    .replace("show emails from", "")
    .replace("show emails", "")
    .replace("search for", "")
    .replace("search", "")
    .trim();

  const results = emails.filter((email) =>
    `${email.sender} ${email.email} ${email.subject} ${email.preview}`
      .toLowerCase()
      .includes(searchTerm)
  );

  setSearchText(searchTerm);
  setEmailFilter("search");

  setAiMessage(
    results.length > 0
      ? `Found ${results.length} emails matching "${searchTerm}".`
      : `I couldn't find any emails matching "${searchTerm}".`
  );
}

      

      e.target.value = "";
    }
  }}
/>
      </aside>

      {/* COMPOSE WINDOW */}
      {showCompose && (
        <div className="overlay">
          <div className="compose">
            <div className="compose-header">
              <h2>New Email</h2>

              <button
                className="close"
                onClick={() => setShowCompose(false)}
              >
                ✕
              </button>
            </div>

            <input
  placeholder="To"
  value={to}
  onChange={(e) => setTo(e.target.value)}
/>

<input
  placeholder="Subject"
  value={subject}
  onChange={(e) => setSubject(e.target.value)}
/>

<textarea
  placeholder="Write your message..."
  value={body}
  onChange={(e) => setBody(e.target.value)}
/>
            
            

            <button
  className="send-btn"
  onClick={async () => {
    const confirmSend = window.confirm(
  `Send this email to ${to}?`
);

if (!confirmSend) {
  return;
}
  if (!to || !subject || !body) {
    alert("Please fill in To, Subject and Message.");
    return;
  }

  try {
    const response = await fetch(
      "http://localhost:5000/api/send-email",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          to: to,
          subject: subject,
          body: body,
        }),
      }
    );

    const data = await response.json();

    if (data.success) {
      alert("Email sent successfully! 📧");

      setTo("");
      setSubject("");
      setBody("");
      setShowCompose(false);
    } else {
      alert(data.error || "Failed to send email.");
    }
  } catch (error) {
    console.error(error);
    alert("Could not connect to the backend.");
  }
}}
>
  Send
</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;