import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./MarkdownSummary.css";

const MarkdownSummary = ({ summary, title = "Meeting Summary" }) => {
  if (!summary) {
    return (
      <div className="markdown-summary">
        <div className="summary-header">
          <h3>{title}</h3>
        </div>
        <div className="summary-empty">
          <p>No summary available for this meeting.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="markdown-summary">
      <div className="summary-header">
        <h3>{title}</h3>
      </div>
      <div className="summary-content">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            // Custom components for better styling
            h1: ({ children }) => <h1 className="md-h1">{children}</h1>,
            h2: ({ children }) => <h2 className="md-h2">{children}</h2>,
            h3: ({ children }) => <h3 className="md-h3">{children}</h3>,
            h4: ({ children }) => <h4 className="md-h4">{children}</h4>,
            h5: ({ children }) => <h5 className="md-h5">{children}</h5>,
            h6: ({ children }) => <h6 className="md-h6">{children}</h6>,
            p: ({ children }) => <p className="md-paragraph">{children}</p>,
            ul: ({ children }) => <ul className="md-list">{children}</ul>,
            ol: ({ children }) => <ol className="md-list md-ordered">{children}</ol>,
            li: ({ children }) => <li className="md-list-item">{children}</li>,
            blockquote: ({ children }) => (
              <blockquote className="md-blockquote">{children}</blockquote>
            ),
            code: ({ inline, children }) =>
              inline ? (
                <code className="md-code-inline">{children}</code>
              ) : (
                <pre className="md-code-block">
                  <code>{children}</code>
                </pre>
              ),
            strong: ({ children }) => <strong className="md-strong">{children}</strong>,
            em: ({ children }) => <em className="md-emphasis">{children}</em>,
            a: ({ href, children }) => (
              <a
                href={href}
                className="md-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                {children}
              </a>
            ),
            hr: () => <hr className="md-divider" />,
          }}
        >
          {summary}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export default MarkdownSummary;