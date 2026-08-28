"use client";

import { useState } from "react";
import {
  Bot,
  BrainCircuit,
  Check,
  ChevronRight,
  CircleHelp,
  ImageIcon,
  MessageCircle,
  Plus,
  Search,
  Send,
  Sparkles,
  Star,
  Tag,
  TrendingUp,
  Upload,
  WandSparkles,
} from "lucide-react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ShamsiyaDashboard, { Sidebar, Topbar } from "./shamsiya-dashboard";

const activity = [
  { day: "Mon", chats: 42, recs: 74 },
  { day: "Tue", chats: 58, recs: 88 },
  { day: "Wed", chats: 51, recs: 92 },
  { day: "Thu", chats: 73, recs: 106 },
  { day: "Fri", chats: 84, recs: 118 },
  { day: "Sat", chats: 96, recs: 131 },
  { day: "Sun", chats: 112, recs: 145 },
];
const labels = ["Mandi", "Jollof Rice", "Suya", "Pepper Chicken", "Fried Rice"];
function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="dashboard-app">
      <Sidebar open={false} setOpen={() => {}} />
      <div className="app-canvas">
        <Topbar setOpen={() => {}} />
        {children}
      </div>
    </div>
  );
}
function Header({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-heading ai-page-heading">
      <div>
        <div className="breadcrumbs">
          <span>Dashboard</span>
          <ChevronRight /> <span>AI Management</span>
        </div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {action}
    </div>
  );
}
export function AiAssistant() {
  const [sent, setSent] = useState(false);
  return (
    <Frame>
      <main className="page-main ai-main">
        <Header
          title="AI Assistant"
          subtitle="Configure your intelligent food assistant and see it in action."
          action={
            <span className="ai-status">
              <i /> AI system online
            </span>
          }
        />
        <div className="ai-layout">
          <section className="panel assistant-config">
            <div className="panel-header">
              <div>
                <h2>Assistant configuration</h2>
                <p>Shape how your assistant supports Shamsiya customers.</p>
              </div>
              <WandSparkles />
            </div>
            <div className="assistant-form">
              <label>
                Assistant name
                <input defaultValue="Shamsiya Food Assistant" />
              </label>
              <label>
                Welcome message
                <textarea
                  defaultValue="Hi there. What delicious meal can I help you discover today?"
                  rows={3}
                />
              </label>
              <label>
                Personality
                <select defaultValue="Warm & helpful">
                  <option>Warm & helpful</option>
                  <option>Professional</option>
                  <option>Playful</option>
                </select>
              </label>
              <label>
                Knowledge sources
                <div className="knowledge-list">
                  <span>
                    <Check />
                    Menu and food catalogue
                  </span>
                  <span>
                    <Check />
                    Delivery and ordering FAQs
                  </span>
                  <span>
                    <Check />
                    Current promotions
                  </span>
                </div>
              </label>
              <button className="primary-button" onClick={() => setSent(true)}>
                <Check />
                Save changes
              </button>
              {sent && (
                <small className="save-note">Assistant settings saved</small>
              )}
            </div>
          </section>
          <section className="panel chat-preview">
            <div className="panel-header">
              <div>
                <h2>Live preview</h2>
                <p>Test the assistant before customers see it.</p>
              </div>
              <span className="preview-label">
                <i /> Preview
              </span>
            </div>
            <div className="chat-window">
              <div className="chat-head">
                <div className="chat-bot">
                  <Bot />
                  <span>
                    <strong>Shamsiya Assistant</strong>
                    <small>Typically replies instantly</small>
                  </span>
                </div>
                <CircleHelp />
              </div>
              <div className="chat-messages">
                <div className="chat-bubble bot">
                  Hi there. What delicious meal can I help you discover today?
                </div>
                <div className="chat-bubble user">
                  I want something spicy for dinner.
                </div>
                <div className="chat-bubble bot">
                  Our Chicken Suya is a customer favourite. Would you like to
                  see it with a cold sobolo?
                </div>
              </div>
              <div className="chat-compose">
                <input placeholder="Ask your assistant..." />
                <button
                  className="icon-button"
                  aria-label="Send"
                  onClick={() => setSent(true)}
                >
                  <Send />
                </button>
              </div>
            </div>
          </section>
        </div>
        <section className="panel recent-conversations">
          <div className="panel-header">
            <div>
              <h2>Recent conversations</h2>
              <p>See what customers are asking your assistant.</p>
            </div>
            <button className="text-button">
              View all <ChevronRight />
            </button>
          </div>
          {[
            "What is the delivery fee to East Legon?",
            "Recommend a meal for four people",
            "Is the family platter available today?",
          ].map((q, i) => (
            <div className="conversation-row" key={q}>
              <span className="conversation-icon">
                <MessageCircle />
              </span>
              <div>
                <strong>{q}</strong>
                <small>
                  {["Ama Mensah", "Kwame Owusu", "Nana Boateng"][i]} · {i + 2}{" "}
                  min ago
                </small>
              </div>
              <b>{[4, 6, 3][i]} messages</b>
              <ChevronRight />
            </div>
          ))}
        </section>
      </main>
    </Frame>
  );
}
export function AiRecommendations() {
  const [period, setPeriod] = useState("7 days");
  return (
    <Frame>
      <main className="page-main ai-main">
        <Header
          title="Recommendations"
          subtitle="Track how AI recommendations are influencing orders."
          action={
            <select
              className="ai-select"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              <option>7 days</option>
              <option>30 days</option>
              <option>3 months</option>
            </select>
          }
        />
        <div className="stats-grid ai-stats">
          <Stat
            icon={<Sparkles />}
            label="Recommendations shown"
            value="18,462"
            change="+18.4%"
          />
          <Stat
            icon={<TrendingUp />}
            label="Click-through rate"
            value="34.8%"
            change="+6.2%"
          />
          <Stat
            icon={<Tag />}
            label="Added to order"
            value="2,941"
            change="+12.7%"
          />
          <Stat
            icon={<Star />}
            label="Avg. relevance score"
            value="92.4%"
            change="+3.1%"
          />
        </div>
        <div className="ai-chart-grid">
          <section className="panel ai-chart">
            <div className="panel-header">
              <div>
                <h2>AI activity</h2>
                <p>Recommendation impressions and assistant chats</p>
              </div>
              <div className="chart-legend">
                <span>
                  <i className="legend-revenue" /> Recommendations
                </span>
                <span>
                  <i className="legend-orders" /> Chats
                </span>
              </div>
            </div>
            <div className="ai-chart-canvas">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activity}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="recs"
                    stroke="#bd7338"
                    strokeWidth={3}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="chats"
                    stroke="#633e2d"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
          <section className="panel ai-insight">
            <div className="panel-header">
              <div>
                <h2>AI insight</h2>
                <p>Generated from recent behaviour</p>
              </div>
              <BrainCircuit />
            </div>
            <div className="insight-copy">
              <Sparkles />
              <strong>Spicy meals are trending</strong>
              <p>
                Customers who view Jollof Rice are 42% more likely to add Suya
                to their order this week.
              </p>
              <button className="secondary-button">
                Create a promotion <ChevronRight />
              </button>
            </div>
          </section>
        </div>
        <section className="panel ai-table">
          <div className="panel-header">
            <div>
              <h2>Recommendation performance</h2>
              <p>See which recommendations are converting best.</p>
            </div>
            <button className="secondary-button">
              <Upload /> Export data
            </button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Food</th>
                  <th>Shown</th>
                  <th>Clicks</th>
                  <th>Added to order</th>
                  <th>Conversion</th>
                  <th>Rating</th>
                </tr>
              </thead>
              <tbody>
                {labels.map((x, i) => (
                  <tr key={x}>
                    <td>
                      <strong>{x}</strong>
                      <small>Popular recommendation</small>
                    </td>
                    <td>
                      {[4820, 4112, 3858, 2940, 2732][i].toLocaleString()}
                    </td>
                    <td>{[1842, 1620, 1420, 1124, 984][i].toLocaleString()}</td>
                    <td>{[612, 548, 493, 392, 310][i]}</td>
                    <td>
                      <span className="ai-conversion">
                        {[33.2, 33.8, 34.7, 35.2, 31.5][i]}%
                      </span>
                    </td>
                    <td>
                      <span className="food-rating">
                        <Star /> {[4.8, 4.7, 4.9, 4.6, 4.5][i]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </Frame>
  );
}
function Stat({
  icon,
  label,
  value,
  change,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  change: string;
}) {
  return (
    <div className="stat-card ai-stat">
      <div className="stat-head">
        <span className="stat-icon">{icon}</span>
        <span className="trend-up">{change}</span>
      </div>
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
      <small>vs previous period</small>
    </div>
  );
}
export function AiImageRecognition() {
  const [scanned, setScanned] = useState(false);
  return (
    <Frame>
      <main className="page-main ai-main">
        <Header
          title="Image recognition"
          subtitle="Scan food photos and keep your menu labels accurate."
          action={
            <button className="primary-button" onClick={() => setScanned(true)}>
              <Upload /> Scan new image
            </button>
          }
        />
        <div className="stats-grid ai-stats">
          <Stat
            icon={<ImageIcon />}
            label="Images scanned"
            value="1,284"
            change="+24.6%"
          />
          <Stat
            icon={<Check />}
            label="Avg. confidence"
            value="96.8%"
            change="+2.4%"
          />
          <Stat
            icon={<Tag />}
            label="Labels confirmed"
            value="1,129"
            change="+14.2%"
          />
          <Stat
            icon={<CircleHelp />}
            label="Needs review"
            value="18"
            change="-8.5%"
          />
        </div>
        <div className="scan-layout">
          <section className="panel scan-upload">
            <div className="panel-header">
              <div>
                <h2>Scan a food image</h2>
                <p>AI will identify dishes and suggest menu labels.</p>
              </div>
              <ImageIcon />
            </div>
            <div className="scan-drop">
              <Upload />
              <strong>Drop an image here</strong>
              <span>or browse from your device · JPG, PNG up to 10MB</span>
              <button
                className="secondary-button"
                onClick={() => setScanned(true)}
              >
                Choose image
              </button>
              {scanned && (
                <small className="save-note">
                  Image scan queued for review
                </small>
              )}
            </div>
          </section>
          <section className="panel mapping-panel">
            <div className="panel-header">
              <div>
                <h2>AI label mapping</h2>
                <p>Control how recognition results appear in your menu.</p>
              </div>
              <Tag />
            </div>
            {labels.slice(0, 4).map((x, i) => (
              <div className="mapping-row" key={x}>
                <span className="mapping-food">
                  {["🍛", "🍚", "🍢", "🍗"][i]}
                </span>
                <div>
                  <strong>{x}</strong>
                  <small>Suggested menu label</small>
                </div>
                <select defaultValue={x}>
                  <option>{x}</option>
                  <option>Uncategorized</option>
                  <option>Chef special</option>
                </select>
                <Check />
              </div>
            ))}
          </section>
        </div>
        <section className="panel ai-table">
          <div className="panel-header">
            <div>
              <h2>Recent scans</h2>
              <p>Review the latest image recognition results.</p>
            </div>
            <button className="text-button">
              View all <ChevronRight />
            </button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Detected label</th>
                  <th>Confidence</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Scanned</th>
                </tr>
              </thead>
              <tbody>
                {[
                  "Mandi Chicken",
                  "Jollof Rice",
                  "Beef Suya",
                  "Pepper Chicken",
                ].map((x, i) => (
                  <tr key={x}>
                    <td>
                      <span className="scan-thumb">
                        {["🍛", "🍚", "🍢", "🍗"][i]}
                      </span>
                    </td>
                    <td>
                      <strong>{x}</strong>
                      <small>AI detected</small>
                    </td>
                    <td>
                      <span className="confidence-badge">
                        {[98, 97, 95, 91][i]}%
                      </span>
                    </td>
                    <td>
                      {
                        ["Main dishes", "Rice dishes", "Grills", "Main dishes"][
                          i
                        ]
                      }
                    </td>
                    <td>
                      <span className="status-badge status-ready">
                        <span />
                        {i === 3 ? "Needs review" : "Confirmed"}
                      </span>
                    </td>
                    <td>
                      {i + 1} hour{i ? "s" : ""} ago
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </Frame>
  );
}
